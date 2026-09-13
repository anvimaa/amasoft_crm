import type { ClientLead, LeadPriority, LeadStatus } from '../types/crm';
import rawData from './clientes.json';

function getInitialPriority(_item: { website: string | null; phone: string | null; categoryName: string }): LeadPriority {
	return 'cold';
}

export const INITIAL_LEADS: ClientLead[] = (rawData as any[]).map((item, index) => {
	const priority = getInitialPriority(item);
	const tags: string[] = [];
	
	if (!item.website) {
		tags.push('Sem Website');
	} else {
		tags.push('Com Website');
	}

	if (item.phone) {
		tags.push('Telefone Válido');
	}

	if (item.city) {
		tags.push(item.city);
	}

	return {
		id: `lead-${index + 1}`,
		title: item.title || 'Sem Nome',
		categories: item.categories || [],
		categoryName: item.categoryName || 'Geral',
		address: item.address || null,
		neighborhood: item.neighborhood || null,
		street: item.street || null,
		city: item.city || 'Desconhecida',
		postalCode: item.postalCode || null,
		state: item.state || null,
		countryCode: item.countryCode || 'AO',
		website: item.website || null,
		phone: item.phone || null,
		phoneUnformatted: item.phoneUnformatted || null,
		location: item.location || null,
		plusCode: item.plusCode || null,
		
		// Todos começam a zeros e como Novo Lead
		status: 'lead' as LeadStatus,
		priority: priority,
		estimatedValue: 0, // Inicia rigorosamente a 0 Kz
		tags: tags,
		notes: [],
		lastContactDate: null,
		nextFollowUpDate: null
	};
});
