# Prompt: Convert template → project-specific

Copy everything below the line into Claude Code in the new project. Fill the `PROJECT BRIEF`. Delete unused parts.

---

You are adapting this multi-tenant Next.js starter into a project-specific app. Follow `AGENTS.md`, `context/architecture.md`, `context/ui-rules.md`. Read `node_modules/next/dist/docs/` before writing Next code. Be concise in reports.

## PROJECT BRIEF (fill in)

- Product name: `<e.g. Acme CRM>`
- Short name / logo letter: `<A>`
- One-line tagline: `<...>`
- Domain / root domain (prod): `<acme.com>`; dev: `localhost`
- Platform subdomain: `<admin>`
- Backend API URL (prod): `<https://api.acme.com>`
- Brand color (hex/oklch): `<#...>`; fonts: `<keep Open Sans/Montserrat | ...>`
- Tenant term (what "organization" is called): `<Workspace | Clinic | School | Company | keep Organization>`
- Domain features to ADD: `<list modules, e.g. Customers, Invoices, Projects>`
- Template features to KEEP / REMOVE: `<keep: auth, 2FA, roles, audit, account, tenant-requests, platform | remove: ...>`
- Roles: `<keep Owner/Admin/Member | custom...>` (must match backend role templates)
- Package name / repo: `<name>`

## Tasks (do in order, commit per step)

### 1. Branding & identity
- `package.json` `name`, `version`.
- `src/app/layout.tsx` metadata: replace "Create Next App" title/description (use title template, OG, icons).
- `src/components/shared/logo.tsx`: replace "N" mark + "Nextbase" text. Update favicon (`src/app/favicon.ico`).
- `src/app/page.tsx` landing: replace "Open-source Next.js starter" copy, hero, CTAs, footer.
- `src/components/shared/site-navbar.tsx` links/labels.
- `README.md`: rewrite for the project (setup, env, scripts, domains). Remove create-next-app boilerplate.
- Delete unused `public/*.svg` (file, globe, next, vercel, window) if unreferenced (grep first).
- Grep for leftovers: `rg -i "nextbase|starter|template|nestjs-starter|create next app"`.

### 2. Theme
- `src/app/globals.css`: set brand tokens (`--brand`, `--brand-foreground`, `--primary`, ring, charts, sidebar) for light + dark. Keep contrast AA.
- Fonts in `layout.tsx` if changed.
- Follow `context/ui-rules.md`; no hardcoded colors in components.

### 3. Env & multi-tenancy config
- Update `.env.example` (+ create `.env.local`): `NEXT_PUBLIC_SERVER_URL`, `NEXT_PUBLIC_ROOT_DOMAIN`, `NEXT_PUBLIC_PLATFORM_SUBDOMAIN`, `NEXT_PUBLIC_REFRESH_TOKEN_TTL_DAYS`. Must match backend `APP_ROOT_DOMAIN`, `PLATFORM_SUBDOMAIN`, `JWT_REFRESH_TTL`, `TENANT_URL_TEMPLATE`, `CORS_ORIGINS`.
- Fix comments in `src/config/index.ts` and `.env.example` that mention `nestjs-starter`.
- Cookie names / localStorage key in `lib/auth-cookies.ts`, `store/auth-store.ts`: rename with project prefix to avoid collisions across projects on same root domain.
- Verify `lib/host.ts`, `lib/api-base.ts`, `proxy.ts` work for prod domain (reserved labels, www, cookie domain).

### 4. Terminology
- Rename "Organization/tenant" in UI copy to the Tenant term above (labels, headings, toasts, nav, emails text). Keep code identifiers/routes unless asked; if renaming routes, update `proxy.ts` + route lists.
- Align role names/labels with backend (`src/features/auth/types.ts` comment refs `role-templates.constant.ts`).

### 5. Trim features
- For each REMOVE item: delete `src/features/<x>`, `src/app/<route>`, nav entries (`dashboard` + `platform/nav-config.ts`), route lists in `proxy.ts`, unused deps in `package.json`. Run `pnpm lint` + `pnpm build` after each.
- Don't leave dead imports, empty routes, or `coming-soon` placeholders unless intended.

### 6. Add project features
For each domain feature in the brief, per `context/architecture.md`:
- `src/features/<feature>/` with `api.ts` (TanStack hooks + key factory over `apiFetch`), `schemas.ts` (zod), `types.ts`, `components/` (decomposed), `hooks/`.
- Route in `src/app/dashboard/<feature>/page.tsx`; add nav item; gate by role/permission like existing features.
- Lists: `QueryParams` → `PaginatedResponse<X>`; reuse `components/table`.
- Forms: react-hook-form + zod + `components/shared/form-*`.
- No direct `fetch`; kebab-case files; Zustand only in `src/store/`.

### 7. Metadata, SEO, legal
- Per-route `metadata` titles. `robots`, `sitemap`, OG image.
- Privacy/Terms links (if sign-up exists).

### 8. Cleanup & verify
- Update `context/architecture.md` + `context/ui-rules.md` for anything changed (new features, term changes, removed modules). Keep `AGENTS.md` intact.
- `pnpm lint`, `pnpm build` pass; no TS errors.
- Run dev with `acme.localhost:3001`, `admin.localhost:3001`, apex; check sign-up → verify → dashboard, tenant switch, platform console.
- Final report: files changed, removed, leftovers needing my input. Concise.

## Rules
- Ask me before deleting a feature not listed in the brief.
- Don't change backend contracts; if API shape unknown, ask or leave a typed TODO.
- Small commits, conventional messages (`feat:`, `chore:`, `refactor:`).
