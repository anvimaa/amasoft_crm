# Plano: WhatsApp (Evolution API) + AI + Automação — Amasoft CRM

**Data:** 2026-09-13
**Estado:** Aguarda aprovação da equipa

## Resumo

Integrar **Evolution API** (open-source, self-hosted, Baileys/WhatsApp Web) + AI (Vercel AI SDK + OpenAI/Groq) no CRM Amasoft. Sem aprovação Meta, sem custos por mensagem, sem dependência de Twilio.

**Custo estimado:** $6-13/mês (hosting Evolution API + AI)

## Porquê Evolution API (não oficial)

| | Meta Cloud API / Twilio | Evolution API |
|---|---|---|
| Aprovação Meta | Obrigatória | Não precisa |
| Custo por mensagem | $0.005-$0.085/msg | **Grátis** (Baileys) |
| Hosting | SaaS gerido | Self-hosted (Docker) |
| Setup | Dias/semanas | 5 minutos |
| QR Code pairing | Não suporta | Sim |
| Multi-instance | Limitado | Sim |

**Custo total:** Railway/Render ~$5-10/mês (flat) vs Meta $3-12 + Twilio fees

---

## Dependências novas

```bash
bun add ai @ai-sdk/openai zod
```

| Pacote | Para quê |
|---|---|
| `ai` (Vercel AI SDK) | Framework AI unificado para SvelteKit |
| `@ai-sdk/openai` | Provider OpenAI (GPT-4o-mini) |
| `zod` | Validação de schemas para AI structured output |

**Nota:** Evolution API é externa — não precisamos de instalar nada. Comunicamos via REST.

---

## Variáveis de ambiente (`.env`)

```
# Evolution API
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=sua-api-key
EVOLUTION_INSTANCE=amasoft-crm

# AI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

---

## Fase 1 — Tipos + Config WhatsApp

### Novos tipos em `src/lib/types/crm.ts`

```ts
// Extensão de ClientLead (campos novos)
whatsappOptIn: boolean;          // Consentimento para mensagens
lastWhatsAppSent: string | null; // Timestamp último envio
whatsappMessageCount: number;    // Contador de mensagens enviadas

// Mensagem WhatsApp
interface WhatsAppMessage {
  id: string;
  remoteMsgId?: string;          // ID retornado pela Evolution API
  leadId: string;
  direction: 'outbound' | 'inbound';
  content: string;
  templateName?: string;         // Nome do template enviado
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  errorMessage?: string;
}

// Config WhatsApp (Evolution API)
interface WhatsAppConfig {
  enabled: boolean;
  apiUrl: string;                // URL da instância Evolution API
  apiKey: string;                // API key global
  instanceName: string;          // Nome da instância (ex: amasoft-crm)
  instanceConnected: boolean;    // Estado da conexão WhatsApp
  qrcodeUrl: string | null;      // URL do QR code para pairing
  webhookUrl: string;            // URL do webhook para receber mensagens
  defaultAutoReply: boolean;     // Auto-resposta com AI ligada
}

// Automação de envio
interface MessageAutomation {
  id: string;
  name: string;
  trigger: 'stage-change' | 'schedule' | 'stale' | 'manual';
  triggerValue?: string;         // Ex: "meeting" para stage-change
  templateName?: string;         // Template Evolution API (opcional)
  customMessage: string;         // Mensagem personalizada (usada se sem template)
  enabled: boolean;
  lastRun?: string;
}

