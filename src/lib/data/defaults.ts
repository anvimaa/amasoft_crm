import type { CompanyProfile, TeamMember } from '../types/crm';

export const DEFAULT_COMPANY: CompanyProfile = {
	id: 'company-1',
	name: 'Amasoft Technologies',
	nif: '',
	sector: 'Tecnologia & Software',
	website: 'https://amasoft.co.ao',
	email: 'comercial@amasoft.co.ao',
	phone: '+244 923 456 789',
	address: 'Luanda, Angola',
	city: 'Luanda',
	logoUrl: '',
	slogan: 'Soluções tecnológicas para empresas em Angola'
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
