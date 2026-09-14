import type { ApproachTemplate, CommercialProposal, CompanyProfile, TeamMember } from '../types/crm';

export const DEFAULT_COMPANY: CompanyProfile = {
	id: 'company-1',
	name: 'Amasoft Technologies',
	nif: '5001234567',
	sector: 'Tecnologia & Software',
	website: 'https://amasoft.co.ao',
	email: 'comercial@amasoft.co.ao',
	phone: '+244 923 456 789',
	address: 'Rua Rainha Ginga, Edifício Kilamba, 4º Andar, Luanda, Angola',
	city: 'Luanda',
	logoUrl: '',
	slogan: 'Soluções tecnológicas & inovação empresarial em Angola',
	bankName: 'Banco BAI',
	bankIban: 'AO06 0040 0000 1234 5678 9012 3',
	bankAccountHolder: 'AMANTENTE SOFT - COMERCIO & SERVIÇOS, LDA',
	bankSwift: 'BAIAOALU'
};

export const DEFAULT_TEAM: TeamMember[] = [
	{
		id: 'member-1',
		name: 'Anvima',
		role: 'Administrador & Comercial',
		email: 'anvima@amasoft.co.ao',
		phone: '+244 923 456 789',
		color: '#22c55e',
		isActive: true
	}
];

