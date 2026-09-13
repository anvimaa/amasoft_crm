# AGENTS.md — Amasoft CRM

B2B sales-pipeline CRM for Angola. SvelteKit + Svelte 5 (runes), TypeScript strict, TailwindCSS 4, Bun, `adapter-node`. Currency AOA/Kz, locale pt-AO.

## Commands (Bun)

- Install: `bun install`
- Dev: `bun run dev` → `http://localhost:5173`
- Typecheck: `bun run check` (`svelte-kit sync && svelte-check`)
- Build: `bun run build` / preview: `bun run preview`
- No test runner, no linter/formatter config. Verify with `bun run check` + `bun run build`.

## Architecture

- **Routing:** SvelteKit 3 file-based routing with `ssr = false`. Routes in `src/routes/(app)/`: `dashboard/`, `pipeline/`, `table/`, `map/`, `agenda/`. Root `/` redirects to `/dashboard`. Navigation via `goto()` from `$app/navigation`. URL state via `page` from `$app/state` (NOT `$app/stores` — deprecated in SvelteKit 3).
- **Layout:** `src/routes/+layout.svelte` contains Sidebar, Header, all modals, LeadDrawer, ToastContainer. Child routes render inside `{@render children()}`.
- API under `src/routes/api/leads/` (`GET`/`POST /api/leads`, `POST /api/leads/reset`, `GET /api/leads/export/original`). Company/team API at `src/routes/api/company/`.
- Source of truth: `src/lib/types/crm.ts` (`ClientLead`, `LeadStatus = lead|contacted|meeting|proposal|won|lost`, `LeadPriority = hot|warm|cold`).
- Seed: `src/lib/data/clientes.json` → `src/lib/data/initial-leads.ts` (`INITIAL_LEADS`).
- Persistence: `src/lib/server/db.ts` reads/writes `data/crm-database.json` (committed; auto-created from `INITIAL_LEADS` if missing). Company: `data/company-profile.json`. Team: `data/team-members.json`.
- Client state: `src/lib/stores/crm.svelte.ts` (`crmStore`, class with `$state`/`$derived`). Load order: `GET /api/leads` → `localStorage: amasoft_crm_leads_v2` → `INITIAL_LEADS`. Every mutation calls `saveToStorage()` (localStorage + `POST /api/leads`). No `activeView` — view is determined by URL route.
- Company/team state: `src/lib/stores/company.svelte.ts` (`companyStore`). Defaults: `src/lib/data/defaults.ts`.
- Shared utilities: `src/lib/utils/format.ts` (`formatKz()`). WhatsApp templates: `src/lib/utils/whatsapp.ts`.
- Toasts: `src/lib/stores/toast.svelte.ts`. Icons: `src/lib/components/Icon.svelte`.
- OpenCode Svelte plugin active (`.opencode/opencode.json`); use Svelte MCP `svelte-autofixer` to validate `.svelte` edits.

## Svelte / Vite quirks

- `vite.config.ts` forces runes mode for all non-`node_modules` files and enables `experimental.async` + `remoteFunctions`. Do not remove/alter; write new components with runes (`$state`, `$derived`, `$effect`, `$props`), no legacy stores/slots.
- Key views live in `src/lib/components/`: `DashboardView`, `KanbanView` (HTML5 drag-and-drop), `TableView`, `MapView`, `LeadDrawer`, `AddLeadModal`, `ImportLeadsModal`, `PurgeNoPhoneModal`, `ResetConfirmModal`.

## Hard UX rules

- No emojis anywhere in UI — use `Icon.svelte` SVGs only.
- Never `alert()` / `confirm()` / `prompt()` — use the dedicated modals + toasts.
- Modal backdrop click must NOT close; close only via Cancel / `X` / success action.
- Import (`ImportLeadsModal`) must keep schema validation, title/phone-unformatted duplicate detection, preview table, skip-duplicates option. Destructive batch actions (`PurgeNoPhoneModal`, `ResetConfirmModal`) require preview-table confirmation.

## Data conventions

- New/imported/reset leads are always zeroed: `status: 'lead'`, `notes: []`, `estimatedValue: 0`. Priority is derived, never free choice at creation: phone + no website → `hot`; phone + website → `warm`; no phone → `cold`. Tags follow the same signals (`Sem Website`/`Com Website`, `Telefone Válido`, city).
- `exportOriginalFormat` (client + server) must strip CRM extensions and emit exactly the 14 native fields; full `exportToJSON` keeps everything.
