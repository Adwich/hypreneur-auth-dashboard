# hypreneur-auth-dashboard

Standalone auth app for:

- `auth.hypreneur.space`
- shared SSR Supabase auth across `*.hypreneur.space`
- portal resolution between `client.hypreneur.space` and `admin.hypreneur.space`

## Current Scope

Implemented initial foundation:

- SSR Supabase client setup
- shared cookie-domain support
- password login
- forgot-password request
- update-password flow
- update-email flow
- auth callback route
- unprovisioned account handling
- logout route
- portal resolver wiring through `public.auth_resolve_portal()`

## Required Env Vars

Create `.env.local` with:

```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=
NEXT_PUBLIC_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_CLIENT_APP_URL=http://localhost:3001
NEXT_PUBLIC_ADMIN_APP_URL=http://localhost:3002
AUTH_COOKIE_DOMAIN=.hypreneur.space
```

Production values should point to:

- `https://auth.hypreneur.space`
- `https://client.hypreneur.space`
- `https://admin.hypreneur.space`

## Notes

- `auth_resolve_portal()` must exist in Supabase before the full redirect flow works.
- Invite and admin user-management orchestration is intentionally not in this repo yet.
- This auth app now reads Supabase URL and publishable key from server-only env vars.
- The dashboards still use browser Supabase clients today, so removing `NEXT_PUBLIC_*`
  from those apps requires a broader server-only data access refactor.