export const DEFAULT_TEMPLATES: ApproachTemplate[] = [
	{
		id: 'tmpl-factflexi-pitch',
		title: 'Fact Flexi — Faturação Certificada AGT',
		description: 'Apresentação do software de faturação eletrónica Fact Flexi com demonstração',
		category: 'prospecting',
		content: `Estimada equipa da *{empresa}*,\n\nCumprimentos da *{minha_empresa}*.\n\nSabemos que a conformidade fiscal e a rapidez no atendimento são prioridades para as empresas em {cidade}. Gostaríamos de apresentar o nosso software de faturação eletrónica *Fact Flexi*, certificado pela AGT.\n\n*Principais Vantagens:* \n• Emissão rápida de Faturas, Recibos e Guias certificadas pela AGT\n• Ficheiro SAF-T Angola gerado em 1 clique sem erros\n• Controlo completo de stocks, inventário e fechos de caixa\n• Funciona em computador, POS e telemóvel\n\nPodemos agendar uma breve demonstração prática de 15 minutos esta semana para a vossa equipa conhecer o sistema?\n\nAtenciosamente,\n*{meu_nome}*\n*{minha_empresa}*`,
		isDefault: true,
		createdAt: new Date().toISOString()
	},
	{
		id: 'tmpl-web-presenca',
		title: 'Desenvolvimento de Website & Catálogo',
		description: 'Empresas sem website — proposta de criação de website institucional e catálogo online',
		category: 'prospecting',
		content: `Prezada Direção da *{empresa}*,\n\nCumprimentos da equipa da *{minha_empresa}*.\n\nAcompanhamos o vosso trabalho no setor de {setor} em {cidade} e identificámos uma excelente oportunidade para posicionar a vossa marca na internet com um website institucional moderno e catálogo de produtos.\n\n*O que desenvolvemos:*\n• Website institucional responsivo e otimizado para telemóveis\n• Catálogo online com botão de pedido direto para o vosso WhatsApp\n• Email corporativo personalizado (ex: info@{empresa}.ao)\n• Otimização para os clientes encontrarem a vossa empresa no Google\n\nTeriam disponibilidade para conversarmos brevemente esta semana sobre como colocar o vosso website no ar?\n\nCom os melhores cumprimentos,\n*{meu_nome}*\n*{minha_empresa}*`,
		isDefault: true,
		createdAt: new Date().toISOString()
	},
	{
		id: 'tmpl-custom-app',
		title: 'Desenvolvimento de Apps & Sistemas por Medida',
		description: 'Apresentação de serviços de engenharia de software para projetos sob medida',
		category: 'prospecting',
		content: `Estimada equipa da *{empresa}*,\n\nA *{minha_empresa}* é uma empresa angolana especializada no desenvolvimento de soluções digitais avançadas e softwares personalizados.\n\n*As nossas áreas de desenvolvimento por medida:*\n• Aplicações Móveis (Android & iOS) para clientes e equipas de campo\n• Portais de Clientes, Extranets e Áreas de Membros\n• Sistemas Web sob medida para automação de processos internos\n• Integração de pagamentos por Multicaixa Express e APIs bancárias\n\nSe a *{empresa}* tem um projeto ou necessidade específica em mente, gostaríamos de agendar uma reunião técnica para fazer o levantamento de requisitos sem qualquer custo.\n\nAtenciosamente,\n*{meu_nome}*\n*{minha_empresa}*`,
		isDefault: true,
		createdAt: new Date().toISOString()
	},
	{
		id: 'tmpl-suporte-retainer',
		title: 'Assistência Técnica & Retainer de TI',
		description: 'Proposta de contrato mensal de suporte de informática, redes e manutenção',
		category: 'prospecting',
		content: `Prezados Senhores da *{empresa}*,\n\nA continuidade do vosso negócio depende de sistemas estáveis, computadores rápidos e redes protegidas.\n\nA *{minha_empresa}* disponibiliza planos mensais de *Assistência Técnica & Retainer TI* dedicados a empresas em {cidade}:\n\n• Suporte técnico preventivo e corretivo (presencial e remoto prioritário)\n• Gestão e configuração de servidores, cópias de segurança (backups) diárias\n• Manutenção de computadores, impressoras e redes locais de escritório\n• Atendimento rápido com SLA garantido por contrato\n\nPodemos enviar uma proposta com plano de horas adequado ao tamanho da vossa estrutura?\n\nCom os melhores cumprimentos,\n*{meu_nome}*\n*{minha_empresa}*`,
		isDefault: true,
		createdAt: new Date().toISOString()
	},
	{
		id: 'tmpl-renovacao-saas',
		title: 'Aviso de Renovação de Licença SaaS',
		description: 'Notificação de vencimento de licença de software com dados bancários',
		category: 'followup',
		content: `*Aviso de Renovação de Subscrição — {minha_empresa}*\n\nEstimada equipa da *{empresa}*,\n\nInformamos que a vossa subscrição de software está próxima do vencimento para renovação do período contratado.\n\nPara garantir a continuidade ininterrupta do serviço, emissão de faturas e suporte técnico, solicitamos a regularização da licença.\n\n*Dados para Pagamento:*\n• *Banco:* {minha_empresa}\n• *Contacto:* {telefone}\n\nApós a transferência, por favor enviem o comprovativo para emissão do respetivo recibo e extensão imediata da licença no sistema.\n\nCom os melhores cumprimentos,\n*{minha_empresa}*`,
		isDefault: true,
		createdAt: new Date().toISOString()
	},
	{
		id: 'tmpl-followup-proposta',
		title: 'Seguimento de Proposta Comercial',
		description: 'Acompanhamento após envio de orçamento/proposta formal',
		category: 'followup',
		content: `Olá, estimada equipa da *{empresa}*.\n\nEspero que se encontrem bem.\n\nEntro em contacto para dar seguimento à proposta comercial de soluções tecnológicas enviada pela *{minha_empresa}*. Gostaríamos de saber se tiveram oportunidade de analisar os detalhes ou se necessitam de algum esclarecimento adicional ou ajuste no plano.\n\nEstamos à inteira disposição para apoiar a vossa decisão.\n\nAtenciosamente,\n*{meu_nome}*\n*{minha_empresa}*`,
		isDefault: true,
		createdAt: new Date().toISOString()
	},
	{
		id: 'tmpl-reuniao-diagnostico',
		title: 'Convite para Sessão de Diagnóstico',
		description: 'Agendar diagnóstico técnico/comercial presencial ou online',
		category: 'meeting',
		content: `Prezados Senhores da *{empresa}*,\n\nCom vista a mapear as necessidades operacionais e tecnológicas da vossa empresa em {cidade}, gostaríamos de agendar uma breve sessão de diagnóstico com os nossos consultores.\n\nIndiquem-nos, por favor, a vossa melhor disponibilidade (data e horário) para realizarmos esta conversa sem qualquer compromisso.\n\nCom os melhores cumprimentos,\n*{meu_nome}*\n*{minha_empresa}*`,
		isDefault: true,
		createdAt: new Date().toISOString()
	},
	{
		id: 'tmpl-encerramento-urgencia',
		title: 'Condição Especial de Fecho de Mês',
		description: 'Campanha de encerramento com benefício exclusivo temporário',
		category: 'closing',
		content: `*{empresa}* — Oportunidade Especial:\n\nA *{minha_empresa}* está com uma condição promocional exclusiva para novos projetos fechados até ao final do mês:\n\n• 15% de desconto direto na taxa de implementação\n• Suporte técnico prioritário incluído\n• Formação completa da vossa equipa\n\nPodemos formalizar a adjudicação esta semana para garantir esta condição?\n\n*Contacto:* {telefone}\n*{minha_empresa}*`,
		isDefault: true,
		createdAt: new Date().toISOString()
	},
	{
		id: 'tmpl-reativacao-contacto',
		title: 'Reativação de Contacto Comercial',
		description: 'Recontactar lead que não respondeu há mais de 30 dias',
		category: 'reactivation',
		content: `Olá, *{empresa}*!\n\nAqui é o/a *{meu_nome}* da *{minha_empresa}*.\n\nPassado algum tempo desde a nossa última conversa, gostaríamos de saber como estão os projetos e desafios de {setor} na vossa empresa em {cidade}.\n\nLançámos recentemente novas soluções que podem acelerar a vossa produtividade.\n\nPodemos retomar o contacto com uma breve conversa de 10 minutos?\n\nAtenciosamente,\n*{minha_empresa}*`,
		isDefault: true,
		createdAt: new Date().toISOString()
	}
];

