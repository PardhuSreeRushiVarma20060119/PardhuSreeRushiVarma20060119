function hasSetupCookie(cookieHeader: string | undefined): boolean {
    if (!cookieHeader) return false;
    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
        const [name, value] = cookie.split('=').map((part) => part.trim());
        if (name === 'totp_setup_complete' && value === '1') {
            return true;
        }
    }
    return false;
}

export default function handler(req: any, res: any) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const setupComplete = hasSetupCookie(req.headers?.cookie);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ setupComplete });
}
