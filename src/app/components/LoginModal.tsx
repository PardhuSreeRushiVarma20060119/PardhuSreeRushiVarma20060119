import { FormEvent, useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const LOCAL_SECRET_KEY = 'totp_local_secret';
const LOCAL_SETUP_FLAG = 'totp_local_setup_complete';

function normalizeBase32(value: string): string {
    return value.trim().toUpperCase().replace(/\s+/g, '').replace(/=+$/g, '');
}

function encodeBase32(bytes: Uint8Array): string {
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

function decodeBase32(secret: string): Uint8Array | null {
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

    return bytes.length ? new Uint8Array(bytes) : null;
}

async function generateTotpCodeBrowser(secretBytes: Uint8Array, timeStep: number): Promise<string> {
    const counter = new ArrayBuffer(8);
    const view = new DataView(counter);
    // high 4 bytes remain 0
    view.setUint32(4, timeStep, false);

    const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
    const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, counter));
    const offset = signature[signature.length - 1] & 0x0f;
    const binary =
        ((signature[offset] & 0x7f) << 24) |
        ((signature[offset + 1] & 0xff) << 16) |
        ((signature[offset + 2] & 0xff) << 8) |
        (signature[offset + 3] & 0xff);

    return (binary % 1_000_000).toString().padStart(6, '0');
}

async function verifyTotpBrowser(secret: string, code: string): Promise<boolean> {
    if (!/^\d{6}$/.test(code)) return false;
    const secretBytes = decodeBase32(secret);
    if (!secretBytes || typeof crypto?.subtle?.sign !== 'function') return false;

    const currentStep = Math.floor(Date.now() / 1000 / 30);
    for (const drift of [-1, 0, 1]) {
        const expected = await generateTotpCodeBrowser(secretBytes, currentStep + drift);
        if (expected === code) return true;
    }
    return false;
}

function loadLocalSecret(): string {
    if (typeof localStorage === 'undefined') return '';
    return normalizeBase32(localStorage.getItem(LOCAL_SECRET_KEY) ?? '');
}

function persistLocalSecret(secret: string) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(LOCAL_SECRET_KEY, normalizeBase32(secret));
}

function markLocalSetupComplete() {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(LOCAL_SETUP_FLAG, '1');
}

function clearLocalSetupComplete() {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(LOCAL_SETUP_FLAG);
}

function isLocalSetupComplete(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(LOCAL_SETUP_FLAG) === '1';
}

function generateLocalSecret(): string {
    const buffer = new Uint8Array(20);
    crypto.getRandomValues(buffer);
    return encodeBase32(buffer);
}

