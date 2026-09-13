export interface WhatsAppTemplate {
	id: string;
	title: string;
	description: string;
	category: 'prospecting' | 'followup' | 'proposal' | 'meeting';
	getText: (companyName: string, categoryName: string, city: string) => string;
}

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
	{
		id: 'website-presence',
		title: 'Desenvolvimento Web & Presença Digital',
		description: 'Apresentação de serviços para empresas sem presença online',
		category: 'prospecting',
		getText: (companyName, categoryName, city) => 
			`Prezada equipa da *${companyName}*,\n\nCumprimentos da Amasoft Technologies.\n\nAcompanhamos o posicionamento da vossa empresa no setor de ${categoryName || 'prestação de serviços'} em ${city || 'Angola'} e identificámos potencial para fortalecer a vossa presença digital através de uma plataforma web institucional moderna e otimizada para captação de clientes corporativos.\n\nGostaríamos de apresentar uma proposta personalizada para o vosso setor. Teriam disponibilidade para uma breve reunião informativa esta semana?\n\nAtenciosamente,\n*Equipa Comercial | Amasoft*`
	},
	{
		id: 'erp-management',
		title: 'Sistemas de Gestão & Faturação AGT',
		description: 'Apresentação de ERP, faturação certificada e gestão operacional',
		category: 'prospecting',
		getText: (companyName, categoryName, city) => 
			`Estimada Direção da *${companyName}*,\n\nEntramos em contacto em representação da Amasoft Technologies, especialista no desenvolvimento de software de gestão empresarial e faturação certificada pela AGT em Angola.\n\nDispomos de soluções adaptadas à gestão de operações, stocks e tesouraria para empresas em ${city || 'Angola'}.\n\nSeria oportuno agendarmos uma demonstração remota de 15 minutos das nossas soluções?\n\nCom os melhores cumprimentos,\n*Amasoft Technologies*`
	},
	{
		id: 'followup-corporate',
		title: 'Acompanhamento de Proposta',
		description: 'Contacto de seguimento após envio de apresentação ou reunião',
		category: 'followup',
		getText: (companyName) => 
			`Olá, estimada equipa da *${companyName}*.\n\nEspero que se encontrem bem.\n\nEntro em contacto para dar seguimento à proposta de soluções tecnológicas enviada pela Amasoft. Gostaríamos de saber se tiveram oportunidade de analisar os detalhes ou se necessitam de algum esclarecimento adicional.\n\nEstamos à inteira disposição.\n\nAtenciosamente,\n*Amasoft Commercial Team*`
	},
	{
		id: 'meeting-scheduling',
		title: 'Convite para Reunião de Diagnóstico',
		description: 'Alinhamento de diagnóstico tecnológico presencial ou online',
		category: 'meeting',
		getText: (companyName) => 
			`Prezados Senhores da *${companyName}*,\n\nCom vista a mapear as necessidades tecnológicas e operacionais da vossa empresa, gostaríamos de agendar uma sessão breve de diagnóstico com a nossa equipa técnica.\n\nIndique-nos, por favor, a vossa melhor disponibilidade (data e horário) para realizarmos esta conversa.\n\nCom os melhores cumprimentos,\n*Amasoft Technologies*`
	}
];

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