// AI config
interface AIConfig {
  provider: 'openai' | 'groq';
  apiKey: string;
  model: string;
  enabled: boolean;
}
```

### Persistência

- `src/lib/server/whatsapp.ts` — cliente Evolution API (REST, funções: `sendText`, `sendTemplate`, `sendMedia`, `getConnectionStatus`, `getQRCode`)
- `src/lib/server/ai.ts` — funções AI (`generateFollowUp`, `scoreLead`, `suggestNextAction`, `generateAutoReply`)

---

## Fase 2 — API Routes WhatsApp + AI

| Rota | Método | Função |
|---|---|---|
| `/api/whatsapp/config` | GET/POST | Ler/guardar config Evolution API |
| `/api/whatsapp/connect` | POST | Criar instância + obter QR code |
| `/api/whatsapp/disconnect` | POST | Desligar instância |
| `/api/whatsapp/send` | POST | Enviar mensagem (texto, template, ou imagem) |
| `/api/whatsapp/send/batch` | POST | Enviar para vários leads |
| `/api/whatsapp/send/scheduled` | POST | Agendar envio para data/hora |
| `/api/whatsapp/webhook` | POST | Receber webhooks Evolution API (entregues, lidos, recebidos) |
| `/api/whatsapp/status` | GET | Estado da conexão + de uma mensagem |
| `/api/ai/generate` | POST | Gerar mensagem com AI |
| `/api/ai/score` | POST | Score AI de um lead |
| `/api/ai/suggest` | POST | Sugerir próxima ação |
| `/api/automations` | GET/POST | Gerir automações |
| `/api/automations/run` | POST | Executar automações pendentes |

---

## Fase 3 — Store de WhatsApp

**`src/lib/stores/whatsapp.svelte.ts`:**

```ts
class WhatsAppState {
  config = $state<WhatsAppConfig | null>(null);
  messages = $state<WhatsAppMessage[]>([]);
  automations = $state<MessageAutomation[]>([]);
  isSending = $state<boolean>(false);
  isConfigOpen = $state<boolean>(false);
  isBatchModalOpen = $state<boolean>(false);
  connectionStatus = $state<'connected' | 'disconnected' | 'connecting'>('disconnected');
  qrcode = $state<string | null>(null);

  // Derivados
  messagesByLead = $derived(...);
  pendingMessages = $derived(...);
  automationStats = $derived(...);

  // Ações
  connect() → { qrcodeUrl }                          // Criar instância + QR
  disconnect() → void
  sendMessage(leadId, content, options?) → result
  sendBatch(leads[], content, options?) → result
  scheduleMessage(leadId, content, datetime) → result
  handleWebhook(payload) → void
  saveConfig(config) → void
  toggleAutomation(id) → void
}
```

---

## Fase 4 — AI Integration (Server)

**`src/lib/server/ai.ts`** — funções:

```ts
// Gerar mensagem personalizada
generateFollowUp(lead, stage, company) → { message, suggestedAction }

// Score de lead com AI
scoreLead(lead) → { score, reasoning, suggestedAction }

// Sugerir próximo passo
suggestNextAction(lead, history) → { action, reason, urgency }

// Gerar resposta automática
generateAutoReply(incomingMessage, leadContext) → string
```

**Prompt do sistema** (pt-AO):
```
Tu és um assistente de vendas B2B para uma empresa de tecnologia em Angola.
Gera mensagens profissionais em português angolano para WhatsApp.
Contexto: empresa {company.name}, setor {lead.categoryName}, cidade {lead.city}.
Estágio: {stage}. Histórico: {lastNotes}.
```

---

## Fase 5 — Componentes UI

### Componentes novos

| Componente | Descrição |
|---|---|
| `WhatsAppConfigModal.svelte` | Config Evolution API + botão conectar/desconectar + QR code |
| `WhatsAppPanel.svelte` | Painel de conversa com timeline de mensagens + envio |
| `BatchSendModal.svelte` | Envio em lote com seleção de leads + preview |
| `ScheduleMessageModal.svelte` | Agendamento de envio com date/time picker |
| `AISuggestionCard.svelte` | Card com sugestão AI no Dashboard/LeadDrawer |
| `AIConfigModal.svelte` | Configuração da API AI (provider, key, modelo) |

### Modificações em componentes existentes

- **LeadDrawer** — nova aba "WhatsApp API" com timeline de mensagens, botão "Enviar com AI", toggle opt-in
- **DashboardView** — KPIs: mensagens enviadas hoje, taxa de resposta, sugestões AI pendentes
- **KanbanView** — botão "Auto-enviar" por coluna
- **Sidebar** — acesso a config WhatsApp e AI, indicador de conexão

---

## Fase 6 — Automações (futura)

### Regras de automação

| Trigger | Ação | Exemplo |
|---|---|---|
| `stage-change` | Enviar quando lead muda de estágio | lead→meeting: "Convite para Reunião" |
| `schedule` | Enviar em data/hora agendada | Follow-up em 3 dias |
| `stale` | Enviar quando lead sem contacto há X dias | 14 dias: "Reativação" |
| `overdue` | Enviar quando follow-up está atrasado | 1 dia atrasado: "Acompanhamento" |
| `manual` | Utilizador clica "Enviar" | Sempre que quiser |

### Fluxo
```
Trigger → Verificar regra ativa → Verificar opt-in
→ Gerar/template mensagem → Enviar via Evolution API → Registar
→ Atualizar lastWhatsAppSent → Log nota no lead
```

---

## Fase 7 — Persistência (futura)

### Novos ficheiros JSON em `data/`

| Ficheiro | Conteúdo |
|---|---|
| `data/whatsapp-config.json` | Config Evolution API (url, key, instance) |
| `data/whatsapp-messages.json` | Histórico de mensagens |
| `data/message-automations.json` | Regras de automação |
| `data/ai-config.json` | Config da API AI |

### Server db.ts — novas funções
```ts
getWhatsAppConfig() / saveWhatsAppConfig()
getMessages(leadId) / saveMessage()
getAutomations() / saveAutomations()
getAIConfig() / saveAIConfig()
```

---

## Fase 8 — Webhook Handler (futura)

**`/api/whatsapp/webhook`** — recebe da Evolution API:

```ts
// POST — receber updates:
//   - messages.upsert → mensagem recebida (inbound)
//   - messages.update → status alterado (sent/delivered/read)
//   - connection.update → estado da conexão mudou
```

### Setup webhook na Evolution API
```
POST {EVOLUTION_API_URL}/webhook/set/{instanceName}
{
  "webhook": {
    "enabled": true,
    "url": "https://crm.amasoft.ao/api/whatsapp/webhook",
    "events": ["messages.upsert", "messages.update", "connection.update"]
  }
}
```

---

## Deploy Evolution API (Docker)

### Opção 1: Railway (recomendado, $5-10/mês)
```bash
# Railway template pronto
railway init
railway add evoapicloud/evolution-api
```

### Opção 2: Docker self-hosted
```bash
docker pull evoapicloud/evolution-api:latest

docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -v evolution_data:/evolution/instances \
  -e SERVER_URL=https://evo.amasoft.ao \
  -e AUTHENTICATION_API_KEY=sua-api-key \
  -e DATABASE_PROVIDER=postgresql \
  -e DATABASE_CONNECTION_URI=postgresql://... \
  evoapicloud/evolution-api:latest
```

### Variáveis de ambiente Evolution API
```
SERVER_URL=https://evo.amasoft.ao
AUTHENTICATION_API_KEY=sua-api-key
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://user:pass@host:5432/evolution
CACHE_REDIS_ENABLED=false
```

---

## Orçamento

| Item | Custo/mês |
|---|---|
| Evolution API (Docker/Railway) | $5-10 (flat) |
| WhatsApp mensagens (Baileys) | **$0** |
| OpenAI GPT-4o-mini (100 msgs AI) | $1-3 |
| **Total** | **$6-13/mês** |

Comparação: Meta Cloud API + Twilio = $4-15/mês + per-message fees

---

## Ficheiros criados/modificados

| Arquivo | Fase |
|---|---|
| `package.json` | 1 |
| `.env` | 1 |
| `src/lib/types/crm.ts` | 1 |
| `src/lib/server/whatsapp.ts` | 1 |
| `src/lib/server/ai.ts` | 4 |
| `src/lib/stores/whatsapp.svelte.ts` | 3 |
| `src/lib/stores/ai.svelte.ts` | 4 |
| `src/lib/server/db.ts` | 7 |
| `src/routes/api/whatsapp/*` | 2 |
| `src/routes/api/ai/*` | 2 |
| `src/routes/api/automations/+server.ts` | 6 |
| `src/lib/components/WhatsAppConfigModal.svelte` | 5 |
| `src/lib/components/WhatsAppPanel.svelte` | 5 |
| `src/lib/components/BatchSendModal.svelte` | 5 |
| `src/lib/components/ScheduleMessageModal.svelte` | 5 |
| `src/lib/components/AISuggestionCard.svelte` | 5 |
| `src/lib/components/AIConfigModal.svelte` | 5 |
| `src/lib/components/LeadDrawer.svelte` | 5 |
| `src/lib/components/DashboardView.svelte` | 5 |
| `src/lib/components/KanbanView.svelte` | 5 |
| `src/lib/components/Sidebar.svelte` | 5 |
| `AGENTS.md` | Atualizar |

## Ordem de implementação

| Fase | Dependências |
|---|---|
| 1. Tipos + Config | Nenhuma |
| 2. API Routes | Fase 1 |
| 3. Store WhatsApp | Fase 1-2 |
| 4. AI Server | Fase 2 |
| 5. UI Components | Fase 1-4 |
| 6. Automações | Fase 2-3 |
| 7. Persistência | Fase 1 |
| 8. Webhook | Fase 2 |
