interface CookieHeaderRequest {
    headers: Record<string, string | undefined>;
    socket?: {
        encrypted?: boolean;
    };
    connection?: {
        encrypted?: boolean;
    };
}

export function getCookieValue(cookieHeader: string | undefined, name: string): string {
    if (!cookieHeader) return '';
    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
        const [cookieName, ...valueParts] = cookie.split('=');
        const normalizedCookieName = cookieName ? cookieName.trim() : '';
        if (normalizedCookieName === name) {
            return valueParts.join('=').trim();
        }
    }
    return '';
}

export function shouldUseSecureCookie(req: CookieHeaderRequest): boolean {
    const trustedProxyHeaders = process.env.VERCEL === '1' || process.env.TRUST_PROXY_HEADERS === 'true';
    const forwardedProto = req.headers['x-forwarded-proto'];
    const forwardedHttps = trustedProxyHeaders && typeof forwardedProto === 'string' && forwardedProto.toLowerCase() === 'https';
    return req.socket?.encrypted === true || req.connection?.encrypted === true || forwardedHttps;
}

export function hasSetupCookie(cookieHeader: string | undefined): boolean {
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
