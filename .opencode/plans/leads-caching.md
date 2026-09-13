# Plano: Cache de Leads — Amasoft CRM

**Data:** 2026-09-13
**Estado:** Aprovado para implementação

## Problema

Cada carregamento de página faz `fetch('/api/leads')` que lê `crm-database.json` do disco com `fs.readFileSync()`. 317 leads (~50KB) são transferidos sempre, mesmo que nada tenha mudado. Saves em cada mutation causam I/O desnecessário.

## Solução: 5 Melhorias

### 1. Cache server-side em memória (`db.ts`)

Leads ficam em memória após primeiro read. Invalidar só em writes.

```ts
let _leadsCache: ClientLead[] | null = null;

export function getLeads(): ClientLead[] {
  if (_leadsCache) return _leadsCache;
  // read from disk...
  _leadsCache = parsed;
  return _leadsCache;
}

export function saveLeads(leads: ClientLead[]): boolean {
  _leadsCache = leads; // atualizar cache
  // write to disk...
}
```

### 2. ETag + 304 Not Modified (`api/leads/+server.ts`)

Gerar ETag a partir de hash MD5 dos leads. Client envia `If-None-Match`. Server retorna `304` se nada mudou.

```ts
import crypto from 'node:crypto';

export const GET: RequestHandler = async ({ request }) => {
  const leads = getLeads();
  const hash = crypto.createHash('md5').update(JSON.stringify(leads)).digest('hex');
  const etag = `"${hash}"`;
  
  const ifNoneMatch = request.headers.get('if-none-match');
  if (ifNoneMatch === etag) {
    return new Response(null, { status: 304 });
  }
  
  return new Response(JSON.stringify(leads), {
    headers: { 'ETag': etag, 'Content-Type': 'application/json' }
  });
};
```

### 3. Carregamento paralelo com UI optimista (`crm.svelte.ts`)

```ts
async init() {
  if (typeof window === 'undefined') return;
  
  // 1. localStorage instantaneamente
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        this.leads = parsed;
        this.isLoaded = true;
      }
    }
  } catch {}
  
  // 2. Server em background com ETag
  try {
    const etag = localStorage.getItem(ETAG_KEY) || '';
    const response = await fetch('/api/leads', {
      headers: { 'If-None-Match': etag }
    });
    
    if (response.status === 304) return; // nada mudou
    
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        this.leads = data;
        const newEtag = response.headers.get('ETag') || '';
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.leads));
        localStorage.setItem(ETAG_KEY, newEtag);
      }
    }
  } catch {
    // Server indisponível — já temos dados do localStorage
  }
  
  // 3. Fallback INITIAL_LEADS
  if (!this.isLoaded) {
    this.leads = INITIAL_LEADS;
    this.isLoaded = true;
  }
}
```

### 4. Debounce nos saves (`crm.svelte.ts`)

```ts
private _saveTimeout: ReturnType<typeof setTimeout> | null = null;

async saveToStorage() {
  if (typeof window === 'undefined') return;
  
  // localStorage sempre imediato
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.leads));
  } catch {}
  
  // Server com debounce (500ms)
  if (this._saveTimeout) clearTimeout(this._saveTimeout);
  this._saveTimeout = setTimeout(async () => {
    try {
      this.isSaving = true;
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.leads)
      });
    } catch {}
    finally {
      this.isSaving = false;
    }
  }, 500);
}
```

### 5. Invalidation do cache ETag ao salvar

Quando o client faz POST, o server atualiza o cache em memória (passo 1). O próximo GET gera ETag novo automaticamente.

---

## Ficheiros a Modificar

| Ficheiro | Mudança |
|---|---|
| `src/lib/server/db.ts` | Cache em memória (`_leadsCache`) |
| `src/routes/api/leads/+server.ts` | ETag + 304 |
| `src/lib/stores/crm.svelte.ts` | Carregamento paralelo + debounce + ETag key |

---

## Ordem de Implementação

| # | Ficheiro | Ação |
|---|---|---|
| 1 | `db.ts` | Adicionar `_leadsCache` em `getLeads()` e `saveLeads()` |
| 2 | `api/leads/+server.ts` | Adicionar ETag + 304 no GET |
| 3 | `crm.svelte.ts` | Reescrever `init()` (paralelo + ETag) |
| 4 | `crm.svelte.ts` | Reescrever `saveToStorage()` (debounce) |
| 5 | `crm.svelte.ts` | Adicionar `ETAG_KEY` constant |
| 6 | `bun run check` + `bun run build` | Verificar |

---

## Resultado Esperado

| Métrica | Antes | Depois |
|---|---|---|
| Primeiro load | ~200ms (server read) | < 50ms (localStorage) |
| Loads seguintes | ~200ms (sempre) | ~0ms (304) |
| Saves por mutation | 1 POST imediato | 1 POST em batch (500ms) |
| 10 mutações rápidas | 10 POSTs | 1 POST |
| Banda transferida | ~50KB sempre | 0KB (304) |

---

## Verificação

1. `bun run check` — 0 errors
2. `bun run build` — success
3. Testar:
   - Abrir app → load rápido do localStorage
   - Navegar entre views → nenhum fetch extra
   - Mudar status de lead → POST com debounce
   - Recarregar → 304 se nada mudou
   - Server offline → app funciona com localStorage
