# Plano: Migrar para Rotas SvelteKit — Amasoft CRM

**Data:** 2026-09-13
**Estado:** Aprovado para implementação

## Resumo

Migrar de SPA monolítica (`+page.svelte` com `{#if}` chain) para file-based routing do SvelteKit. URLs reais, histórico do browser, code splitting, melhor manutenção.

## Decisões

- **URLs em inglês:** `/dashboard`, `/pipeline`, `/table`, `/map`, `/agenda`
- **Lead drawer:** continua store-based (sem mudança de URL ao clicar num lead)
- **SSR:** mantido `ssr = false` (app depende de localStorage)
- **Modais:** continuam store-based (não precisam de URLs)

---

## Estrutura Atual → Nova Estrutura

### Antes
```
src/routes/
  +page.svelte              ← TUDO (sidebar + header + 5 views + 7 modals)
  +layout.svelte            ← Só CSS + favicon
  +layout.ts                ← ssr = false
```

### Depois
```
src/routes/
  +layout.svelte            ← Sidebar + Header + Modais + Drawer + Toast + slot
  +layout.ts                ← ssr = false
  (app)/
    +layout.svelte          ← slot only (layout wrapper para o grupo)
    dashboard/
      +page.svelte          ← DashboardView
    pipeline/
      +page.svelte          ← KanbanView
    table/
      +page.svelte          ← TableView
    map/
      +page.svelte          ← MapView
    agenda/
      +page.svelte          ← AgendaView
  api/                      ← Inalterado
```

---

## Ficheiros a Criar

### 1. `src/routes/(app)/+layout.svelte`
Layout do grupo — apenas `{@render children()}`. Não precisa de conteúdo extra.

### 2. `src/routes/(app)/dashboard/+page.svelte`
```svelte
<script lang="ts">
  import DashboardView from '#lib/components/DashboardView.svelte';
</script>
<DashboardView />
```

### 3. `src/routes/(app)/pipeline/+page.svelte`
```svelte
<script lang="ts">
  import KanbanView from '#lib/components/KanbanView.svelte';
</script>
<KanbanView />
```

### 4. `src/routes/(app)/table/+page.svelte`
```svelte
<script lang="ts">
  import TableView from '#lib/components/TableView.svelte';
</script>
<TableView />
```

### 5. `src/routes/(app)/map/+page.svelte`
```svelte
<script lang="ts">
  import MapView from '#lib/components/MapView.svelte';
</script>
<MapView />
```

### 6. `src/routes/(app)/agenda/+page.svelte`
```svelte
<script lang="ts">
  import AgendaView from '#lib/components/AgendaView.svelte';
</script>
<AgendaView />
```

---

## Ficheiros a Modificar

### 7. `src/routes/+layout.svelte` (REESCREVER)
Mover tudo do `+page.svelte` atual para aqui:
- Sidebar
- Header
- Loading spinner (crmStore.isLoaded)
- Modais globais (AddLead, Purge, Reset, Import, Company, Team)
- LeadDrawer
- ToastContainer

**Layout prop:** `{@render children()}` no local do `{#if}` chain.

### 8. `src/lib/components/Sidebar.svelte`
- Trocar `crmStore.setActiveView(view)` por `goto('/' + view)`
- Trocar `crmStore.activeView === 'X'` por comparação com `$page.url.pathname`
- Remover import do crmStore para navegação (manter para filtros e modais)
- Importar `goto` de `$app/navigation` e `$page` de `$app/stores`

### 9. `src/lib/components/DashboardView.svelte`
- Trocar `crmStore.setActiveView('kanban')` por `goto('/pipeline')`
- Trocar `crmStore.setActiveView('table')` por `goto('/table')`
- Trocar `crmStore.setActiveView('map')` por `goto('/map')`
- Trocar `crmStore.setActiveView('agenda')` por `goto('/agenda')`
- A função `filterByPreset()` continua a funcionar (define filtros + navega)

### 10. `src/lib/stores/crm.svelte.ts`
- Remover `activeView` state (agora é URL)
- Remover `setActiveView()` method
- Remover `VIEW_STORAGE_KEY` e leitura de localStorage
- Manter tudo o resto (leads, selectedLead, filters, modals, etc.)

