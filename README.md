# Amasoft CRM — B2B Sales Pipeline & Prospecção Comercial

> CRM comercial corporativo e moderno para gestão de pipeline de vendas, prospecção e abordagem de empresas em Angola.

---

## Visão Geral

O **Amasoft CRM** é uma plataforma de gestão de relacionamento com clientes (CRM) e prospecção B2B de alto desempenho, desenhada com foco na estética minimalista dos produtos SaaS modernos (Linear, Attio, Stripe). 

Construído sobre o ecossistema reativo do **Svelte 5 (Runes)**, **SvelteKit** e **TailwindCSS 4**, o sistema oferece integração nativa com o mercado angolano (moeda Kwanza - AOA, prefixo telefónico +244, divisão provincial e gerador de templates corporativos para WhatsApp).

---

## Principais Funcionalidades

- **Pipeline Comercial Kanban**:
  - 5 estágios comerciais configurados (`Novo Lead`, `Em Contacto`, `Qualificação`, `Proposta`, `Fechado`).
  - Arrastar e largar (*Drag and Drop*) nativo em HTML5 com atualização em tempo real.
  - Somatório automático do valor financeiro do pipeline em Kwanzas (Kz) por coluna.
  - Acesso direto com 1 clique para conversa no WhatsApp.

- **Painel Executivo (Dashboard)**:
  - Métricas em tempo real: volume total em pipeline, taxa de conversão, oportunidades quentes e contas fechadas.
  - Análise de funil de conversão e distribuição territorial por província.
  - Segmentação inteligente de contas prioritárias (ex: empresas sem website com alto potencial para desenvolvimento web).

- **Diretório de Empresas & Paginação Avançada**:
  - Filtros multi-critério (estágio, prioridade, província, setor de atividade, presença de website e telefone).
  - Paginação completa com seletor de registos por página (10, 20, 50, 100 ou Todas), pílulas numéricas dinâmicas, salto direto para página e botões primeira/última página.
  - Edição rápida de estágio diretamente na tabela.

- **Ficha do Cliente & Abordagem B2B (Slide-over Drawer)**:
  - Visualização completa de dados cadastrais, moradas e localização geográfica.
  - Gerador de mensagens personalizadas para WhatsApp com templates corporativos B2B contextualizados.
  - Histórico cronológico de notas, registos de reuniões e chamadas.

- **Importação & Exportação Flexível de Dados**:
  - **Importador JSON**: Suporte a arrastar e largar de arquivos `.json`, validação de esquema, deteção inteligente de duplicados por nome/telefone e tabela de pré-visualização.
  - **Exportação Original**: Download direto compatível com o catálogo nativo de 14 campos (`clientes.json`).
  - **Exportação CRM Completo**: Backup integral em JSON contendo notas, estágios e valores estimados.

- **Higienização de Base de Dados**:
  - Modal de purga em lote para remoção de contactos sem telefone com pré-visualização tabular prévia.
  - Restauração segura da base original de dados.

---

## Tecnologias Utilizadas

| Tecnologia | Versão / Descrição |
| :--- | :--- |
| **Svelte 5** | Runes (`$state`, `$derived`, `$effect`, `$props`) para máxima performance reativa |
| **SvelteKit** | Framework full-stack com rotas API e renderização no servidor/cliente |
| **TypeScript** | Tipagem estrita em todo o código e modelo de dados |
| **TailwindCSS 4** | Estilização utilitária com tema escuro corporativo minimalista |
| **Bun** | Ambiente de execução e gestor de pacotes ultra-rápido |

---

## Estrutura do Projeto

```text
amasoft_crm/
├── data/
│   └── crm-database.json      # Base de dados ativa persistida no servidor
├── src/
│   ├── lib/
│   │   ├── components/        # Componentes de interface (Kanban, Table, Drawer, etc.)
│   │   │   ├── AddLeadModal.svelte
│   │   │   ├── DashboardView.svelte
│   │   │   ├── Header.svelte
│   │   │   ├── Icon.svelte
│   │   │   ├── ImportLeadsModal.svelte
│   │   │   ├── KanbanView.svelte
│   │   │   ├── LeadDrawer.svelte
│   │   │   ├── MapView.svelte
│   │   │   ├── PriorityBadge.svelte
│   │   │   ├── PurgeNoPhoneModal.svelte
│   │   │   ├── ResetConfirmModal.svelte
│   │   │   ├── Sidebar.svelte
│   │   │   ├── StatusBadge.svelte
│   │   │   ├── TableView.svelte
│   │   │   └── ToastContainer.svelte
│   │   ├── data/
│   │   │   ├── clientes.json   # Fonte inicial de dados
│   │   │   └── initial-leads.ts
│   │   ├── server/
│   │   │   └── db.ts           # Módulo de persistência no backend
│   │   ├── stores/
│   │   │   ├── crm.svelte.ts   # Store reativa do CRM com Svelte 5 Runes
│   │   │   └── toast.svelte.ts # Sistema de notificações toast
│   │   ├── types/
│   │   │   └── crm.ts          # Interfaces e tipos TypeScript
│   │   └── utils/
│   │       └── whatsapp.ts     # Utilitários e templates de WhatsApp
│   └── routes/
│       ├── +page.svelte        # Aplicação principal
│       └── api/
│           └── leads/          # Endpoints REST para sincronização e exportação
└── static/
    └── clientes.json          # Ficheiro bruto de dados estáticos
```

---

## Como Executar Localmente

### Pré-requisitos
- [Bun](https://bun.sh) (recomendado) ou Node.js 18+

### 1. Clonar o Repositório
```bash
git clone https://github.com/anvima/amasoft_crm.git
cd amasoft_crm
```

### 2. Instalar Dependências
```bash
bun install
```

### 3. Iniciar Servidor de Desenvolvimento
```bash
bun dev
```

Aceda à aplicação em seu navegador em `http://localhost:5173`.

### 4. Verificar Tipagem e Diagnósticos
```bash
bun run check
```

### 5. Compilar para Produção
```bash
bun run build
bun run preview
```

---

## API Pública & Integrações (Fact Flexi)

O Amasoft CRM disponibiliza endpoints para ingestão automática de clientes e faturas:
- **URL Base**: `https://crm.factflexi.com`
- **Endpoints**: `POST /api/v1/leads/external` e `POST /api/webhooks/factflexi`
- **Documentação Completa**: Consulte o arquivo [`API_DOCUMENTATION.md`](file:///home/anvima/projectos/amasoft_crm/API_DOCUMENTATION.md) para detalhes de autenticação, validação Zod e exemplos em cURL, Node.js, PHP e Python.

---

## Regras e Diretrizes de Design

1. **Zero Emojis**: Todo o sistema utiliza exclusivamente ícones vetoriais SVG (`Icon.svelte`) para garantir um visual corporativo de alto nível.
2. **Sem Diálogos Nativos do Browser**: É proibido o uso de `alert()`, `confirm()` ou `prompt()`. Todas as confirmações utilizam modais dedicados e toasts contextuais.
3. **Estado Inicial Limpo**: Novos registos e a base restaurada iniciam estritamente no estágio `Novo Lead` com valor de `0 Kz` e histórico vazio de notas.
4. **Fecho Seguro de Modais**: Backdrops escuros protegem contra fechos acidentais, exigindo clique em "Cancelar" ou no botão "X".

---

## Licença

Distribuído sob a licença **MIT**. Consulte o ficheiro `LICENSE` para mais detalhes.
