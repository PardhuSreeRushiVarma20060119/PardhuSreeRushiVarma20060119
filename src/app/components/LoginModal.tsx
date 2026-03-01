import { useState } from 'react';

export function LoginModal({ onLogin, onCancel }: { onLogin: () => void; onCancel: () => void }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'admin') {
            onLogin();
        } else {
            setError(true);
            setTimeout(() => setError(false), 2000);
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
                maxWidth: '400px',
                boxShadow: 'var(--neumorph-shadow)',
                transition: 'border-color 0.3s ease'
            }}>
                <h2 style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.5rem',
                    marginBottom: '1rem',
                    textAlign: 'center'
                }}>
                    Researcher Login
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            marginBottom: '0.5rem',
                            fontFamily: 'var(--font-mono)'
                        }}>
                            CRYPTOGRAPHIC SIGNATURE KEY
                        </label>
                        <input
                            type="password"
                            autoFocus
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%',
                                backgroundColor: 'var(--bg-primary)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-primary)',
                                padding: '0.75rem',
                                borderRadius: '4px',
                                fontFamily: 'var(--font-mono)',
                                outline: 'none'
                            }}
                            placeholder="••••••••"
                        />
                    </div>
                    {error && (
                        <p style={{ color: '#D4183D', fontSize: '0.75rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                            INVALID SIGNATURE KEY
                        </p>
                    )}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            style={{
                                flex: 1,
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
                        <button
                            type="submit"
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                backgroundColor: 'var(--accent-color)',
                                color: 'var(--bg-primary)',
                                border: 'none',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                fontWeight: 600
                            }}
                        >
                            Verify
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