### 11. `src/lib/components/Header.svelte`
- Título dinâmico baseado no `$page.url.pathname`
- Breadcrumb simples: "Dashboard" / "Pipeline" / "Tabela" / etc.

### 12. `src/routes/+page.svelte`
- **ELIMINAR** — não existe mais. O routing é feito pelo `(app)` group.

---

## Mapeamento de URLs

| URL | Componente | Antes |
|---|---|---|
| `/dashboard` | DashboardView | `crmStore.activeView === 'dashboard'` |
| `/pipeline` | KanbanView | `crmStore.activeView === 'kanban'` |
| `/table` | TableView | `crmStore.activeView === 'table'` |
| `/map` | MapView | `crmStore.activeView === 'map'` |
| `/agenda` | AgendaView | `crmStore.activeView === 'agenda'` |
| `/` | Redirect → `/dashboard` | `crmStore.activeView === 'dashboard'` |

---

## Ordem de Implementação

| # | Ficheiro | Ação |
|---|---|---|
| 1 | `src/routes/(app)/+layout.svelte` | Criar (grupo de rotas) |
| 2 | `src/routes/(app)/dashboard/+page.svelte` | Criar |
| 3 | `src/routes/(app)/pipeline/+page.svelte` | Criar |
| 4 | `src/routes/(app)/table/+page.svelte` | Criar |
| 5 | `src/routes/(app)/map/+page.svelte` | Criar |
| 6 | `src/routes/(app)/agenda/+page.svelte` | Criar |
| 7 | `src/routes/+layout.svelte` | Reescrever (mover conteúdo de +page.svelte) |
| 8 | `src/routes/+page.svelte` | Eliminar |
| 9 | `src/lib/stores/crm.svelte.ts` | Remover `activeView`, `setActiveView`, `VIEW_STORAGE_KEY` |
| 10 | `src/lib/components/Sidebar.svelte` | `goto()` + `$page.url.pathname` |
| 11 | `src/lib/components/DashboardView.svelte` | `goto()` em vez de `setActiveView()` |
| 12 | `src/lib/components/Header.svelte` | Título dinâmico por URL |
| 13 | `src/routes/+page.ts` | Criar redirect `/` → `/dashboard` |
| 14 | `bun run check` + `bun run build` | Verificar |

---

## Detalhes Técnicos

### Sidebar: `goto()` + `$page.url.pathname`

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  function navigateTo(path: string) {
    goto(path);
    onCloseMobile();
  }

  // Active state:
  // $page.url.pathname === '/dashboard' em vez de crmStore.activeView === 'dashboard'
</script>
```

### Redirect `/` → `/dashboard`

Criar `src/routes/+page.ts`:
```ts
import { redirect } from '@sveltejs/kit';
export const load = () => throw redirect(307, '/dashboard');
```

### Header: título dinâmico

```svelte
<script lang="ts">
  import { page } from '$app/stores';

  const titles: Record<string, string> = {
    '/dashboard': 'Visão Geral',
    '/pipeline': 'Pipeline Comercial',
    '/table': 'Directório de Empresas',
    '/map': 'Cobertura Territorial',
    '/agenda': 'Agenda'
  };

  let currentTitle = $derived(titles[$page.url.pathname] || 'Amasoft CRM');
</script>
```

---

## Riscos e Mitigações

| Risco | Mitigação |
|---|---|
| Flash ao navegar entre rotas | SvelteKit carrega componentes rapidamente; `ssr = false` mantém client-side |
| Estado perdido entre rotas (filtros, drawer) | Fica tudo no `crmStore` (global); filtros persistem enquanto a app está aberta |
| Sidebar não reflete URL correta ao usar browser back | `$page.url.pathname` é reativo e atualiza automaticamente |
| Modais precisam de ficar no layout | Já ficam — são always-mounted com `{#if}` guards no store |

---

## Verificação Final

1. `bun run check` — 0 errors, 0 warnings
2. `bun run build` — success
3. Testar manualmente:
   - Navegar entre todas as 5 views
   - Botão voltar/avançar do browser funciona
   - URL muda corretamente
   - Sidebar reflete view ativa
   - Drawer abre/fecha corretamente em qualquer view
   - Modais funcionam em qualquer view
   - Filtros persistem ao navegar entre views
   - Refresh na página mantém a view correta
