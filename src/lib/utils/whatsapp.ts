import type { CompanyProfile } from '../types/crm';

export interface WhatsAppTemplate {
	id: string;
	title: string;
	description: string;
	category: 'prospecting' | 'followup' | 'proposal' | 'meeting' | 'closing' | 'reactivation';
	getText: (companyName: string, categoryName: string, city: string, company?: CompanyProfile, assigneeName?: string) => string;
}

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
	// ── PROSPECÇÃO ──
	{
		id: 'website-presence',
		title: 'Presença Digital & Web',
		description: 'Empresas sem website — apresentação de serviços web e SEO',
		category: 'prospecting',
		getText: (companyName, categoryName, city, company) =>
			`Prezada equipa da *${companyName}*,\n\nCumprimentos da *${company?.name || 'Amasoft Technologies'}*.\n\nAcompanhamos o posicionamento da vossa empresa no setor de ${categoryName || 'prestação de serviços'} em ${city || 'Angola'} e identificámos potencial para fortalecer a vossa presença digital.\n\nDispomos de soluções de desenvolvimento web, SEO e captação de clientes corporativos adaptadas ao mercado angolano.\n\nTeriam disponibilidade para uma breve reunião informativa esta semana?\n\nAtenciosamente,\n*${company?.slogan || 'Amasoft Technologies'}*\n${company?.website || ''}`
	},
	{
		id: 'erp-management',
		title: 'Sistema de Gestão & ERP',
		description: 'ERP, faturação AGT, gestão de stocks e tesouraria',
		category: 'prospecting',
		getText: (companyName, categoryName, city, company) =>
			`Estimada Direção da *${companyName}*,\n\nEntramos em contacto em representação da *${company?.name || 'Amasoft Technologies'}*, especialista em software de gestão empresarial e faturação certificada pela AGT.\n\nDispomos de soluções para:\n• Gestão de operações e stocks\n• Faturação eletrónica certificada\n• Controlo de tesouraria e relatórios\n\nAdaptamos cada módulo à realidade operacional de empresas em ${city || 'Angola'}.\n\nSeria oportuno agendarmos uma demonstração de 15 minutos?\n\nCom os melhores cumprimentos,\n*${company?.name || 'Amasoft Technologies'}*`
	},
	{
		id: 'mobile-app',
		title: 'Aplicação Móvel & SaaS',
		description: 'Apps móveis personalizadas e soluções SaaS sob demanda',
		category: 'prospecting',
		getText: (companyName, categoryName, city, company) =>
			`Prezados Senhores da *${companyName}*,\n\nA *${company?.name || 'Amasoft Technologies'}* desenvolve aplicações móveis e soluções SaaS sob medida para empresas em ${city || 'Angola'}.\n\nSe a vossa operação necessita de uma ferramenta interna para equipas, gestão de cliente ou processos digitais, podemos apresentar uma proposta técnica e comercial em 48 horas.\n\nPodemos agendar uma conversa breve para apresentar opções?\n\nAtenciosamente,\n*${company?.name || 'Amasoft Technologies'}*\n${company?.website || ''}`
	},
	{
		id: 'digital-marketing',
		title: 'Marketing Digital & Mídia',
		description: 'Campanhas Google Ads, Meta Ads e gestão de redes sociais',
		category: 'prospecting',
		getText: (companyName, categoryName, city, company) =>
			`Olá, *${companyName}*!\n\nSomos a equipa de marketing digital da *${company?.name || 'Amasoft Technologies'}*.\n\nTrabalhamos com empresas em ${city || 'Angola'} para aumentar a visibilidade online através de:\n• Google Ads e SEO\n• Meta Ads (Facebook/Instagram)\n• Gestão de redes sociais\n• Conteúdo e branding corporativo\n\nGostaríamos de apresentar um plano de marketing personalizado para o vosso setor.\n\nPodemos conversar brevemente?\n\nAtenciosamente,\n*${company?.name || 'Amasoft Technologies'}*`
	},

	// ── ACOMPANHAMENTO ──
	{
		id: 'followup-corporate',
		title: 'Acompanhamento de Proposta',
		description: 'Contacto de seguimento após envio de apresentação ou reunião',
		category: 'followup',
		getText: (companyName, _, __, company, assigneeName) =>
			`Olá, estimada equipa da *${companyName}*.\n\nEspero que se encontrem bem.\n\nEntro em contacto para dar seguimento à proposta de soluções tecnológicas enviada pela *${company?.name || 'Amasoft'}*. Gostaríamos de saber se tiveram oportunidade de analisar os detalhes ou se necessitam de algum esclarecimento adicional.\n\nEstamos à inteira disposição.\n\nAtenciosamente,\n*${assigneeName || company?.name || 'Amasoft Commercial Team'}*`
	},
	{
		id: 'followup-technical',
		title: 'Follow-up Técnico',
		description: 'Verificar necessidades técnicas e requisitos do projeto',
		category: 'followup',
		getText: (companyName, _, __, company, assigneeName) =>
			`Prezados da *${companyName}*,\n\nApós a nossa última conversa, gostaria de saber se conseguiram definir os requisitos técnicos para o projeto de ${company?.sector || 'gestão empresarial'}.\n\nA nossa equipa técnica está disponível para esclarecer dúvidas e ajustar a proposta conforme as vossas necessidades operacionais.\n\nPodemos agendar uma sessão técnica de 20 minutos?\n\nCumprimentos,\n*${assigneeName || company?.name || 'Amasoft Technologies'}*`
	},
	{
		id: 'followup-value',
		title: 'Follow-up de Valor',
		description: 'Reforçar benefícios e ROI da solução proposta',
		category: 'followup',
		getText: (companyName, _, __, company, assigneeName) =>
			`Estimados da *${companyName}*,\n\nEspero que estejam bem.\n\nRelembramos que a solução proposta pela *${company?.name || 'Amasoft'}* foi concebida para:\n• Reduzir custos operacionais em 20-30%\n• Automatizar processos manuais\n• Aumentar a eficiência da vossa equipa\n\nEstamos disponíveis para apresentar um estudo de caso similar ao vosso setor.\n\nPodemos conversar?\n\nAtenciosamente,\n*${assigneeName || company?.name || 'Amasoft Technologies'}*`
	},

	// ── REUNIÃO ──
	{
		id: 'meeting-scheduling',
		title: 'Convite para Reunião',
		description: 'Agendar sessão de diagnóstico presencial ou online',
		category: 'meeting',
		getText: (companyName, _, __, company) =>
			`Prezados Senhores da *${companyName}*,\n\nCom vista a mapear as necessidades tecnológicas e operacionais da vossa empresa, gostaríamos de agendar uma sessão breve de diagnóstico com a nossa equipa técnica.\n\nIndique-nos, por favor, a vossa melhor disponibilidade (data e horário) para realizarmos esta conversa.\n\nCom os melhores cumprimentos,\n*${company?.name || 'Amasoft Technologies'}*\n${company?.phone || ''}`
	},
	{
		id: 'meeting-demo',
		title: 'Demonstração de Produto',
		description: 'Convite para demo ao vivo de software ou plataforma',
		category: 'meeting',
		getText: (companyName, categoryName, _, company) =>
			`Olá, *${companyName}*!\n\nA *${company?.name || 'Amasoft'}* gostaria de apresentar uma demonstração ao vivo do nosso sistema de ${categoryName || 'gestão empresarial'}.\n\nA sessão dura apenas 20 minutos e inclui:\n• Visão geral da plataforma\n• Funcionalidades relevantes para o vosso setor\n• Perguntas e respostas\n\nPodemos agendar para esta semana?\n\nAtenciosamente,\n*${company?.name || 'Amasoft Technologies'}*\n${company?.website || ''}`
	},
	{
		id: 'meeting-followup',
		title: 'Agendar Follow-up Pós-Reunião',
		description: 'Marcar segundo encontro após reunião realizada',
		category: 'meeting',
		getText: (companyName, _, __, company, assigneeName) =>
			`Prezados da *${companyName}*,\n\nAgradeço a oportunidade da reunião realizada recentemente.\n\nPara dar continuidade ao diagnóstico apresentado, gostaria de agendar um segundo encontro para:\n• Rever os pontos-chave discutidos\n• Apresentar a proposta técnica finalizada\n• Definir cronograma de implementação\n\nIndiquem a vossa melhor disponibilidade.\n\nAtenciosamente,\n*${assigneeName || company?.name || 'Amasoft Technologies'}*`
	},

	// ── ENCERRAMENTO ──
	{
		id: 'closing-proposal',
		title: 'Proposta Final & Encerramento',
		description: 'Enviar proposta comercial definitiva com prazo',
		category: 'closing',
		getText: (companyName, _, __, company, assigneeName) =>
			`Estimados Dirigentes da *${companyName}*,\n\nApós análise detalhada das vossas necessidades, apresentamos a proposta comercial definitiva da *${company?.name || 'Amasoft'}*.\n\nA proposta inclui:\n• Escopo completo de implementação\n• Cronograma de entrega\n• Suporte técnico por 12 meses\n• Condições especiais para contratos anuais\n\nPara formalizar, basta responder a esta mensagem com a vossa confirmação.\n\nAtenciosamente,\n*${assigneeName || company?.name || 'Amasoft Technologies'}*\n${company?.phone || ''}`
	},
	{
		id: 'closing-urgent',
		title: 'Urgência / Promoção Temporária',
		description: 'Criar urgência com prazo limitado ou condição especial',
		category: 'closing',
		getText: (companyName, _, __, company, assigneeName) =>
			`*${companyName}* — Atenção!\n\nA *${company?.name || 'Amasoft'}* tem uma condição especial para empresas que fechem contrato até final do mês:\n\n• 15% de desconto na implementação\n• Suporte premium incluído\n• Formação da equipa sem custo adicional\n\nEsta condição é válida apenas para os próximos 10 dias.\n\nInteressados? Basta responder "SIM" e entraremos em contacto.\n\n*${assigneeName || company?.name || 'Amasoft Technologies'}*`
	},

	// ── REATIVAÇÃO ──
	{
		id: 'reactivation-cold',
		title: 'Reativação de Lead Frio',
		description: 'Recontactar lead que não respondeu há mais de 30 dias',
		category: 'reactivation',
		getText: (companyName, categoryName, city, company) =>
			`Olá, *${companyName}*!\n\nAqui é da *${company?.name || 'Amasoft Technologies'}*.\n\nPassado algum tempo desde o nosso último contacto, gostaríamos de saber como está a situação de ${categoryName || 'gestão tecnológica'} na vossa empresa em ${city || 'Angola'}.\n\nDispomos de novidades e soluções que podem ser relevantes para o vosso negócio.\n\nPodemos marcar uma conversa rápida de 10 minutos?\n\nAtenciosamente,\n*${company?.name || 'Amasoft Technologies'}*`
	},
	{
		id: 'reactivation-referral',
		title: 'Indicação / Referência',
		description: 'Reativar lead através de indicação de terceiro',
		category: 'reactivation',
		getText: (companyName, _, __, company) =>
			`Prezados da *${companyName}*,\n\nFomos indicados por um parceiro de negócios que trabalha convosco e acredita que a *${company?.name || 'Amasoft Technologies'}* pode acrescentar valor à vossa operação em tecnologia.\n\nGostaríamos de apresentar brevemente as nossas soluções — sem compromisso.\n\nPodemos agendar uma conversa de 15 minutos?\n\nCumprimentos,\n*${company?.name || 'Amasoft Technologies'}*\n${company?.website || ''}`
	},
	{
		id: 'reactivation-event',
		title: 'Evento / Lançamento',
		description: 'Convidar para evento, webinar ou novo lançamento',
		category: 'reactivation',
		getText: (companyName, _, __, company) =>
			`*${companyName}*,\n\nA *${company?.name || 'Amasoft Technologies'}* está a organizar um webinar sobre tendências tecnológicas para empresas em Angola.\n\nTópicos:\n• Inteligência Artificial aplicada a negócios\n• Automação de processos\n• Segurança de dados\n\nGostaríamos de convidar a vossa equipa a participar.\n\nInteressados? Responda "QUERO" e enviamos os detalhes.\n\n*${company?.name || 'Amasoft Technologies'}*`
	}
];

export const WHATSAPP_CATEGORIES: Record<string, { label: string; color: string }> = {
	prospecting: { label: 'Prospecção', color: '#3b82f6' },
	followup: { label: 'Acompanhamento', color: '#f59e0b' },
	meeting: { label: 'Reunião', color: '#8b5cf6' },
	closing: { label: 'Encerramento', color: '#22c55e' },
	reactivation: { label: 'Reativação', color: '#ef4444' }
};

export function cleanAngolanPhone(phone: string | null | undefined): string | null {
	if (!phone) return null;
	const digits = phone.replace(/[^0-9]/g, '');
	if (!digits) return null;

	if (digits.startsWith('244') && digits.length >= 12) {
		return digits;
	}
	if (digits.length === 9 && (digits.startsWith('9') || digits.startsWith('2'))) {
		return `244${digits}`;
	}
	return digits;
}

export function generateWhatsAppLink(phone: string | null | undefined, message?: string): string | null {
	const cleaned = cleanAngolanPhone(phone);
	if (!cleaned) return null;
	const encodedMsg = message ? `?text=${encodeURIComponent(message)}` : '';
	return `https://wa.me/${cleaned}${encodedMsg}`;
}
