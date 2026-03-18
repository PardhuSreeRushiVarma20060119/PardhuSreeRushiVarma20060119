/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GOOGLE_CLIENT_ID: string
    readonly VITE_ALLOWED_RESEARCHER_EMAILS: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
