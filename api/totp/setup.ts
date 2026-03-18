import QRCode from 'qrcode';

function normalizeBase32(value: string): string {
    return value.trim().toUpperCase().replace(/\s+/g, '').replace(/=+$/g, '');
}

export default async function handler(req: any, res: any) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const secret = normalizeBase32(process.env.TOTP_SECRET ?? '');
    if (!secret) {
        return res.status(500).json({ error: 'TOTP server secret is not configured.' });
    }

    const issuer = (process.env.TOTP_ISSUER ?? 'Researcher Portfolio').trim() || 'Researcher Portfolio';
    const account = (process.env.TOTP_ACCOUNT ?? 'researcher').trim() || 'researcher';
    const label = `${issuer}:${account}`;
    const setupUri = `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
    const qrDataUrl = await QRCode.toDataURL(setupUri, { width: 220, margin: 1 });

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ qrDataUrl });
}
