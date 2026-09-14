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
- Ficheiros ativos:
  - [`data/crm-database.json`](file:///home/anvima/projectos/amasoft_crm/data/crm-database.json): Leads do CRM.
  - [`data/company-profile.json`](file:///home/anvima/projectos/amasoft_crm/data/company-profile.json): Dados fiscais, bancários (IBAN) e perfil da empresa.
  - [`data/team-members.json`](file:///home/anvima/projectos/amasoft_crm/data/team-members.json): Equipa comercial e vendedores.
  - [`data/whatsapp-templates.json`](file:///home/anvima/projectos/amasoft_crm/data/whatsapp-templates.json): Modelos e scripts de abordagem comercial.
  - [`data/proposals.json`](file:///home/anvima/projectos/amasoft_crm/data/proposals.json): Propostas comerciais emitidas em Kwanzas (Kz).
- Módulo servidor: [`src/lib/server/db.ts`](file:///home/anvima/projectos/amasoft_crm/src/lib/server/db.ts)
- Endpoints API:
  - `GET /api/leads` / `POST /api/leads`: Carrega e grava leads.
  - `POST /api/leads/reset`: Restaura a base original com 100 leads limpos.
  - `GET /api/leads/export/original`: Download direto no formato de 14 campos.
  - `GET /api/company` / `POST /api/company`: Perfil da empresa e equipa comercial.
  - `GET /api/templates` / `POST /api/templates`: Modelos de abordagem multicanal.
  - `GET /api/proposals` / `POST /api/proposals`: Propostas comerciais orçamentadas.

### 3.2. Stores Reativas do CRM (Svelte 5 Runes)
- [`src/lib/stores/crm.svelte.ts`](file:///home/anvima/projectos/amasoft_crm/src/lib/stores/crm.svelte.ts) (`crmStore`): Leads, filtros, estatísticas e sincronização.
- [`src/lib/stores/company.svelte.ts`](file:///home/anvima/projectos/amasoft_crm/src/lib/stores/company.svelte.ts) (`companyStore`): Dados corporativos da empresa e equipa.
- [`src/lib/stores/templates.svelte.ts`](file:///home/anvima/projectos/amasoft_crm/src/lib/stores/templates.svelte.ts) (`templatesStore`): Modelos de abordagem, variáveis dinâmicas (`{empresa}`, `{decisor}`, `{meu_nome}`), renderizador e categorias.
- [`src/lib/stores/proposals.svelte.ts`](file:///home/anvima/projectos/amasoft_crm/src/lib/stores/proposals.svelte.ts) (`proposalsStore`): Propostas comerciais em Kz, cálculo de IVA (14%/isento), transição de estados e sincronização com leads.

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

| Componente | Rota / Função e Recursos |
| :--- | :--- |
| [`Sidebar.svelte`](file:///home/anvima/projectos/amasoft_crm/src/lib/components/Sidebar.svelte) | Navegação lateral profissional, contadores em tempo real, links de rotas (`/dashboard`, `/pipeline`, `/table`, `/map`, `/agenda`, `/propostas`, `/templates`), filtros estratégicos e atalhos. |
| [`Header.svelte`](file:///home/anvima/projectos/amasoft_crm/src/lib/components/Header.svelte) | Barra superior limpa com breadcrumbs dinâmicos, busca global, indicador de salvamento automático no servidor, menu de exportação e CTA "Adicionar Empresa". |
| [`DashboardView.svelte`](file:///home/anvima/projectos/amasoft_crm/src/lib/components/DashboardView.svelte) | Rota `/dashboard`: Painel executivo com KPIs em Kz, funil de vendas, oportunidades prioritárias sem website e top províncias. |
| [`KanbanView.svelte`](file:///home/anvima/projectos/amasoft_crm/src/lib/components/KanbanView.svelte) | Rota `/pipeline`: Pipeline comercial interativo com 5 colunas, drag-and-drop HTML5, somatório em Kz por coluna e botão de WhatsApp direto. |
| [`TableView.svelte`](file:///home/anvima/projectos/amasoft_crm/src/lib/components/TableView.svelte) | Rota `/table`: Diretório tabular com multi-filtros, ordenação, troca rápida de estágio e paginação completa. |
| [`MapView.svelte`](file:///home/anvima/projectos/amasoft_crm/src/lib/components/MapView.svelte) | Rota `/map`: Vista geográfica de cobertura por províncias em Angola com atalhos de rotas Google Maps. |
| [`AgendaView.svelte`](file:///home/anvima/projectos/amasoft_crm/src/lib/components/AgendaView.svelte) | Rota `/agenda`: Gestão de follow-ups diários, atrasados e reuniões agendadas. |
| [`ProposalsView.svelte`](file:///home/anvima/projectos/amasoft_crm/src/lib/components/ProposalsView.svelte) | Rota `/propostas`: Gestor de propostas comerciais com métricas (Total emitido Kz, taxa de aceitação), filtros por estado e tabela de cotações. |
| [`ProposalEditorModal.svelte`](file:///home/anvima/projectos/amasoft_crm/src/lib/components/ProposalEditorModal.svelte) | Editor dinâmico de propostas: adição de itens em Kz, cálculo automático de IVA (14%/isento), termos de pagamento, seleção de conta bancária/IBAN e associação ao Lead. |
| [`ProposalViewModal.svelte`](file:///home/anvima/projectos/amasoft_crm/src/lib/components/ProposalViewModal.svelte) | Modal de visualização de Proposta Comercial em folha padrão A4 pronta para impressão/exportação em PDF (`window.print()`), mudança de estado e gerador de mensagem de envio WhatsApp. |
| [`TemplatesView.svelte`](file:///home/anvima/projectos/amasoft_crm/src/lib/components/TemplatesView.svelte) | Rota `/templates`: Catálogo e gestor de modelos de abordagem categorizados (Primeiro Contacto, Sem Website, Proposta, Reunião, etc.) com preview ao vivo e cópia instantânea. |
| [`TemplateEditorModal.svelte`](file:///home/anvima/projectos/amasoft_crm/src/lib/components/TemplateEditorModal.svelte) | Editor visual de modelos com inserção rápida de tags dinâmicas (`{empresa}`, `{decisor}`, `{servicos}`, etc.) e pré-visualização em tempo real. |
| [`LeadDrawer.svelte`](file:///home/anvima/projectos/amasoft_crm/src/lib/components/LeadDrawer.svelte) | Painel lateral deslizante com ficha completa, gerador de mensagens WhatsApp integrado com os templates dinâmicos, aba de propostas vinculadas à conta e histórico de notas. |
| [`AddLeadModal.svelte`](file:///home/anvima/projectos/amasoft_crm/src/lib/components/AddLeadModal.svelte) | Modal de cadastro manual de novas empresas (valor inicial 0 Kz, backdrop estático). |
| [`ImportLeadsModal.svelte`](file:///home/anvima/projectos/amasoft_crm/src/lib/components/ImportLeadsModal.svelte) | Modal de importação com drag-and-drop de arquivos `.json`, validação de esquema, deteção inteligente de duplicados por nome/telefone e tabela de pré-visualização. |
| [`PurgeNoPhoneModal.svelte`](file:///home/anvima/projectos/amasoft_crm/src/lib/components/PurgeNoPhoneModal.svelte) | Modal com tabela de pré-visualização de todas as contas sem telefone antes da exclusão em lote. |
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
