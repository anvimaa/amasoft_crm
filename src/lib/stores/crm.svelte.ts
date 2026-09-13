import type { ClientLead, CRMFilterOptions, CRMStats, LeadPriority, LeadStatus, Note, RawClientData } from '../types/crm';
import { INITIAL_LEADS } from '../data/initial-leads';

const STORAGE_KEY = 'amasoft_crm_leads_v2';

class CRMState {
	leads = $state<ClientLead[]>([]);
	selectedLead = $state<ClientLead | null>(null);
	activeView = $state<'dashboard' | 'kanban' | 'table' | 'map'>('dashboard');
	isDrawerOpen = $state<boolean>(false);
	isAddModalOpen = $state<boolean>(false);
	isPurgeModalOpen = $state<boolean>(false);
	isResetModalOpen = $state<boolean>(false);
	isImportModalOpen = $state<boolean>(false);
	isLoaded = $state<boolean>(false);
	isSaving = $state<boolean>(false);

	filters = $state<CRMFilterOptions>({
		search: '',
		status: 'all',
		priority: 'all',
		city: 'all',
		category: 'all',
		hasWebsite: 'all',
		hasPhone: 'all',
		sortBy: 'title',
		sortOrder: 'asc'
	});

	constructor() {
		this.init();
	}

	async init() {
		if (typeof window !== 'undefined') {
			try {
				// 1. First try to load from Server JSON file
				const response = await fetch('/api/leads');
				if (response.ok) {
					const data = await response.json();
					if (Array.isArray(data) && data.length > 0) {
						this.leads = data;
						this.isLoaded = true;
						try {
							localStorage.setItem(STORAGE_KEY, JSON.stringify(this.leads));
						} catch {}
						return;
					}
				}
			} catch (e) {
				console.warn('Server API unavailable, checking local storage...', e);
			}

			// 2. Fallback to LocalStorage
			try {
				const saved = localStorage.getItem(STORAGE_KEY);
				if (saved) {
					const parsed = JSON.parse(saved);
					if (Array.isArray(parsed) && parsed.length > 0) {
						this.leads = parsed;
						this.isLoaded = true;
						return;
					}
				}
			} catch (e) {
				console.error('Error loading CRM leads from storage', e);
			}
		}

		// 3. Default to INITIAL_LEADS
		this.leads = INITIAL_LEADS;
		this.isLoaded = true;
	}

	async saveToStorage() {
		if (typeof window !== 'undefined') {
			// Save locally
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(this.leads));
			} catch (e) {
				console.error('Error saving to storage', e);
			}

