/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_TOTP_SECRET: string
    readonly VITE_TOTP_ISSUER?: string
    readonly VITE_TOTP_ACCOUNT?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
