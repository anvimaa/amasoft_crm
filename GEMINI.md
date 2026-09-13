# Amasoft CRM — Especificação Técnica & Conhecimento do Sistema

## 1. Configuração do Projeto

- **Linguagem**: TypeScript (Strict Mode)
- **Framework**: SvelteKit 3 com Svelte 5 (Runes: `$state`, `$derived`, `$effect`, `$props`)
- **Gestor de Pacotes**: Bun
- **Estilos**: TailwindCSS 4 (Tema Escuro Corporativo B2B Minimalista)
- **Localização / Moeda**: Angola (AOA - Kwanzas / pt-AO / +244)

---

## 2. Regras de Design, UX e Diretrizes Rígidas

1. **PROIBIDO USO DE EMOJIS**:
   - Nunca utilizar emojis em botões, rótulos, cabeçalhos, tabelas, menus ou badges.
   - Utilizar exclusivamente os ícones vetoriais SVG do componente [`src/lib/components/Icon.svelte`](file:///home/anvima/projectos/amasoft_crm/src/lib/components/Icon.svelte).

2. **PROIBIDO `alert()`, `confirm()` ou `prompt()` NATIVOS DO BROWSER**:
   - É estritamente proibido o uso de diálogos nativos do JavaScript (considerados deselegantes e pouco profissionais).
   - Todas as confirmações de exclusão, restauração ou ações críticas devem usar modais dedicados com tabela de pré-visualização ou confirmação em 2 passos.
   - Feedbacks e alertas visuais usam a store de toasts [`src/lib/stores/toast.svelte.ts`](file:///home/anvima/projectos/amasoft_crm/src/lib/stores/toast.svelte.ts).

3. **COMPORTAMENTO DE MODAIS**:
   - O backdrop (fundo escuro) não deve fechar a janela ao clicar acidentalmente fora.
   - Modais fecham única e exclusivamente ao clicar no botão **"Cancelar"**, no ícone **"X"** superior ou ao concluir com sucesso a ação pretendida.

4. **ESTADO INICIAL LIMPO (ZEROED OUT)**:
   - Todo o conjunto de dados inicial e novos registos iniciam com:
     - `status`: `'lead'` (Novo Lead)
     - `notes`: `[]` (Sem notas pré-fabricadas ou fictícias)
     - `estimatedValue`: `0` (0 Kz, valores só existem quando atribuídos pelo utilizador)
     - `priority`: `'hot'` (com telefone e sem site), `'warm'` (com telefone e com site), `'cold'` (sem telefone)

---

## 3. Arquitetura de Dados & Persistência

### 3.1. Base de Dados Atual (JSON Centralizado no Servidor)
- Ficheiro ativo: [`data/crm-database.json`](file:///home/anvima/projectos/amasoft_crm/data/crm-database.json)
- Módulo servidor: [`src/lib/server/db.ts`](file:///home/anvima/projectos/amasoft_crm/src/lib/server/db.ts)
- Endpoints API:
  - `GET /api/leads`: Carrega os leads da base persistente do servidor.
  - `POST /api/leads`: Salva as alterações na base do servidor.
  - `POST /api/leads/reset`: Restaura a base original com 100 leads limpos.
  - `GET /api/leads/export/original`: Download direto no formato de 14 campos.

### 3.2. Store Reativa do CRM
- Localização: [`src/lib/stores/crm.svelte.ts`](file:///home/anvima/projectos/amasoft_crm/src/lib/stores/crm.svelte.ts)
- Baseada nas Runes do Svelte 5 com sincronização bidirecional (Server API + cache `localStorage: amasoft_crm_leads_v2`).
- Métricas derivadas automáticas (`stats`): contagem por estágio, prioridade, valor total em pipeline, taxa de conversão, contas sem website/telefone, distribuição por províncias/setores.

### 3.3. Esquema de Dados (14 Campos Nativos)
- `title` (string)
- `categoryName` (string)
- `categories` (string[])
- `address`, `neighborhood`, `street`, `city`, `postalCode`, `state`, `countryCode` (strings / null)
- `website`, `phone`, `phoneUnformatted` (strings / null)
- `location` ({ lat: number, lng: number } | null)
- `plusCode` (string | null)
- **Extensões CRM**: `status`, `priority`, `estimatedValue`, `tags`, `notes`, `lastContactDate`, `nextFollowUpDate`.

---

## 4. Módulos e Componentes do Sistema

| Componente | Função e Recursos |
| :--- | :--- |
| [`Sidebar.svelte`](file:///home/anvima/projectos/amasoft_crm/src/lib/components/Sidebar.svelte) | Navegação lateral profissional, contadores em tempo real, filtros estratégicos (Sem Website, Alta Prioridade, Fechados), botão de purga sem telefone, widget de pipeline, atalhos de importação/exportação/restauração. |
| [`Header.svelte`](file:///home/anvima/projectos/amasoft_crm/src/lib/components/Header.svelte) | Barra superior limpa com breadcrumbs, busca global, indicador de salvamento automático no servidor, botão de importação, menu de exportação (formato original vs CRM completo) e CTA "Adicionar Empresa". |
| [`DashboardView.svelte`](file:///home/anvima/projectos/amasoft_crm/src/lib/components/DashboardView.svelte) | Painel executivo com KPIs (Total Contas, Oportunidades Quentes, Pipeline Kz, Taxa de Conversão), funil de vendas, oportunidades sem website (alvos prioritários) e top províncias. |
| [`KanbanView.svelte`](file:///home/anvima/projectos/amasoft_crm/src/lib/components/KanbanView.svelte) | Pipeline comercial interativo com 5 colunas (`Novo Lead`, `Em Contacto`, `Qualificação`, `Proposta`, `Fechado`), drag-and-drop nativo HTML5, somatório em Kz por coluna e botão de WhatsApp direto. |
| [`TableView.svelte`](file:///home/anvima/projectos/amasoft_crm/src/lib/components/TableView.svelte) | Diretório tabular com multi-filtros, ordenação, troca rápida de estágio, e paginação avançada (seletor de registos 10/20/50/100/Todas, salto direto por pílulas numéricas, input "Ir para página", botões primeira/última página). |
| [`MapView.svelte`](file:///home/anvima/projectos/amasoft_crm/src/lib/components/MapView.svelte) | Vista geográfica da cobertura de empresas por província em Angola com links diretos para o Google Maps. |
| [`LeadDrawer.svelte`](file:///home/anvima/projectos/amasoft_crm/src/lib/components/LeadDrawer.svelte) | Painel lateral deslizante com ficha completa, gerador de mensagens WhatsApp B2B corporativas personalizadas, histórico de notas/atividades cronológicas e exclusão individual com confirmação. |
| [`AddLeadModal.svelte`](file:///home/anvima/projectos/amasoft_crm/src/lib/components/AddLeadModal.svelte) | Modal de cadastro manual de novas empresas (valor estimado por defeito a 0 Kz, fechamento restrito a Cancelar/X). |
| [`ImportLeadsModal.svelte`](file:///home/anvima/projectos/amasoft_crm/src/lib/components/ImportLeadsModal.svelte) | Modal de importação com drag-and-drop de arquivos `.json`, validação de esquema, deteção inteligente de duplicados por nome/telefone, tabela de pré-visualização e opção de anti-duplicação. |
| [`PurgeNoPhoneModal.svelte`](file:///home/anvima/projectos/amasoft_crm/src/lib/components/PurgeNoPhoneModal.svelte) | Modal corporativo com tabela de pré-visualização de todas as contas sem telefone antes de efetuar a exclusão em lote. |
| [`ResetConfirmModal.svelte`](file:///home/anvima/projectos/amasoft_crm/src/lib/components/ResetConfirmModal.svelte) | Modal de segurança para reposição limpa da base de dados. |
| [`ToastContainer.svelte`](file:///home/anvima/projectos/amasoft_crm/src/lib/components/ToastContainer.svelte) | Sistema de notificações toast contextuais não-bloqueantes (`success`, `error`, `info`). |

---

## 5. Ferramentas Svelte MCP

O Agente tem acesso ao servidor Svelte MCP com documentação oficial do Svelte 5 / SvelteKit:
- **`list-sections`**: Para descobrir tópicos de documentação disponíveis.
- **`get-documentation`**: Para carregar detalhes técnicos aprofundados.
- **`svelte-autofixer`**: Analisador estático para validar código Svelte antes de entregar.
- **`playground-link`**: Gerador de links playground (apenas sob confirmação explícita).

---

## 6. Próxima Etapa Técnica (Roadmap)
- Transição da persistência em `data/crm-database.json` para SQLite com Prisma ORM mantendo a mesma API e tipos já estabelecidos.
