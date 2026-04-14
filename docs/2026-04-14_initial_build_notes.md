# Initial Build Notes

Date: 2026-04-14

Initial implementation created:

- standalone repo under `/Users/admin/dev/hypreneur-auth-dashboard`
- git initialized
- Next.js app scaffolded manually
- SSR Supabase client wiring added
- shared cookie-domain support added
- login, forgot-password, update-password, update-email, callback, logout, and portal-select routes added
- explicit access-denied route added for authenticated but unprovisioned users

Validation status:

- `npm run lint` passes
- `npm run build` passes

Not yet implemented:

- OAuth
- admin/client user-management orchestration
- polished design system
- tests
- dependency installation
- production deployment

Blocked on live DB readiness:

- `public.auth_resolve_portal()` must be applied in Supabase for portal routing to work
