import QRCode from 'qrcode';
import crypto from 'node:crypto';

interface ApiRequest {
    method?: string;
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

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const EPHEMERAL_SECRET_COOKIE = 'totp_ephemeral_secret';
const EPHEMERAL_SECRET_MAX_AGE = 600;

function getCookieValue(cookieHeader: string | undefined, name: string): string {
    if (!cookieHeader) return '';
    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
        const [cookieName, ...valueParts] = cookie.split('=');
        if (cookieName?.trim() === name) {
            return valueParts.join('=').trim();
        }
    }
    return '';
}

function encodeBase32(bytes: Buffer): string {
    let bits = 0;
    let value = 0;
    let output = '';

    for (const byte of bytes) {
        value = (value << 8) | byte;
        bits += 8;

        while (bits >= 5) {
            output += BASE32_ALPHABET[(value >> (bits - 5)) & 31];
            bits -= 5;
        }
    }

    if (bits > 0) {
        output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
    }

    return output;
}

function resolveSecret(req: ApiRequest): { secret: string; shouldPersistEphemeralSecret: boolean } {
    const configuredSecret = normalizeBase32(process.env.TOTP_SECRET ?? '');
    if (configuredSecret) {
        return { secret: configuredSecret, shouldPersistEphemeralSecret: false };
    }

    const cookieSecret = normalizeBase32(getCookieValue(req.headers?.cookie, EPHEMERAL_SECRET_COOKIE));
    if (cookieSecret) {
        return { secret: cookieSecret, shouldPersistEphemeralSecret: false };
    }

    const generatedSecret = encodeBase32(crypto.randomBytes(20));
    return { secret: generatedSecret, shouldPersistEphemeralSecret: true };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { secret, shouldPersistEphemeralSecret } = resolveSecret(req);
    if (!secret) {
        return res.status(500).json({ error: 'Unable to resolve TOTP secret.' });
    }

    const issuer = (process.env.TOTP_ISSUER || 'Researcher Portfolio').trim();
    const account = (process.env.TOTP_ACCOUNT || 'researcher').trim();
    const label = `${issuer}:${account}`;
    const setupUri = `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
    const qrDataUrl = await QRCode.toDataURL(setupUri, { width: 220, margin: 1 });

    if (shouldPersistEphemeralSecret) {
        const secure =
            req.headers['x-forwarded-proto'] === 'https' ||
            req.socket?.encrypted === true ||
            req.connection?.encrypted === true;
        const secretCookie = `${EPHEMERAL_SECRET_COOKIE}=${secret}; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}; Max-Age=${EPHEMERAL_SECRET_MAX_AGE}`;
        res.setHeader('Set-Cookie', secretCookie);
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ qrDataUrl });
}
