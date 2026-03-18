import { FormEvent, useMemo, useState } from 'react';

const SETUP_COMPLETE_KEY = 'researcher_totp_setup_complete';
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function normalizeBase32(value: string): string {
    return value.trim().toUpperCase().replace(/\s+/g, '').replace(/=+$/g, '');
}

function decodeBase32(secret: string): Uint8Array | null {
    const normalized = normalizeBase32(secret);
    if (!normalized) return null;

    let bits = 0;
    let value = 0;
    const output: number[] = [];

    for (const char of normalized) {
        const index = BASE32_ALPHABET.indexOf(char);
        if (index < 0) return null;
        value = (value << 5) | index;
        bits += 5;
        if (bits >= 8) {
            bits -= 8;
            output.push((value >> bits) & 0xff);
        }
    }

    return output.length > 0 ? new Uint8Array(output) : null;
}

async function generateTotpCode(secretBytes: Uint8Array, timeStep: number): Promise<string> {
    if (!crypto?.subtle) {
        throw new Error('Web Crypto API unavailable');
    }

    const counterBytes = new Uint8Array(8);
    let counter = timeStep;
    for (let i = 7; i >= 0; i--) {
        counterBytes[i] = counter & 0xff;
        counter = Math.floor(counter / 256);
    }

    const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
    const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, counterBytes));
    const offset = signature[signature.length - 1] & 0x0f;
    const binary =
        ((signature[offset] & 0x7f) << 24) |
        ((signature[offset + 1] & 0xff) << 16) |
        ((signature[offset + 2] & 0xff) << 8) |
        (signature[offset + 3] & 0xff);
    return (binary % 1_000_000).toString().padStart(6, '0');
}

async function verifyTotp(secret: string, inputCode: string): Promise<boolean> {
    const normalizedCode = inputCode.trim();
    if (!/^\d{6}$/.test(normalizedCode)) return false;

    const secretBytes = decodeBase32(secret);
    if (!secretBytes) return false;

    const currentStep = Math.floor(Date.now() / 1000 / 30);
    for (const drift of [-1, 0, 1]) {
        const expected = await generateTotpCode(secretBytes, currentStep + drift);
        if (expected === normalizedCode) return true;
    }
    return false;
}

export function LoginModal({ onLogin, onCancel }: { onLogin: () => void; onCancel: () => void }) {
    const secret = normalizeBase32(import.meta.env.VITE_TOTP_SECRET ?? '');
    const issuer = (import.meta.env.VITE_TOTP_ISSUER ?? 'Researcher Portfolio').trim() || 'Researcher Portfolio';
    const account = (import.meta.env.VITE_TOTP_ACCOUNT ?? 'researcher').trim() || 'researcher';
    const [code, setCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSetup, setShowSetup] = useState(false);
    const [error, setError] = useState<string>('');
    const [setupComplete, setSetupComplete] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return window.localStorage.getItem(SETUP_COMPLETE_KEY) === 'true';
    });

    const setupUri = useMemo(() => {
        if (!secret) return null;
        const label = `${issuer}:${account}`;
        return `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
    }, [account, issuer, secret]);

    const qrUrl = useMemo(() => {
        if (!setupUri) return null;
        return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(setupUri)}`;
    }, [setupUri]);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError('');

        if (!secret) {
            setError('Authenticator is not configured. Set VITE_TOTP_SECRET in your .env file.');
            return;
        }
        if (!setupComplete && !showSetup) {
            setError('First-time setup required. Click Setup to generate your Google Authenticator QR code.');
            return;
        }

        setIsSubmitting(true);
        try {
            const valid = await verifyTotp(secret, code);
            if (!valid) {
                setError('Invalid authenticator code. Please try again.');
                return;
            }
            if (!setupComplete) {
                window.localStorage.setItem(SETUP_COMPLETE_KEY, 'true');
                setSetupComplete(true);
            }
            onLogin();
        } catch (submitError) {
            if (import.meta.env.DEV) {
                console.error('Authenticator verification failed:', submitError);
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
                {!setupComplete && (
                    <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                        <button
                            type="button"
                            onClick={() => {
                                setShowSetup(true);
                                setError('');
                            }}
                            style={{
                                width: '100%',
                                maxWidth: '320px',
                                padding: '0.75rem',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                background: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.875rem',
                            }}
                        >
                            Setup Google Authenticator
                        </button>
                    </div>
                )}
                {!setupComplete && showSetup && qrUrl && (
                    <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                        <img src={qrUrl} alt="Google Authenticator QR setup code" style={{ width: 220, height: 220, borderRadius: '8px', margin: '0 auto 0.75rem auto' }} />
                        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                            Scan once, then enter the 6-digit code below.
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                            If QR does not load, add manually with key: {secret}
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
                            setCode(event.target.value.replace(/\D/g, '').slice(0, 6));
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
