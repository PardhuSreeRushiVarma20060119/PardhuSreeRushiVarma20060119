import { useState } from 'react';

export function EditModal({
    title,
    data,
    fields,
    onSave,
    onCancel
}: {
    title: string;
    data: any;
    fields: { key: string; label: string; type: 'text' | 'textarea' }[];
    onSave: (updatedData: any) => void;
    onCancel: () => void;
}) {
    const [formData, setFormData] = useState({ ...data });

    const handleChange = (key: string, value: string) => {
        setFormData((prev: any) => ({ ...prev, [key]: value }));
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
            zIndex: 1100,
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                padding: '2rem',
                borderRadius: '8px',
                width: '90%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: 'var(--neumorph-shadow)'
            }}>
                <h2 style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.5rem',
                    marginBottom: '1.5rem'
                }}>
                    Edit {title}
                </h2>

                <div className="space-y-4">
                    {fields.map((field) => (
                        <div key={field.key}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                                marginBottom: '0.5rem',
                                fontFamily: 'var(--font-mono)'
                            }}>
                                {field.label.toUpperCase()}
                            </label>
                            {field.type === 'textarea' ? (
                                <textarea
                                    value={formData[field.key]}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                    rows={4}
                                    style={{
                                        width: '100%',
                                        backgroundColor: 'var(--bg-primary)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--text-primary)',
                                        padding: '0.75rem',
                                        borderRadius: '4px',
                                        fontFamily: 'inherit',
                                        outline: 'none',
                                        resize: 'vertical'
                                    }}
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={formData[field.key]}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                    style={{
                                        width: '100%',
                                        backgroundColor: 'var(--bg-primary)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--text-primary)',
                                        padding: '0.75rem',
                                        borderRadius: '4px',
                                        fontFamily: 'inherit',
                                        outline: 'none'
                                    }}
                                />
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex gap-4 mt-8">
                    <button
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
                        onClick={() => onSave(formData)}
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
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
