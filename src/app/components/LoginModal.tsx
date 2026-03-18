import { FormEvent, useEffect, useMemo, useState } from 'react';

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
    const [isLoadingStatus, setIsLoadingStatus] = useState(true);
    const [error, setError] = useState<string>('');
    const [setupComplete, setSetupComplete] = useState(false);

    useEffect(() => {
        let isCancelled = false;
        const loadStatus = async () => {
            if (!resolvedStatusUrl) {
                if (!isCancelled) {
                    setError('Authenticator status endpoint must be same-origin and configured.');
                    setIsLoadingStatus(false);
                }
                return;
            }
            try {
                const response = await fetch(resolvedStatusUrl, {
                    method: 'GET',
                    credentials: 'include',
                    headers: { Accept: 'application/json' },
                });
                if (!response.ok) {
                    if (!isCancelled) {
                        setError('Unable to load authenticator setup status.');
                    }
                    return;
                }
                const payload = await response.json();
                if (!isCancelled) {
                    setSetupComplete(payload?.setupComplete === true);
                }
            } catch (statusError) {
                if (import.meta.env.DEV) {
                    console.error('Authenticator status load failed:', statusError);
                }
                if (!isCancelled) {
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
        setIsPreparingSetup(true);
        try {
            if (!resolvedSetupUrl) {
                setError('Authenticator setup endpoint must be same-origin and configured.');
                return;
            }
            const response = await fetch(resolvedSetupUrl, {
                method: 'GET',
                credentials: 'include',
                headers: { Accept: 'application/json' },
            });
            if (!response.ok) {
                setError('Unable to prepare authenticator setup.');
                return;
            }
            const payload = await response.json();
            if (typeof payload?.qrDataUrl !== 'string' || !payload.qrDataUrl.startsWith('data:image/')) {
                setError('Invalid setup response from authenticator endpoint.');
                return;
            }
            setQrDataUrl(payload.qrDataUrl);
            setShowSetup(true);
        } catch (prepareError) {
            if (import.meta.env.DEV) {
                console.error('Authenticator setup failed:', prepareError);
            }
            setError('Unable to prepare authenticator setup.');
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
        if (!resolvedVerifyUrl) {
            setError('Authenticator verification endpoint must be same-origin and configured.');
            return;
        }
        setIsSubmitting(true);
        try {
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
                setError('Unable to verify authenticator code.');
                return;
            }
            const payload = await response.json();
            if (payload?.authorized !== true) {
                setError('Invalid authenticator code. Please try again.');
                return;
            }
            setSetupComplete(true);
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
                {!setupComplete && !isLoadingStatus && (
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
                            {isPreparingSetup ? 'Preparing Setup...' : 'Setup Google Authenticator'}
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
