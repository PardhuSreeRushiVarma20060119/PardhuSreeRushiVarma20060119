import { hasSetupCookie } from './utils.ts';

interface ApiRequest {
    method?: string;
    headers?: {
        cookie?: string;
    };
}

interface ApiResponse {
    setHeader: (name: string, value: string) => void;
    status: (code: number) => {
        json: (payload: Record<string, unknown>) => void;
    };
}

export default function handler(req: ApiRequest, res: ApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const setupComplete = hasSetupCookie(req.headers?.cookie);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ setupComplete });
}
