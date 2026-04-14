# Auth Unification Reference

Date: 2026-04-14

This repo implements the auth-app side of the unified auth plan.

Locked assumptions:

- shared SSR auth across `.hypreneur.space`
- `auth.hypreneur.space` owns login, password recovery, email change, callback, logout, and portal selection
- `public.auth_resolve_portal()` is the database-owned portal bootstrap RPC
- admin/client user-management rights are enforced through guarded RPCs plus trusted server orchestration
- app-specific permissions will move to the future access-control project

Companion planning docs live in:

- `/Users/admin/dev/hypreneur-client-dashboard/docs/auth-unification/`
- `/Users/admin/dev/hypreneur-admin-dashboard/docs/auth-unification/`

Current dependency on database rollout:

- the SQL draft for `auth_resolve_portal()` must be applied before this app can resolve destinations correctly

Current deployment blocker:

- Vercel project bootstrap is waiting on Vercel CLI device authentication for this environment
