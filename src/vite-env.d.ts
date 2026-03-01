/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_ADMIN_PASSWORD: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
