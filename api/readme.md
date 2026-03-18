




---

## 🔐 Setting the QR regeneration password

QR regeneration after TOTP setup now requires a password you configure. Set the `TOTP_QR_PASSWORD` environment variable (for local `.env` or your hosting provider’s env settings). Example for local development:

```env
TOTP_QR_PASSWORD=choose-a-strong-password-here
```

Deployments should set the same variable in their environment/secrets panel. This password is never stored in the codebase and is only checked server-side when generating a new QR.
