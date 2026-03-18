import crypto from 'node:crypto';
import { getCookieValue, shouldUseSecureCookie } from './utils.ts';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const COOKIE_MAX_AGE = 31_536_000;
const EPHEMERAL_SECRET_COOKIE = 'totp_ephemeral_secret';

interface TotpVerifyRequestBody {
    code?: string;
}

interface ApiRequest {
    method?: string;
    body?: TotpVerifyRequestBody | string;
    headers: Record<string, string | undefined>;
    socket?: {
        encrypted?: boolean;
    };
    connection?: {
        encrypted?: boolean;
    };
}

interface ApiResponse {
    setHeader: (name: string, value: string) => void;
    status: (code: number) => {
        json: (payload: Record<string, unknown>) => void;
    };
}

function normalizeBase32(value: string): string {
    return value.trim().toUpperCase().replace(/\s+/g, '').replace(/=+$/g, '');
}

function resolveSecret(headers: Record<string, string | undefined>): string {
    const configuredSecret = normalizeBase32(process.env.TOTP_SECRET ?? '');
    if (configuredSecret) {
        return configuredSecret;
    }
    return normalizeBase32(getCookieValue(headers.cookie, EPHEMERAL_SECRET_COOKIE));
}

function decodeBase32(secret: string): Buffer | null {
    const normalized = normalizeBase32(secret);
    if (!normalized) return null;

    let bits = 0;
    let current = 0;
    const bytes: number[] = [];

    for (const char of normalized) {
        const index = BASE32_ALPHABET.indexOf(char);
        if (index < 0) return null;
        current = (current << 5) | index;
        bits += 5;
        if (bits >= 8) {
            bits -= 8;
            bytes.push((current >> bits) & 0xff);
        }
    }

    return bytes.length ? Buffer.from(bytes) : null;
}

function generateTotpCode(secretBytes: Buffer, timeStep: number): string {
    const counterBytes = Buffer.alloc(8);
    let counter = timeStep;
    for (let i = 7; i >= 0; i--) {
        counterBytes[i] = counter & 0xff;
        counter = Math.floor(counter / 256);
    }

    const signature = crypto.createHmac('sha1', secretBytes).update(counterBytes).digest();
    const offset = signature[signature.length - 1] & 0x0f;
    const binary =
        ((signature[offset] & 0x7f) << 24) |
        ((signature[offset + 1] & 0xff) << 16) |
        ((signature[offset + 2] & 0xff) << 8) |
        (signature[offset + 3] & 0xff);

    return (binary % 1_000_000).toString().padStart(6, '0');
}

function verifyTotp(secret: string, code: string): boolean {
    if (!/^\d{6}$/.test(code)) return false;
    const secretBytes = decodeBase32(secret);
    if (!secretBytes) return false;

    const currentStep = Math.floor(Date.now() / 1000 / 30);
    for (const drift of [-1, 0, 1]) {
        const expected = generateTotpCode(secretBytes, currentStep + drift);
        if (expected === code) return true;
    }
    return false;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const secret = resolveSecret(req.headers);
    if (!secret) {
        return res.status(500).json({ error: 'TOTP server secret is not configured.' });
    }

    let body: TotpVerifyRequestBody;
    try {
        body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {});
    } catch {
        return res.status(400).json({ error: 'Invalid JSON body.' });
    }
    const code = typeof body?.code === 'string' ? body.code.trim() : '';
    const authorized = verifyTotp(secret, code);

    if (authorized) {
        const secure = shouldUseSecureCookie(req);
        const cookie = `totp_setup_complete=1; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}; Max-Age=${COOKIE_MAX_AGE}`;
        res.setHeader('Set-Cookie', cookie);
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ authorized });
}
