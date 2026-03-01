export function AdminBar({
    editMode,
    onToggleEdit,
    onSave,
    onReset,
    onLogout
}: {
    editMode: boolean;
    onToggleEdit: () => void;
    onSave: () => void;
    onReset: () => void;
    onLogout: () => void;
}) {
    return (
        <div style={{
            position: 'fixed',
            bottom: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            padding: '0.5rem 1rem',
            borderRadius: '50px',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            zIndex: 1000,
            boxShadow: 'var(--neumorph-shadow)',
            backdropFilter: 'blur(8px)'
        }}>
            <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--accent-color)',
                paddingRight: '1rem',
                borderRight: '1px solid var(--border-color)'
            }}>
                ADMIN MODE
            </div>

            <button
                onClick={onToggleEdit}
                style={{
                    background: editMode ? 'var(--accent-color)' : 'none',
                    color: editMode ? 'var(--bg-primary)' : 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    transition: 'all 0.2s ease'
                }}
            >
                {editMode ? 'DISABLE EDIT' : 'ENABLE EDIT'}
            </button>

            <button
                onClick={onSave}
                style={{
                    background: 'none',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)'
                }}
            >
                EXPORT JSON
            </button>

            <button
                onClick={onReset}
                style={{
                    background: 'none',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-color)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)'
                }}
            >
                RESET DATA
            </button>

            <button
                onClick={onLogout}
                style={{
                    background: 'none',
                    color: '#D4183D',
                    border: 'none',
                    padding: '0.25rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)'
                }}
            >
                LOGOUT
            </button>
        </div>
    );
}
