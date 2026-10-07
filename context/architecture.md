# Architecture

- Path alias: `@/*` → `./src/*`
- API layer: `lib/api-client.ts` — shared `apiFetch` wrapper (TanStack Query's `queryFn`/`mutationFn` call through it), 2min timeout, bearer injection, mutex-protected `/auth/refresh` re-auth + replay
- Client auth/token state: `store/auth-store.ts` — Zustand store (`useAuthStore`), persisted to `localStorage`. No Redux in this project — all client state lives in Zustand.
- Zustand stores live in the top-level `src/store/` folder (not inside `features/<feature>/`), one file per store, kebab-case (e.g. `store/auth-store.ts`).
- Route protection: `proxy.ts` (middleware), route lists in `routes/index.ts`
    - unauth on `/` or protected route → `/auth/sign-in?callbackUrl=`
    - auth but unverified → `/auth/verify-email`

## Feature folder (`src/features/<feature>/`)

```
actions.ts    server actions (if needed)
api.ts        TanStack Query hooks (useX / useXMutation) + query-key factory, built on lib/api-client.ts
schemas.ts    zod schemas
types.ts      feature types/enums
components/   feature UI
hooks/        feature hooks
lib/          feature helpers
```

Zustand stores are not colocated in the feature folder — see `src/store/` below.

## Rules

- File names: kebab-case
- API calls: hooks in `features/<feature>/api.ts` call `apiFetch` from `lib/api-client.ts` — never call `fetch` directly from a component
- Query keys: per-feature factory colocated in that feature's `api.ts` (e.g. `authKeys.user()`); invalidate by key directly, no central tag registry
- Hook naming: `useX` for queries, `useXMutation` for mutations
- Client state → Zustand store in `src/store/` (e.g. `store/auth-store.ts`), not colocated in `features/<feature>/`
- Cross-feature UI → `components/shared/`; generic helpers → `lib/utils.ts`; cross-feature hooks → `hooks/`

- List endpoints: arg `QueryParams`, return `PaginatedResponse<X>` as-is, no reshaping in the `queryFn`.
- No global error toast for query/mutation failures (except session-expiry on refresh failure, handled in `lib/api-client.ts`) — each feature/component decides how to surface errors, per ui-rules.
- No SSR prefetch/hydration (`HydrationBoundary`) scaffolding yet — add it when a feature first needs server-fetched, hydrated data.

- follow Component Decomposition convention.

## Multi-tenancy (mirrors the backend's `context/architecture.md`)

- Three host kinds, parsed by `lib/host.ts` (same rules as the backend): **apex** (`<root>`, `www`, reserved labels), **tenant** (`<slug>.<root>`), **platform** (`admin.<root>`, super admin only). Env: `NEXT_PUBLIC_ROOT_DOMAIN`, `NEXT_PUBLIC_PLATFORM_SUBDOMAIN`, `NEXT_PUBLIC_SERVER_URL` (API apex origin).
- The API resolves the tenant from the request **host**, so the web mirrors its page host onto the API origin (`lib/api-base.ts`: `acme.localhost:3001` → `acme.localhost:3000`). Client: `getClientApiBaseUrl()`; server actions/RSC: `getServerApiBase()` (`lib/server-host.ts`). Never hardcode `NEXT_PUBLIC_SERVER_URL` in a request.
- Sessions are per host (host-scoped cookies + per-origin localStorage). The apex never keeps a session: sign-in there trades its token for a one-time code (`switch-tenant`) and redirects to `<tenant url>/auth/exchange?code=` (`features/auth/actions.ts` → `completeLogin`). Org switcher uses the same path.
- Auth-shaped server actions return a `SessionOutcome` (`success` | `redirect` | `signInRequired`) or an error; client code funnels them through `useSessionOutcome` (`features/auth/hooks`), which also routes tenant-state error codes (`TENANT_PENDING_APPROVAL`, `TENANT_REJECTED`, `TENANT_SUSPENDED`, `MEMBERSHIP_SUSPENDED`, `NOT_A_MEMBER`, `NO_ORGANIZATION`) to `/auth/organization-status`.
- `proxy.ts` is host-aware: apex = landing/sign-up/register/sign-in (no dashboards), tenant = `/dashboard` + `/account`, platform = `/platform` + `/account`. Open on every host: `/auth/exchange`, `/auth/organization-status`, `/accept-invite`.
- Gate UI on permission keys (`features/auth/types.ts` mirrors the backend catalog). Dashboard nav items carry their own permission (`features/dashboard/nav-config.ts`). Tenant admins manage *memberships* only — identity is global (no edit/restore of accounts).
- Features: `tenant` (org settings, switcher, create org), `tenant-requests` (public config + request form, `ADMIN_ONLY` mode), `audit` (tenant + platform trail), `platform` (super admin console).
- Backend `.env` for local dev (web :3001, API :3000): `TENANT_URL_TEMPLATE=http://{slug}.localhost:3001`, `CORS_ORIGINS=http://localhost:3001`. Browsers resolve `*.localhost` with no DNS.
