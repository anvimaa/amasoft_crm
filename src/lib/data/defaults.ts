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
		id: 'tmpl-web-presenca',
		title: 'Presença Digital & Website',
		description: 'Empresas sem website — proposta de desenvolvimento web e SEO',
		category: 'prospecting',
		content: `Prezada equipa da *{empresa}*,\n\nCumprimentos da *{minha_empresa}*.\n\nAcompanhamos o posicionamento da vossa empresa no setor de {setor} em {cidade} e identificámos uma excelente oportunidade para fortalecer a vossa presença digital.\n\nDispomos de soluções de desenvolvimento de websites corporativos, catálogo online e captação de clientes adaptadas ao mercado angolano.\n\nTeriam disponibilidade para uma breve reunião informativa de 15 minutos esta semana?\n\nAtenciosamente,\n*{meu_nome}*\n{website}`,
		isDefault: true,
		createdAt: new Date().toISOString()
	},
	{
		id: 'tmpl-erp-gestao',
		title: 'Software de Gestão & Faturação AGT',
		description: 'Apresentação de ERP, faturação eletrónica e controlo de stock',
		category: 'prospecting',
		content: `Estimada Direção da *{empresa}*,\n\nEntramos em contacto em representação da *{minha_empresa}*, especialista em software de gestão empresarial e faturação certificada pela AGT.\n\nDispomos de soluções completas para:\n• Faturação eletrónica certificada AGT\n• Gestão integrada de stocks e tesouraria\n• Relatórios executivos em tempo real\n\nPodemos agendar uma demonstração rápida de 15 minutos via Google Meet ou presencialmente em {cidade}?\n\nCom os melhores cumprimentos,\n*{minha_empresa}*`,
		isDefault: true,
		createdAt: new Date().toISOString()
	},
	{
		id: 'tmpl-followup-proposta',
		title: 'Seguimento de Proposta Comercial',
		description: 'Acompanhamento após envio de orçamento/proposta formal',
		category: 'followup',
		content: `Olá, estimada equipa da *{empresa}*.\n\nEspero que se encontrem bem.\n\nEntro em contacto para dar seguimento à proposta de soluções tecnológicas enviada pela *{minha_empresa}*. Gostaríamos de saber se tiveram oportunidade de analisar os detalhes ou se necessitam de algum esclarecimento adicional ou ajuste no plano.\n\nEstamos à inteira disposição para apoiar a vossa decisão.\n\nAtenciosamente,\n*{meu_nome}*\n*{minha_empresa}*`,
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

