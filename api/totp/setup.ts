import crypto from 'node:crypto';
import { getCookieValue, hasSetupCookie, shouldUseSecureCookie } from './utils.ts';

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
// 10 minutes (in seconds) to limit ephemeral fallback secret lifetime.
const EPHEMERAL_SECRET_MAX_AGE = 600;
const MIN_COMPARE_BUFFER_SIZE = 64;
const MAX_PASSWORD_BYTES = 512;

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

function resolveSecret(req: ApiRequest): { secret: string; shouldPersistEphemeralSecret: boolean; configuredSecretPresent: boolean } {
    const configuredSecretTrimmed = (process.env.TOTP_SECRET ?? '').trim();
    const configuredSecret = normalizeBase32(configuredSecretTrimmed);
    if (configuredSecretTrimmed) {
        return { secret: configuredSecret, shouldPersistEphemeralSecret: false, configuredSecretPresent: true };
    }

    const cookieSecret = normalizeBase32(getCookieValue(req.headers.cookie, EPHEMERAL_SECRET_COOKIE));
    if (cookieSecret) {
        return { secret: cookieSecret, shouldPersistEphemeralSecret: false, configuredSecretPresent: false };
    }

    // 20 random bytes (~160 bits) aligns with common TOTP secret entropy guidance.
    const generatedSecret = encodeBase32(crypto.randomBytes(20));
    return { secret: generatedSecret, shouldPersistEphemeralSecret: true, configuredSecretPresent: false };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { secret, shouldPersistEphemeralSecret, configuredSecretPresent } = resolveSecret(req);
    const setupCompleted = hasSetupCookie(req.headers.cookie) || configuredSecretPresent;
    if (setupCompleted) {
        const configuredPassword = process.env.TOTP_QR_PASSWORD;
        if (!configuredPassword || configuredPassword.trim() === '') {
            return res.status(403).json({ error: 'Setup already completed. Configure TOTP_QR_PASSWORD to allow QR regeneration.' });
        }
        const headerValue = req.headers['x-totp-qr-password'];
        const providedPassword = Array.isArray(headerValue) ? headerValue[0] ?? '' : (headerValue ?? '');
        if (providedPassword.trim() === '') {
            return res.status(401).json({ error: 'Password required to generate a new QR code.' });
        }
        const providedBuffer = Buffer.from(providedPassword, 'utf8');
        const configuredBuffer = Buffer.from(configuredPassword, 'utf8');
        if (providedBuffer.length > MAX_PASSWORD_BYTES || configuredBuffer.length > MAX_PASSWORD_BYTES) {
            return res.status(401).json({ error: 'Password required to generate a new QR code.' });
        }
        // Fixed comparison length adds 1 byte to include the original length without leaking user-supplied length.
        const compareLength = Math.max(configuredBuffer.length + 1, MIN_COMPARE_BUFFER_SIZE);
        if (providedBuffer.length > compareLength - 1) {
            return res.status(401).json({ error: 'Password required to generate a new QR code.' });
        }
        const compareProvided = Buffer.alloc(compareLength);
        const compareConfigured = Buffer.alloc(compareLength);
        compareProvided[0] = providedBuffer.length;
        compareConfigured[0] = configuredBuffer.length;
        providedBuffer.copy(compareProvided, 1, 0, Math.min(providedBuffer.length, compareLength - 1));
        configuredBuffer.copy(compareConfigured, 1, 0, Math.min(configuredBuffer.length, compareLength - 1));
        try {
            if (!crypto.timingSafeEqual(compareProvided, compareConfigured)) {
                return res.status(401).json({ error: 'Password required to generate a new QR code.' });
            }
        } catch {
            return res.status(401).json({ error: 'Password required to generate a new QR code.' });
        }
    }

    if (!secret) {
        return res.status(500).json({ error: 'Unable to resolve TOTP secret.' });
    }

    const issuer = (process.env.TOTP_ISSUER || 'Researcher Portfolio').trim();
    const account = (process.env.TOTP_ACCOUNT || 'researcher').trim();
    const label = `${issuer}:${account}`;
    const setupUri = `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
    let qrDataUrl = '';

    try {
        const { default: QRCode } = await import('qrcode');
        qrDataUrl = await QRCode.toDataURL(setupUri, { width: 220, margin: 1 });
    } catch (qrError) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Authenticator QR generation failed; falling back to manual setup.', qrError);
        }
    }

    if (shouldPersistEphemeralSecret) {
        const secure = shouldUseSecureCookie(req);
        const secretCookie = `${EPHEMERAL_SECRET_COOKIE}=${secret}; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}; Max-Age=${EPHEMERAL_SECRET_MAX_AGE}`;
        res.setHeader('Set-Cookie', secretCookie);
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
        qrDataUrl,
        otpauthUri: setupUri,
        secret,
    });
}