			// Persist to Server data/crm-database.json
			try {
				this.isSaving = true;
				await fetch('/api/leads', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(this.leads)
				});
			} catch (e) {
				console.error('Error saving to server database:', e);
			} finally {
				this.isSaving = false;
			}
		}
	}

	// Filtered leads derived
	filteredLeads = $derived.by(() => {
		let result = [...this.leads];

		// Search
		if (this.filters.search.trim()) {
			const query = this.filters.search.toLowerCase().trim();
			result = result.filter(lead => 
				lead.title.toLowerCase().includes(query) ||
				(lead.categoryName && lead.categoryName.toLowerCase().includes(query)) ||
				(lead.city && lead.city.toLowerCase().includes(query)) ||
				(lead.address && lead.address.toLowerCase().includes(query)) ||
				(lead.phone && lead.phone.includes(query))
			);
		}

		// Status filter
		if (this.filters.status !== 'all') {
			result = result.filter(lead => lead.status === this.filters.status);
		}

		// Priority filter
		if (this.filters.priority !== 'all') {
			result = result.filter(lead => lead.priority === this.filters.priority);
		}

		// City filter
		if (this.filters.city !== 'all') {
			result = result.filter(lead => (lead.city || '').toLowerCase() === this.filters.city.toLowerCase());
		}

		// Category filter
		if (this.filters.category !== 'all') {
			result = result.filter(lead => lead.categoryName === this.filters.category);
		}

		// Has Website
		if (this.filters.hasWebsite === 'yes') {
			result = result.filter(lead => !!lead.website && lead.website.trim() !== '');
		} else if (this.filters.hasWebsite === 'no') {
			result = result.filter(lead => !lead.website || lead.website.trim() === '');
		}

		// Has Phone
		if (this.filters.hasPhone === 'yes') {
			result = result.filter(lead => !!lead.phone && lead.phone.trim() !== '');
		} else if (this.filters.hasPhone === 'no') {
			result = result.filter(lead => !lead.phone || lead.phone.trim() === '');
		}

		// Sorting
		result.sort((a, b) => {
			let comparison = 0;
			if (this.filters.sortBy === 'title') {
				comparison = a.title.localeCompare(b.title);
			} else if (this.filters.sortBy === 'city') {
				comparison = (a.city || '').localeCompare(b.city || '');
			} else if (this.filters.sortBy === 'estimatedValue') {
				comparison = (a.estimatedValue || 0) - (b.estimatedValue || 0);
			} else if (this.filters.sortBy === 'priority') {
				const order = { hot: 3, warm: 2, cold: 1 };
				comparison = (order[a.priority] || 0) - (order[b.priority] || 0);
			} else if (this.filters.sortBy === 'status') {
				const statusOrder: Record<LeadStatus, number> = {
					lead: 1,
					contacted: 2,
					meeting: 3,
					proposal: 4,
					won: 5,
					lost: 0
				};
				comparison = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
			}
			return this.filters.sortOrder === 'asc' ? comparison : -comparison;
		});

		return result;
	});

	// Dynamic stats
	stats = $derived.by<CRMStats>(() => {
		const totalLeads = this.leads.length;
		const byStatus: Record<LeadStatus, number> = {
			lead: 0,
			contacted: 0,
			meeting: 0,
			proposal: 0,
			won: 0,
			lost: 0
		};
		const byPriority: Record<LeadPriority, number> = {
			hot: 0,
			warm: 0,
			cold: 0
		};
		let totalPipelineValue = 0;
		let wonPipelineValue = 0;
		let missingWebsiteCount = 0;
		let withPhoneCount = 0;
		const cityCountMap: Record<string, number> = {};
		const catCountMap: Record<string, number> = {};

		for (const lead of this.leads) {
			if (byStatus[lead.status] !== undefined) {
				byStatus[lead.status]++;
			}
			if (byPriority[lead.priority] !== undefined) {
				byPriority[lead.priority]++;
			}

			const val = lead.estimatedValue || 0;
			if (lead.status !== 'lost') {
				totalPipelineValue += val;
			}
			if (lead.status === 'won') {
				wonPipelineValue += val;
			}
			if (!lead.website || lead.website.trim() === '') {
				missingWebsiteCount++;
			}
			if (lead.phone && lead.phone.trim() !== '') {
				withPhoneCount++;
			}

			const city = lead.city || 'Desconhecida';
			cityCountMap[city] = (cityCountMap[city] || 0) + 1;

			const cat = lead.categoryName || 'Geral';
			catCountMap[cat] = (catCountMap[cat] || 0) + 1;
		}

		const topCities = Object.entries(cityCountMap)
			.map(([city, count]) => ({ city, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 8);

		const topCategories = Object.entries(catCountMap)
			.map(([category, count]) => ({ category, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 8);

		const conversionRate = totalLeads > 0 ? (byStatus.won / totalLeads) * 100 : 0;
		const missingPhoneCount = totalLeads - withPhoneCount;

		return {
			totalLeads,
			byStatus,
			byPriority,
			totalPipelineValue,
			wonPipelineValue,
			conversionRate,
			missingWebsiteCount,
			withPhoneCount,
			missingPhoneCount,
			topCities,
			topCategories
		};
	});

	// Dropdowns lists
	availableCities = $derived.by(() => {
		const cities = new Set<string>();
		for (const lead of this.leads) {
			if (lead.city) cities.add(lead.city);
		}
		return Array.from(cities).sort();
	});

	availableCategories = $derived.by(() => {
		const cats = new Set<string>();
		for (const lead of this.leads) {
			if (lead.categoryName) cats.add(lead.categoryName);
		}
		return Array.from(cats).sort();
	});

	// Actions
	selectLead(lead: ClientLead | null) {
		this.selectedLead = lead;
		this.isDrawerOpen = !!lead;
	}

	updateStatus(leadId: string, newStatus: LeadStatus) {
		const leadIndex = this.leads.findIndex(l => l.id === leadId);
		if (leadIndex !== -1) {
			this.leads[leadIndex].status = newStatus;
			this.leads[leadIndex].lastContactDate = new Date().toISOString();
			
			const statusLabels: Record<LeadStatus, string> = {
				lead: 'Novo Lead',
				contacted: 'Em Contacto',
				meeting: 'Qualificação',
				proposal: 'Proposta Enviada',
				won: 'Fechado',
				lost: 'Desqualificado'
			};
			this.leads[leadIndex].notes.unshift({
				id: `note-${Date.now()}`,
				content: `Estágio alterado para "${statusLabels[newStatus]}".`,
				createdAt: new Date().toISOString(),
				type: 'general'
			});

			if (this.selectedLead?.id === leadId) {
				this.selectedLead = { ...this.leads[leadIndex] };
			}
			this.saveToStorage();
		}
	}

	updatePriority(leadId: string, priority: LeadPriority) {
		const leadIndex = this.leads.findIndex(l => l.id === leadId);
		if (leadIndex !== -1) {
			this.leads[leadIndex].priority = priority;
			if (this.selectedLead?.id === leadId) {
				this.selectedLead = { ...this.leads[leadIndex] };
			}
			this.saveToStorage();
		}
	}

	addNote(leadId: string, content: string, type: Note['type'] = 'general') {
		const leadIndex = this.leads.findIndex(l => l.id === leadId);
		if (leadIndex !== -1 && content.trim()) {
			const note: Note = {
				id: `note-${Date.now()}`,
				content: content.trim(),
				createdAt: new Date().toISOString(),
				type
			};
			this.leads[leadIndex].notes.unshift(note);
			this.leads[leadIndex].lastContactDate = new Date().toISOString();
			
			if (this.selectedLead?.id === leadId) {
				this.selectedLead = { ...this.leads[leadIndex] };
			}
			this.saveToStorage();
		}
	}

	updateLead(updated: ClientLead) {
		const leadIndex = this.leads.findIndex(l => l.id === updated.id);
		if (leadIndex !== -1) {
			this.leads[leadIndex] = { ...updated };
			if (this.selectedLead?.id === updated.id) {
				this.selectedLead = { ...updated };
			}
			this.saveToStorage();
		}
	}

	addLead(newLead: Omit<ClientLead, 'id' | 'notes'>) {
		const id = `lead-custom-${Date.now()}`;
		const lead: ClientLead = {
			...newLead,
			id,
			notes: [
				{
					id: `note-${Date.now()}`,
					content: 'Registo criado no CRM Amasoft.',
					createdAt: new Date().toISOString(),
					type: 'general'
				}
			]
		};
		this.leads.unshift(lead);
		this.saveToStorage();
		this.selectLead(lead);
	}

	deleteLead(leadId: string) {
		this.leads = this.leads.filter(l => l.id !== leadId);
		if (this.selectedLead?.id === leadId) {
			this.selectedLead = null;
			this.isDrawerOpen = false;
		}
		this.saveToStorage();
	}

	deleteLeadsWithoutPhone(): number {
		const removed = this.leads.filter(l => !l.phone || l.phone.trim() === '').length;
		if (removed === 0) return 0;

		this.leads = this.leads.filter(l => !!l.phone && l.phone.trim() !== '');
		if (this.selectedLead && (!this.selectedLead.phone || this.selectedLead.phone.trim() === '')) {
			this.selectedLead = null;
			this.isDrawerOpen = false;
		}
		this.saveToStorage();
		return removed;
	}

	async resetToDefaults() {
		try {
			await fetch('/api/leads/reset', { method: 'POST' });
		} catch (e) {
			console.error('Error resetting on server:', e);
		}
		this.leads = [...INITIAL_LEADS];
		this.saveToStorage();
		this.selectedLead = null;
		this.isDrawerOpen = false;
	}

	// Export full CRM database with notes & pipeline data
	exportToJSON() {
		const jsonStr = JSON.stringify(this.leads, null, 2);
		const blob = new Blob([jsonStr], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `amasoft_crm_completo_${new Date().toISOString().split('T')[0]}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	// Export formatted EXACTLY like the original static/clientes.json
	exportOriginalFormat() {
		const originalFormatted = this.leads.map(lead => ({
			title: lead.title,
			categories: lead.categories && lead.categories.length > 0 ? lead.categories : [lead.categoryName || 'Geral'],
			address: lead.address,
			neighborhood: lead.neighborhood,
			street: lead.street,
			city: lead.city,
			postalCode: lead.postalCode,
			state: lead.state,
			countryCode: lead.countryCode || 'AO',
			website: lead.website,
			phone: lead.phone,
			phoneUnformatted: lead.phoneUnformatted,
			location: lead.location,
			plusCode: lead.plusCode,
			categoryName: lead.categoryName
		}));

		const jsonStr = JSON.stringify(originalFormatted, null, 2);
		const blob = new Blob([jsonStr], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `clientes_${new Date().toISOString().split('T')[0]}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	// Import leads from raw JSON dataset matching clientes.json schema
	async importLeads(
		rawItems: RawClientData[],
		options: { skipDuplicates?: boolean } = { skipDuplicates: true }
	): Promise<{ importedCount: number; skippedCount: number }> {
		const existingTitles = new Set(this.leads.map(l => l.title.trim().toLowerCase()));
		const existingPhones = new Set(
			this.leads
				.filter(l => l.phoneUnformatted || l.phone)
				.map(l => (l.phoneUnformatted || l.phone || '').replace(/[^0-9]/g, ''))
				.filter(Boolean)
		);

		let importedCount = 0;
		let skippedCount = 0;
		const nowTimestamp = Date.now();
		const newLeadsToAdd: ClientLead[] = [];

		rawItems.forEach((item, idx) => {
			if (!item || !item.title || !item.title.trim()) {
				skippedCount++;
				return;
			}

			const titleNormalized = item.title.trim().toLowerCase();
			const phoneClean = (item.phoneUnformatted || item.phone || '').replace(/[^0-9]/g, '');

			const isDuplicate =
				existingTitles.has(titleNormalized) ||
				(phoneClean.length >= 8 && existingPhones.has(phoneClean));

			if (options.skipDuplicates && isDuplicate) {
				skippedCount++;
				return;
			}

			// Prevent duplicates within the imported batch itself
			existingTitles.add(titleNormalized);
			if (phoneClean.length >= 8) {
				existingPhones.add(phoneClean);
			}

			// Standard priority logic
			let priority: LeadPriority = 'cold';
			if (item.phone && !item.website) {
				priority = 'hot';
			} else if (item.phone && item.website) {
				priority = 'warm';
			}

			const tags: string[] = [];
			if (!item.website) tags.push('Sem Website');
			else tags.push('Com Website');
			if (item.phone) tags.push('Telefone Válido');
			if (item.city) tags.push(item.city);

			const newLead: ClientLead = {
				id: `lead-imp-${nowTimestamp}-${idx + 1}`,
				title: item.title.trim(),
				categories: Array.isArray(item.categories) && item.categories.length > 0 
					? item.categories 
					: [item.categoryName || 'Geral'],
				categoryName: item.categoryName || (Array.isArray(item.categories) && item.categories[0]) || 'Geral',
				address: item.address || null,
				neighborhood: item.neighborhood || null,
				street: item.street || null,
				city: item.city || 'Desconhecida',
				postalCode: item.postalCode || null,
				state: item.state || null,
				countryCode: item.countryCode || 'AO',
				website: item.website || null,
				phone: item.phone || null,
				phoneUnformatted: item.phoneUnformatted || (item.phone ? item.phone.replace(/[^0-9]/g, '') : null),
				location: item.location || null,
				plusCode: item.plusCode || null,

				// CRM standard initial clean state
				status: 'lead' as LeadStatus,
				priority,
				estimatedValue: 0,
				tags,
				notes: [],
				lastContactDate: null,
				nextFollowUpDate: null
			};

			newLeadsToAdd.push(newLead);
			importedCount++;
		});

		if (newLeadsToAdd.length > 0) {
			this.leads = [...this.leads, ...newLeadsToAdd];
			await this.saveToStorage();
		}

		return { importedCount, skippedCount };
	}
}

export const crmStore = new CRMState();
