# Plano: WhatsApp Business API + AI + Automação — Amasoft CRM

**Data:** 2026-09-13
**Estado:** Aguarda aprovação da equipa

## Resumo

Integrar WhatsApp Business API oficial (Meta Cloud API via Twilio/360dialog) + AI (Vercel AI SDK + OpenAI/Groq) no CRM Amasoft. Funcionalidades: gestão de contactos WhatsApp, envio automático de mensagens por estágio, AI para geração de mensagens e scoring de leads.

**Custo estimado:** $4-15/mês (200 mensagens WhatsApp + 100 mensagens AI)

## Dependências novas

```bash
bun add ai @ai-sdk/openai twilio zod
```

| Pacote | Para quê |
|---|---|
| `ai` (Vercel AI SDK) | Framework AI unificado para SvelteKit |
| `@ai-sdk/openai` | Provider OpenAI (GPT-4o-mini) |
| `twilio` | Cliente WhatsApp Business API oficial |
| `zod` | Validação de schemas para AI structured output |

## Variáveis de ambiente (`.env`)

```
WHATSAPP_PROVIDER=twilio
WHATSAPP_ACCOUNT_SID=AC...
WHATSAPP_AUTH_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_FROM_NUMBER=+244...
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
  leadId: string;
  direction: 'outbound' | 'inbound';
  content: string;
  templateId?: string;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  errorMessage?: string;
}

// Config WhatsApp
interface WhatsAppConfig {
  enabled: boolean;
  provider: 'twilio' | '360dialog';
  phoneNumberId: string;
  accessToken: string;
  webhookSecret: string;
  defaultAutoReply: boolean;
}

// Automação de envio
interface MessageAutomation {
  id: string;
  name: string;
  trigger: 'stage-change' | 'schedule' | 'stale' | 'manual';
  triggerValue?: string;
  templateId: string;
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

- `src/lib/server/whatsapp.ts` — cliente API (funções: `sendTemplateMessage`, `sendTextMessage`, `getMessageStatus`, `validateWebhook`)
- `src/lib/server/ai.ts` — funções AI (`generateFollowUp`, `scoreLead`, `suggestNextAction`, `generateAutoReply`)

---

## Fase 2 — API Routes WhatsApp + AI

| Rota | Método | Função |
|---|---|---|
| `/api/whatsapp/config` | GET/POST | Ler/guardar config WhatsApp |
| `/api/whatsapp/send` | POST | Enviar mensagem (template ou texto) |
| `/api/whatsapp/send/batch` | POST | Enviar para vários leads |
| `/api/whatsapp/send/scheduled` | POST | Agendar envio para data/hora |
| `/api/whatsapp/webhook` | POST | Receber webhooks Meta (entregues, lidos, recebidos) |
| `/api/whatsapp/status` | GET | Estado de uma mensagem |
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

  // Derivados
  messagesByLead = $derived(...);
  pendingMessages = $derived(...);
  automationStats = $derived(...);

  // Ações
  sendMessage(leadId, templateId, customText?) → result
  sendBatch(leads[], templateId, customText?) → result
  scheduleMessage(leadId, templateId, datetime) → result
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
| `WhatsAppConfigModal.svelte` | Configuração da API (provider, tokens, número) |
| `WhatsAppPanel.svelte` | Painel de conversa com timeline de mensagens |
| `BatchSendModal.svelte` | Envio em lote com seleção de leads + preview |
| `ScheduleMessageModal.svelte` | Agendamento de envio com date/time picker |
| `AISuggestionCard.svelte` | Card com sugestão AI no Dashboard/LeadDrawer |
| `AIConfigModal.svelte` | Configuração da API AI (provider, key, modelo) |

### Modificações em componentes existentes

- **LeadDrawer** — nova aba "WhatsApp API" com timeline de mensagens, botão "Enviar com AI", toggle opt-in
- **DashboardView** — KPIs: mensagens enviadas hoje, taxa de resposta, sugestões AI pendentes
- **KanbanView** — botão "Auto-enviar" por coluna
- **Sidebar** — acesso a config WhatsApp e AI

---

## Fase 6 — Automações (futura)

### Regras de automação

| Trigger | Ação | Exemplo |
|---|---|---|
| `stage-change` | Enviar template quando lead muda de estágio | lead→meeting: "Convite para Reunião" |
| `schedule` | Enviar em data/hora agendada | Follow-up em 3 dias |
| `stale` | Enviar quando lead sem contacto há X dias | 14 dias: "Reativação" |
| `overdue` | Enviar quando follow-up está atrasado | 1 dia atrasado: "Acompanhamento" |
| `manual` | Utilizador clica "Enviar" | Sempre que quiser |

### Fluxo
```
Trigger → Verificar regra ativa → Verificar opt-in
→ Gerar/template mensagem → Enviar via API → Registar
→ Atualizar lastWhatsAppSent → Log nota no lead
```

---

## Fase 7 — Persistência (futura)

### Novos ficheiros JSON em `data/`

| Ficheiro | Conteúdo |
|---|---|
| `data/whatsapp-config.json` | Config da API WhatsApp |
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

**`/api/whatsapp/webhook`** — recebe do Meta:

```ts
// GET — verificação do webhook (hub.challenge)
// POST — receber updates:
//   - message.read → atualizar readAt
//   - message.delivered → atualizar deliveredAt
//   - message.status → atualizar status
//   - message.received → criar nota inbound + AI auto-reply se ligado
```

---

## Orçamento

| Item | Custo/mês |
|---|---|
| Twilio (plataforma) | $0 (pay per use) |
| Meta mensagens (200 msgs) | $3-12 |
| OpenAI GPT-4o-mini (100 msgs AI) | $1-3 |
| **Total** | **$4-15/mês** |

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
