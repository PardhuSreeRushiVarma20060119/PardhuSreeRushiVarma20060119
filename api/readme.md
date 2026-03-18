## 🔐 Researcher Login (Google Authenticator) Configuration

Researcher login uses a local TOTP flow:

- On first login, click **Setup Google Authenticator**
- Scan the QR in Google Authenticator
- Enter the 6-digit code to complete setup and login
- On future logins, only the authenticator code is required

Set these values in your local `.env` (or copy from `.env.example`):

- `TOTP_SECRET` (server-side Base32 secret used for verification; recommended for persistent cross-session login)
- `TOTP_ISSUER` (display name in authenticator app)
- `TOTP_ACCOUNT` (account label in authenticator app)
- `VITE_TOTP_SETUP_URL` (defaults to `/api/totp/setup`)
- `VITE_TOTP_STATUS_URL` (defaults to `/api/totp/status`)
- `VITE_TOTP_VERIFY_URL` (defaults to `/api/totp/verify`)
- If the API endpoints are unavailable (for example on static hosting), the login flow will fall back to a browser-generated secret stored locally for that session. For stable cross-device behaviour use server endpoints with `TOTP_SECRET`.

When `TOTP_SECRET` is not configured, setup now falls back to a short-lived server-set HTTP-only cookie secret so QR provisioning and verification still work for that browser session. For stable long-term login behavior across browsers/devices, configure `TOTP_SECRET`.

---

## 🔐 Setting the QR regeneration password

QR regeneration after TOTP setup now requires a password you configure. Set the `TOTP_QR_PASSWORD` environment variable (for local `.env` or your hosting provider’s env settings). Example for local development:

```env
TOTP_QR_PASSWORD=choose-a-strong-password-here
```

Deployments should set the same variable in their environment/secrets panel. This password is never stored in the codebase and is only checked server-side when generating a new QR.
