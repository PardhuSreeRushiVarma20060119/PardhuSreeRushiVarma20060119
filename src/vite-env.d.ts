/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_TOTP_SETUP_URL?: string
    readonly VITE_TOTP_STATUS_URL?: string
    readonly VITE_TOTP_VERIFY_URL?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