export const DEFAULT_PROPOSALS: CommercialProposal[] = [];

export const DEFAULT_SAAS_CATALOG = [
	{
		id: 'prod-fact-flexi',
		name: 'Fact Flexi',
		category: 'Faturação Eletrónica & Gestão Comercial',
		description: 'Software de faturação certificado pela AGT com módulos de vendas, clientes, stock e tesouraria.',
		defaultPlans: [
			{
				name: 'Plano Básico (Mono-Posto)',
				priceMonthlyKz: 15000,
				priceAnnualKz: 150000,
				features: ['1 Posto de Trabalho', 'Faturação Ilimitada', 'Certificação AGT', 'Suporte Standard']
			},
			{
				name: 'Plano Profissional (Multi-Caixa)',
				priceMonthlyKz: 35000,
				priceAnnualKz: 350000,
				features: ['Até 3 Postos', 'Gestão de Stocks', 'Faturação e Recibos', 'Relatórios Avançados', 'Suporte Prioritário']
			},
			{
				name: 'Plano Corporativo / Enterprise',
				priceMonthlyKz: 75000,
				priceAnnualKz: 750000,
				features: ['Postos Ilimitados', 'Multi-Armazém', 'Gestão Financeira & Tesouraria', 'Acesso Multi-Utilizador', 'Suporte 24/7']
			}
		]
	},
	{
		id: 'prod-amasoft-crm',
		name: 'Amasoft CRM',
		category: 'Gestão Comercial & Pipeline de Vendas',
		description: 'CRM B2B com funil de vendas, gerador de orçamentos, integração WhatsApp e catálogo de soluções.',
		defaultPlans: [
			{
				name: 'Plano Comercial (Até 3 Usuários)',
				priceMonthlyKz: 25000,
				priceAnnualKz: 250000,
				features: ['Até 3 Vendedores', 'Pipeline Visual', 'Exportação PDF Propostas', 'Integração WhatsApp']
			},
			{
				name: 'Plano Empresa (Até 10 Usuários)',
				priceMonthlyKz: 55000,
				priceAnnualKz: 550000,
				features: ['Até 10 Vendedores', 'Múltiplas Linhas de Negócio', 'Gestão de Licenças & Subscrições', 'Métricas MRR/ARR']
			}
		]
	}
];