export function LoginModal({ onLogin, onCancel }: { onLogin: () => void; onCancel: () => void }) {
    const setupUrl = import.meta.env.VITE_TOTP_SETUP_URL ?? '/api/totp/setup';
    const statusUrl = import.meta.env.VITE_TOTP_STATUS_URL ?? '/api/totp/status';
    const verifyUrl = import.meta.env.VITE_TOTP_VERIFY_URL ?? '/api/totp/verify';
    const resolvedSetupUrl = useMemo(() => {
        try {
            const parsed = new URL(setupUrl, window.location.origin);
            return parsed.origin === window.location.origin ? parsed.toString() : null;
        } catch {
            return null;
        }
    }, [setupUrl]);
    const resolvedVerifyUrl = useMemo(() => {
        try {
            const parsed = new URL(verifyUrl, window.location.origin);
            return parsed.origin === window.location.origin ? parsed.toString() : null;
        } catch {
            return null;
        }
    }, [verifyUrl]);
    const resolvedStatusUrl = useMemo(() => {
        try {
            const parsed = new URL(statusUrl, window.location.origin);
            return parsed.origin === window.location.origin ? parsed.toString() : null;
        } catch {
            return null;
        }
    }, [statusUrl]);
    const [code, setCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPreparingSetup, setIsPreparingSetup] = useState(false);
    const [showSetup, setShowSetup] = useState(false);
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [manualSecret, setManualSecret] = useState('');
    const [isLoadingStatus, setIsLoadingStatus] = useState(true);
    const [error, setError] = useState<string>('');
    const [setupComplete, setSetupComplete] = useState(false);

    const extractSecretFromUri = (uri: string): string => {
        try {
            const secretParam = new URL(uri).searchParams.get('secret');
            return (secretParam ?? '').trim();
        } catch {
            return '';
        }
    };

    useEffect(() => {
        let isCancelled = false;
        const applyLocalStatusFallback = () => {
            const hasLocalSecret = loadLocalSecret() !== '';
            const completed = isLocalSetupComplete();
            if (hasLocalSecret && completed) {
                setSetupComplete(true);
                return true;
            }
            return false;
        };
        const loadStatus = async () => {
            if (!resolvedStatusUrl) {
                if (!isCancelled && !applyLocalStatusFallback()) {
                    setError('Authenticator status endpoint must be same-origin and configured.');
                }
                setIsLoadingStatus(false);
                return;
            }
            try {
                const response = await fetch(resolvedStatusUrl, {
                    method: 'GET',
                    credentials: 'include',
                    headers: { Accept: 'application/json' },
                });
                if (response.ok) {
                    const payload = await response.json();
                    if (!isCancelled) {
                        setSetupComplete(payload?.setupComplete === true);
                    }
                    return;
                }
                if (!isCancelled && !applyLocalStatusFallback()) {
                    setError('Unable to load authenticator setup status.');
                }
            } catch (statusError) {
                if (import.meta.env.DEV) {
                    console.error('Authenticator status load failed:', statusError);
                }
                if (!isCancelled && !applyLocalStatusFallback()) {
                    setError('Unable to load authenticator setup status.');
                }
            } finally {
                if (!isCancelled) {
                    setIsLoadingStatus(false);
                }
            }
        };
        void loadStatus();
        return () => {
            isCancelled = true;
        };
    }, [resolvedStatusUrl]);

    const handlePrepareSetup = async () => {
        setError('');
        setManualSecret('');
        setIsPreparingSetup(true);
        const issuer = (import.meta.env.VITE_TOTP_ISSUER || 'Researcher Portfolio').toString().trim() || 'Researcher Portfolio';
        const account = (import.meta.env.VITE_TOTP_ACCOUNT || 'researcher').toString().trim() || 'researcher';
        const requirePasswordIfCompleted = (): string | null => {
            if (!setupComplete) return '';
            const provided = window.prompt('Enter password to generate a new authenticator QR code:') ?? '';
            if (!provided.trim()) {
                setError('Password is required to generate a new QR code.');
                return null;
            }
            return provided;
        };
        const prepareLocalSetup = async () => {
            try {
                const secret = loadLocalSecret() || generateLocalSecret();
                persistLocalSecret(secret);
                clearLocalSetupComplete();
                const label = `${issuer}:${account}`;
                const otpauthUri = `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
                let resolvedQr = '';
                try {
                    resolvedQr = await QRCode.toDataURL(otpauthUri, { width: 220, margin: 1 });
                } catch (qrError) {
                    if (import.meta.env.DEV) {
                        console.error('Local QR generation failed:', qrError);
                    }
                }
                if (resolvedQr) {
                    setQrDataUrl(resolvedQr);
                    setManualSecret('');
                    setShowSetup(true);
                    return true;
                }
                setManualSecret(secret);
                setQrDataUrl('');
                setShowSetup(true);
                setError('QR code unavailable. Add the secret below to Google Authenticator.');
                return true;
            } catch (fallbackError) {
                if (import.meta.env.DEV) {
                    console.error('Local authenticator setup failed:', fallbackError);
                }
                return false;
            }
        };
        try {
            const regenerationPassword = requirePasswordIfCompleted();
            if (regenerationPassword === null) {
                return;
            }
            if (!resolvedSetupUrl) {
                if (!(await prepareLocalSetup())) {
                    setError('Authenticator setup endpoint must be same-origin and configured.');
                }
                return;
            }
            const response = await fetch(resolvedSetupUrl, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                    ...(regenerationPassword ? { 'x-totp-qr-password': regenerationPassword } : {}),
                },
            });
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    try {
                        const payload = await response.json();
                        setError(typeof payload?.error === 'string' ? payload.error : 'Password required to generate a new QR code.');
                    } catch {
                        setError('Password required to generate a new QR code.');
                    }
                    return;
                }
                const handled = await prepareLocalSetup();
                if (!handled) {
                    setError('Unable to prepare authenticator setup.');
                }
                return;
            }
            const payload = await response.json();
            const serverQr = typeof payload?.qrDataUrl === 'string' && payload.qrDataUrl.startsWith('data:image/') ? payload.qrDataUrl : '';
            const otpAuthUri = typeof payload?.otpauthUri === 'string' ? payload.otpauthUri : '';
            const providedSecret = typeof payload?.secret === 'string' ? payload.secret.trim() : '';

            let resolvedQr = serverQr;
            if (!resolvedQr && otpAuthUri) {
                try {
                    resolvedQr = await QRCode.toDataURL(otpAuthUri, { width: 220, margin: 1 });
                } catch (qrError) {
                    if (import.meta.env.DEV) {
                        console.error('Client QR generation failed:', qrError);
                    }
                }
            }

            if (resolvedQr) {
                setQrDataUrl(resolvedQr);
                setShowSetup(true);
                return;
            }

            const fallbackSecret = providedSecret || extractSecretFromUri(otpAuthUri);
            if (fallbackSecret) {
                setManualSecret(fallbackSecret);
                setQrDataUrl('');
                setShowSetup(true);
                setError('QR code unavailable. Add the secret below to Google Authenticator.');
                return;
            }

            setError('Invalid setup response from authenticator endpoint.');
        } catch (prepareError) {
            if (import.meta.env.DEV) {
                console.error('Authenticator setup failed:', prepareError);
            }
            const handled = await prepareLocalSetup();
            if (!handled) {
                setError('Unable to prepare authenticator setup.');
            }
        } finally {
            setIsPreparingSetup(false);
        }
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError('');

        const normalizedCode = code.trim();
        if (!/^\d{6}$/.test(normalizedCode)) {
            setError('Enter a valid 6-digit authenticator code.');
            return;
        }
        setIsSubmitting(true);
        try {
            let serverFailed = false;
            if (resolvedVerifyUrl) {
                const response = await fetch(resolvedVerifyUrl, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({ code: normalizedCode }),
                });
                if (!response.ok) {
                    serverFailed = true;
                } else {
                    const payload = await response.json();
                    if (payload?.authorized !== true) {
                        setError('Invalid authenticator code. Please try again.');
                        return;
                    }
                    markLocalSetupComplete();
                    setSetupComplete(true);
                    onLogin();
                    return;
                }
            } else {
                serverFailed = true;
            }

            if (serverFailed) {
                const fallbackSecret = loadLocalSecret();
                const localAuthorized = fallbackSecret ? await verifyTotpBrowser(fallbackSecret, normalizedCode) : false;
                if (localAuthorized) {
                    markLocalSetupComplete();
                    setSetupComplete(true);
                    onLogin();
                    return;
                }
                setError('Unable to verify authenticator code.');
            }
        } catch (submitError) {
            if (import.meta.env.DEV) {
                console.error('Authenticator verification failed:', submitError);
            }
            const fallbackSecret = loadLocalSecret();
            const localAuthorized = fallbackSecret ? await verifyTotpBrowser(fallbackSecret, normalizedCode) : false;
            if (localAuthorized) {
                markLocalSetupComplete();
                setSetupComplete(true);
                onLogin();
                return;
            }
            setError('Unable to verify authenticator code.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                backgroundColor: 'var(--bg-surface)',
                border: `1px solid ${error ? '#D4183D' : 'var(--border-color)'}`,
                padding: '2rem',
                borderRadius: '8px',
                width: '100%',
                maxWidth: '420px',
                boxShadow: 'var(--neumorph-shadow)',
                transition: 'border-color 0.3s ease'
            }}>
                <h2 style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.5rem',
                    marginBottom: '0.75rem',
                    textAlign: 'center'
                }}>
                    Researcher Login
                </h2>
                <p style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    marginBottom: '1.25rem',
                    fontFamily: 'var(--font-mono)'
                }}>
                    Google Authenticator code required
                </p>
                {!isLoadingStatus && (
                    <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                        <button
                            type="button"
                            onClick={handlePrepareSetup}
                            disabled={isPreparingSetup}
                            style={{
                                width: '100%',
                                maxWidth: '320px',
                                padding: '0.75rem',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                background: 'none',
                                color: 'var(--text-secondary)',
                                cursor: isPreparingSetup ? 'not-allowed' : 'pointer',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.875rem',
                                opacity: isPreparingSetup ? 0.7 : 1,
                            }}
                        >
                            {isPreparingSetup
                                ? 'Preparing Setup...'
                                : setupComplete
                                    ? 'Generate New QR (password required)'
                                    : 'Setup Google Authenticator'}
                        </button>
                    </div>
                )}
                {!setupComplete && showSetup && qrDataUrl && (
                    <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                        <img src={qrDataUrl} alt="Google Authenticator QR setup code" style={{ width: 220, height: 220, borderRadius: '8px', margin: '0 auto 0.75rem auto' }} />
                        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                            Scan once, then enter the 6-digit code below.
                        </p>
                    </div>
                )}
                {!setupComplete && showSetup && !qrDataUrl && manualSecret && (
                    <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                            QR unavailable. Add this secret manually in Google Authenticator:
                        </p>
                        <div style={{
                            display: 'inline-block',
                            padding: '0.75rem 1rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            fontFamily: 'var(--font-mono)',
                            letterSpacing: '0.08em',
                            color: 'var(--text-primary)',
                            background: 'rgba(255,255,255,0.02)'
                        }}>
                            {manualSecret}
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                            Use a 6-digit time-based (TOTP) entry.
                        </p>
                    </div>
                )}
                <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
                    <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={code}
                        onChange={(event) => {
                            setCode(event.target.value.replace(/\D/g, ''));
                            setError('');
                        }}
                        placeholder="Enter 6-digit code"
                        aria-label="Authenticator code"
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            background: 'transparent',
                            color: 'var(--text-primary)',
                            fontFamily: 'var(--font-mono)',
                            marginBottom: '0.75rem',
                        }}
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            background: 'none',
                            color: 'var(--text-secondary)',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            fontFamily: 'var(--font-mono)',
                            opacity: isSubmitting ? 0.7 : 1,
                        }}
                    >
                        {isSubmitting ? 'Verifying...' : 'Verify & Login'}
                    </button>
                </form>
                {isLoadingStatus && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', fontFamily: 'var(--font-mono)', marginBottom: '1rem' }}>
                        Loading authenticator status...
                    </p>
                )}
                {error && (
                    <p style={{ color: '#D4183D', fontSize: '0.75rem', textAlign: 'center', fontFamily: 'var(--font-mono)', marginBottom: '1rem' }}>
                        {error}
                    </p>
                )}
                <button
                    type="button"
                    onClick={onCancel}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'none',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        borderRadius: '4px'
                    }}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
