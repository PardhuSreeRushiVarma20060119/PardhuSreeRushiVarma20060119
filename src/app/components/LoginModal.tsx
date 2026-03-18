import { useEffect, useMemo, useRef, useState } from 'react';

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: { client_id: string; callback: (response: { credential?: string }) => void }) => void;
                    renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
                };
            };
        };
    }
}

export function LoginModal({ onLogin, onCancel }: { onLogin: () => void; onCancel: () => void }) {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const verifyUrl = import.meta.env.VITE_GOOGLE_AUTH_VERIFY_URL;
    const resolvedVerifyUrl = useMemo(() => {
        if (!verifyUrl) return null;
        try {
            const parsed = new URL(verifyUrl, window.location.origin);
            return parsed.origin === window.location.origin ? parsed.toString() : null;
        } catch {
            return null;
        }
    }, [verifyUrl]);
    const hasVerificationEndpoint = useMemo(() => Boolean(resolvedVerifyUrl), [resolvedVerifyUrl]);
    const buttonRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (!clientId) {
            setError('Google auth is not configured. Set VITE_GOOGLE_CLIENT_ID in your .env file and restart the app.');
            return;
        }
        if (!hasVerificationEndpoint) {
            setError('Google auth verification endpoint must be same-origin and configured. Set VITE_GOOGLE_AUTH_VERIFY_URL (e.g. /api/auth/google/verify).');
            return;
        }

        const initButton = () => {
            if (!window.google?.accounts?.id || !buttonRef.current) return;
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: async (response) => {
                    if (!response.credential) {
                        setError('Google login failed. Please retry.');
                        return;
                    }

                    try {
                        const verificationResponse = await fetch(resolvedVerifyUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ credential: response.credential }),
                        });
                        if (!verificationResponse.ok) {
                            setError('Unable to verify Google sign-in.');
                            return;
                        }
                        const verification = await verificationResponse.json();
                        if (verification?.authorized !== true) {
                            setError('Unauthorized Google account.');
                            return;
                        }
                        onLogin();
                    } catch (error) {
                        if (import.meta.env.DEV) {
                            console.error('Google sign-in verification failed:', error);
                        }
                        setError('Unable to verify Google sign-in.');
                        return;
                    }
                },
            });
            buttonRef.current.replaceChildren();
            window.google.accounts.id.renderButton(buttonRef.current, {
                theme: 'outline',
                size: 'large',
                text: 'continue_with',
                shape: 'pill',
                width: 320,
            });
        };

        const scriptId = 'google-gsi-client';
        const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
        if (existing) {
            if (window.google?.accounts?.id) initButton();
            return;
        }

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initButton;
        script.onerror = () => setError('Could not load Google auth script.');
        document.head.appendChild(script);
    }, [clientId, hasVerificationEndpoint, onLogin, resolvedVerifyUrl]);

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
                    Google account sign-in only
                </p>
                <div className="flex justify-center mb-4">
                    <div ref={buttonRef} />
                </div>
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
