import type {
	ClientLead,
	CRMFilterOptions,
	CRMStats,
	FollowUpGroups,
	InteractionOutcome,
	LeadPriority,
	LeadStatus,
	Note,
	NoteType,
	RawClientData,
	SaaSSubscription,
	ClientProject,
	SupportContract
} from '../types/crm';
import { INITIAL_LEADS } from '../data/initial-leads';
import { companyStore } from './company.svelte';

const STORAGE_KEY = 'amasoft_crm_leads_v2';
const ETAG_KEY = 'amasoft_crm_etag';

const STALE_AFTER_DAYS = 14;

function toLocalDay(value: string | null): Date | null {
	if (!value) return null;
	try {
		// date input (YYYY-MM-DD) -> local midnight to avoid TZ shift
		const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
		if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
		const d = new Date(value);
		if (isNaN(d.getTime())) return null;
		return new Date(d.getFullYear(), d.getMonth(), d.getDate());
	} catch {
		return null;
	}
}

function startOfToday(): Date {
	const d = new Date();
	d.setHours(0, 0, 0, 0);
	return d;
}

class CRMState {
	leads = $state<ClientLead[]>([]);
	selectedLead = $state<ClientLead | null>(null);
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
		businessLine: 'all',
		sortBy: 'updatedAt',
		sortOrder: 'desc'
	});

	constructor() {
		this.init();
	}

	async init() {
		const now = new Date().toISOString();
		if (typeof window !== 'undefined') {
			// 1. Load from localStorage immediately (instant UI)
			try {
				const saved = localStorage.getItem(STORAGE_KEY);
				if (saved) {
					const parsed = JSON.parse(saved);
					if (Array.isArray(parsed) && parsed.length > 0) {
						this.leads = parsed.map((l: ClientLead) => ({
							...l,
							createdAt: l.createdAt || now,
							updatedAt: l.updatedAt || l.createdAt || now
						}));
						this.isLoaded = true;
					}
				}
			} catch (e) {
				console.error('Error loading from localStorage:', e);
			}

			// 2. Fetch from server in background with ETag
			try {
				const etag = localStorage.getItem(ETAG_KEY) || '';
				const response = await fetch('/api/leads', {
					headers: { 'If-None-Match': etag }
				});

				if (response.status === 304) {
					// Server data unchanged — nothing to do
					return;
				}

				if (response.ok) {
					const data = await response.json();
					if (Array.isArray(data) && data.length > 0) {
						this.leads = data.map((l: ClientLead) => ({
							...l,
							createdAt: l.createdAt || now,
							updatedAt: l.updatedAt || l.createdAt || now
						}));
						this.isLoaded = true;
						const newEtag = response.headers.get('ETag') || '';
						try {
							localStorage.setItem(STORAGE_KEY, JSON.stringify(this.leads));
							if (newEtag) localStorage.setItem(ETAG_KEY, newEtag);
						} catch {}
					}
				}
			} catch (e) {
				console.warn('Server API unavailable, using local data.', e);
			}
		}

		// 3. Fallback to INITIAL_LEADS
		if (!this.isLoaded) {
			this.leads = INITIAL_LEADS.map((l: ClientLead) => ({
				...l,
				createdAt: l.createdAt || now,
				updatedAt: l.updatedAt || l.createdAt || now
			}));
			this.isLoaded = true;
		}
	}

	private _saveTimeout: ReturnType<typeof setTimeout> | null = null;

	async saveToStorage() {
		if (typeof window !== 'undefined') {
			// localStorage always immediate
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(this.leads));
			} catch (e) {
				console.error('Error saving to storage', e);
			}

			// Server persist with debounce (500ms)
			if (this._saveTimeout) clearTimeout(this._saveTimeout);
			this._saveTimeout = setTimeout(async () => {
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
			}, 500);
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

		// Business Line filter
		if (this.filters.businessLine && this.filters.businessLine !== 'all') {
			const bLine = this.filters.businessLine;
			result = result.filter(lead => {
				const hasSaaS = !!lead.subscriptions && lead.subscriptions.length > 0;
				const hasFactFlexi = !!lead.subscriptions && lead.subscriptions.some(s =>
					s.productName.toLowerCase().includes('fact flexi') || s.productName.toLowerCase().includes('factflexi')
				);
				const hasProj = !!lead.projects && lead.projects.length > 0;
				const hasContract = !!lead.supportContracts && lead.supportContracts.length > 0;

				if (bLine === 'has_saas') return hasSaaS;
				if (bLine === 'has_factflexi') return hasFactFlexi;
				if (bLine === 'has_project') return hasProj;
				if (bLine === 'has_contract') return hasContract;
				if (bLine === 'prospect_only') return !hasSaaS && !hasProj && !hasContract;
				return true;
			});
		}

		// Sorting
		result.sort((a, b) => {
			let comparison = 0;
			if (this.filters.sortBy === 'updatedAt') {
				const timeA = new Date(a.updatedAt || a.createdAt || a.lastContactDate || 0).getTime();
				const timeB = new Date(b.updatedAt || b.createdAt || b.lastContactDate || 0).getTime();
				comparison = timeA - timeB;
			} else if (this.filters.sortBy === 'createdAt') {
				const timeA = new Date(a.createdAt || a.updatedAt || 0).getTime();
				const timeB = new Date(b.createdAt || b.updatedAt || 0).getTime();
				comparison = timeA - timeB;
			} else if (this.filters.sortBy === 'title') {
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
			} else if (this.filters.sortBy === 'lastContactDate') {
				const timeA = new Date(a.lastContactDate || 0).getTime();
				const timeB = new Date(b.lastContactDate || 0).getTime();
				comparison = timeA - timeB;
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

		// Recurring Revenue & Multi-Business Lines
		let saasMRR = 0;
		let supportMRR = 0;
		let activeSubscriptionsCount = 0;
		let expiringSoonSubscriptionsCount = 0;
		let activeProjectsCount = 0;
		let activeProjectsValue = 0;
		let activeSupportContractsCount = 0;

		const expiringSubscriptionsList: { lead: ClientLead; subscription: SaaSSubscription; daysUntil: number }[] = [];
		const activeProjectsList: { lead: ClientLead; project: ClientProject }[] = [];

		const nowMs = Date.now();
		const thirtyDaysMs = 30 * 86400000;

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

			// SaaS Subscriptions calculations
			if (lead.subscriptions && lead.subscriptions.length > 0) {
				for (const sub of lead.subscriptions) {
					if (sub.status === 'active' || sub.status === 'trial' || sub.status === 'expiring_soon') {
						activeSubscriptionsCount++;
						
						// Calculate monthly equivalent in Kz
						let monthlyVal = sub.priceKz;
						if (sub.billingCycle === 'annual') monthlyVal = sub.priceKz / 12;
						else if (sub.billingCycle === 'semiannual') monthlyVal = sub.priceKz / 6;
						else if (sub.billingCycle === 'quarterly') monthlyVal = sub.priceKz / 3;
						else if (sub.billingCycle === 'lifetime') monthlyVal = 0;

						saasMRR += monthlyVal;

						// Check if expiring in next 30 days or overdue
						if (sub.renewalDate) {
							const renewalTime = new Date(sub.renewalDate).getTime();
							if (!isNaN(renewalTime)) {
								const diffMs = renewalTime - nowMs;
								const daysUntil = Math.round(diffMs / 86400000);
								if (diffMs <= thirtyDaysMs) {
									expiringSoonSubscriptionsCount++;
									expiringSubscriptionsList.push({
										lead,
										subscription: sub,
										daysUntil
									});
								}
							}
						}
					}
				}
			}

			// Projects calculations
			if (lead.projects && lead.projects.length > 0) {
				for (const proj of lead.projects) {
					if (proj.stage !== 'completed') {
						activeProjectsCount++;
						activeProjectsValue += (proj.estimatedValue || 0);
						activeProjectsList.push({
							lead,
							project: proj
						});
					}
				}
			}

			// Support Contracts calculations
			if (lead.supportContracts && lead.supportContracts.length > 0) {
				for (const contract of lead.supportContracts) {
					if (contract.status === 'active') {
						activeSupportContractsCount++;
						let monthlyVal = contract.priceKz;
						if (contract.billingCycle === 'annual') monthlyVal = contract.priceKz / 12;
						else if (contract.billingCycle === 'semiannual') monthlyVal = contract.priceKz / 6;
						else if (contract.billingCycle === 'quarterly') monthlyVal = contract.priceKz / 3;
						else if (contract.billingCycle === 'lifetime') monthlyVal = 0;

						supportMRR += monthlyVal;
					}
				}
			}
		}

		// Sort expiring subscriptions ascending by days until renewal
		expiringSubscriptionsList.sort((a, b) => a.daysUntil - b.daysUntil);

		// Sort active projects descending by value
		activeProjectsList.sort((a, b) => (b.project.estimatedValue || 0) - (a.project.estimatedValue || 0));

		const totalMRR = saasMRR + supportMRR;
		const totalARR = totalMRR * 12;

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
			topCategories,
			totalMRR,
			totalARR,
			saasMRR,
			supportMRR,
			activeSubscriptionsCount,
			expiringSoonSubscriptionsCount,
			activeProjectsCount,
			activeProjectsValue,
			activeSupportContractsCount,
			expiringSubscriptionsList,
			activeProjectsList
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

	availableAssignees = $derived.by(() => {
		const set = new Set<string>();
		for (const lead of this.leads) {
			const a = (lead.assignedTo || '').trim();
			if (a) set.add(a);
		}
		return Array.from(set).sort((x, y) => x.localeCompare(y));
	});

	// Agenda groups based on nextFollowUpDate (won/lost excluded)
	followUpGroups = $derived.by<FollowUpGroups>(() => {
		const groups: FollowUpGroups = { overdue: [], today: [], tomorrow: [], next7: [], unscheduled: [] };
		const today = startOfToday();
		for (const lead of this.leads) {
			if (lead.status === 'won' || lead.status === 'lost') continue;
			const day = toLocalDay(lead.nextFollowUpDate);
			if (!day) {
				if (lead.status === 'contacted' || lead.status === 'meeting' || lead.status === 'proposal') {
					groups.unscheduled.push(lead);
				}
				continue;
			}
			const diff = Math.round((day.getTime() - today.getTime()) / 86400000);
			if (diff < 0) groups.overdue.push(lead);
			else if (diff === 0) groups.today.push(lead);
			else if (diff === 1) groups.tomorrow.push(lead);
			else if (diff <= 7) groups.next7.push(lead);
		}
		const byDate = (a: ClientLead, b: ClientLead) =>
			(toLocalDay(a.nextFollowUpDate)?.getTime() ?? 0) - (toLocalDay(b.nextFollowUpDate)?.getTime() ?? 0);
		groups.overdue.sort(byDate);
		groups.today.sort(byDate);
		groups.tomorrow.sort(byDate);
		groups.next7.sort(byDate);
		groups.unscheduled.sort((a, b) => (a.lastContactDate ?? '').localeCompare(b.lastContactDate ?? ''));
		return groups;
	});

	followUpCounts = $derived.by(() => {
		const g = this.followUpGroups;
		return {
			overdue: g.overdue.length,
			today: g.today.length,
			tomorrow: g.tomorrow.length,
			next7: g.next7.length,
			unscheduled: g.unscheduled.length,
			dueNow: g.overdue.length + g.today.length
		};
	});

	// Active pipeline leads without recent contact
	staleLeads = $derived.by<ClientLead[]>(() => {
		const cutoff = Date.now() - STALE_AFTER_DAYS * 86400000;
		return this.leads
			.filter((l) => {
				if (l.status !== 'contacted' && l.status !== 'meeting' && l.status !== 'proposal') return false;
				if (!l.lastContactDate) return true;
				const t = new Date(l.lastContactDate).getTime();
				return isNaN(t) || t < cutoff;
			})
			.sort((a, b) => (a.lastContactDate ?? '').localeCompare(b.lastContactDate ?? ''));
	});

	// Actions
	selectLead(lead: ClientLead | null) {
		this.selectedLead = lead;
		this.isDrawerOpen = !!lead;
	}

	updateStatus(leadId: string, newStatus: LeadStatus) {
		const leadIndex = this.leads.findIndex(l => l.id === leadId);
		if (leadIndex !== -1) {
			const now = new Date().toISOString();
			this.leads[leadIndex].status = newStatus;
			this.leads[leadIndex].lastContactDate = now;
			this.leads[leadIndex].updatedAt = now;
			if (!this.leads[leadIndex].createdAt) this.leads[leadIndex].createdAt = now;
			
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
				createdAt: now,
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
			const now = new Date().toISOString();
			this.leads[leadIndex].priority = priority;
			this.leads[leadIndex].updatedAt = now;
			if (!this.leads[leadIndex].createdAt) this.leads[leadIndex].createdAt = now;
			if (this.selectedLead?.id === leadId) {
				this.selectedLead = { ...this.leads[leadIndex] };
			}
			this.saveToStorage();
		}
	}

	addNote(leadId: string, content: string, type: Note['type'] = 'general') {
		this.logInteraction(leadId, content, type ?? 'general');
	}

	scheduleFollowUp(leadId: string, dateISO: string | null, noteContent?: string) {
		const leadIndex = this.leads.findIndex(l => l.id === leadId);
		if (leadIndex === -1) return;
		const now = new Date().toISOString();
		this.leads[leadIndex].nextFollowUpDate = dateISO && dateISO.trim() ? dateISO : null;
		this.leads[leadIndex].updatedAt = now;
		if (!this.leads[leadIndex].createdAt) this.leads[leadIndex].createdAt = now;
		if (noteContent && noteContent.trim()) {
			this.leads[leadIndex].notes.unshift({
				id: `note-${Date.now()}`,
				content: noteContent.trim(),
				createdAt: now,
				type: 'general',
				nextFollowUpDate: this.leads[leadIndex].nextFollowUpDate
			});
		}
		if (this.selectedLead?.id === leadId) {
			this.selectedLead = { ...this.leads[leadIndex] };
		}
		this.saveToStorage();
	}

	completeFollowUp(leadId: string) {
		const leadIndex = this.leads.findIndex(l => l.id === leadId);
		if (leadIndex === -1) return;
		const now = new Date().toISOString();
		this.leads[leadIndex].nextFollowUpDate = null;
		this.leads[leadIndex].updatedAt = now;
		if (!this.leads[leadIndex].createdAt) this.leads[leadIndex].createdAt = now;
		if (this.selectedLead?.id === leadId) {
			this.selectedLead = { ...this.leads[leadIndex] };
		}
		this.saveToStorage();
	}

	logInteraction(
		leadId: string,
		content: string,
		channel: NoteType = 'general',
		opts: { outcome?: InteractionOutcome | null; nextFollowUp?: string | null } = {}
	) {
		const leadIndex = this.leads.findIndex(l => l.id === leadId);
		if (leadIndex === -1 || !content.trim()) return;
		const now = new Date().toISOString();
		const note: Note = {
			id: `note-${Date.now()}`,
			content: content.trim(),
			createdAt: now,
			type: channel,
			outcome: opts.outcome ?? null,
			nextFollowUpDate: opts.nextFollowUp ?? null
		};
		this.leads[leadIndex].notes.unshift(note);
		this.leads[leadIndex].lastContactDate = now;
		this.leads[leadIndex].updatedAt = now;
		if (!this.leads[leadIndex].createdAt) this.leads[leadIndex].createdAt = now;
		if (opts.nextFollowUp !== undefined) {
			this.leads[leadIndex].nextFollowUpDate =
				opts.nextFollowUp && opts.nextFollowUp.trim() ? opts.nextFollowUp : null;
		}
		if (this.selectedLead?.id === leadId) {
			this.selectedLead = { ...this.leads[leadIndex] };
		}
		this.saveToStorage();
	}

	updateLead(updated: ClientLead) {
		const leadIndex = this.leads.findIndex(l => l.id === updated.id);
		if (leadIndex !== -1) {
			const now = new Date().toISOString();
			this.leads[leadIndex] = {
				...updated,
				createdAt: updated.createdAt || this.leads[leadIndex].createdAt || now,
				updatedAt: now
			};
			if (this.selectedLead?.id === updated.id) {
				this.selectedLead = { ...this.leads[leadIndex] };
			}
			this.saveToStorage();
		}
	}

	addLead(newLead: Omit<ClientLead, 'id' | 'notes'>) {
		const id = `lead-custom-${Date.now()}`;
		const now = new Date().toISOString();
		const lead: ClientLead = {
			...newLead,
			id,
			createdAt: newLead.createdAt || now,
			updatedAt: now,
			notes: [
				{
					id: `note-${Date.now()}`,
					content: 'Registo criado no CRM Amasoft.',
					createdAt: now,
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

	// Subscrições Multi-SaaS
	addSubscription(leadId: string, sub: Omit<SaaSSubscription, 'id' | 'createdAt'>) {
		const leadIndex = this.leads.findIndex(l => l.id === leadId);
		if (leadIndex === -1) return;
		const now = new Date().toISOString();
		const newSub: SaaSSubscription = {
			...sub,
			id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
			createdAt: now,
			updatedAt: now
		};
		const currentSubs = this.leads[leadIndex].subscriptions || [];
		this.leads[leadIndex].subscriptions = [newSub, ...currentSubs];
		this.leads[leadIndex].updatedAt = now;
		if (!this.leads[leadIndex].createdAt) this.leads[leadIndex].createdAt = now;
		
		// Log note in lead history
		this.leads[leadIndex].notes.unshift({
			id: `note-${Date.now()}`,
			content: `Subscrição adicionada: ${newSub.productName} (${newSub.planName}) - ${newSub.priceKz.toLocaleString('pt-AO')} Kz / ${newSub.billingCycle}.`,
			createdAt: now,
			type: 'general'
		});

		if (this.selectedLead?.id === leadId) {
			this.selectedLead = { ...this.leads[leadIndex] };
		}
		this.saveToStorage();
	}

	updateSubscription(leadId: string, subId: string, updates: Partial<SaaSSubscription>) {
		const leadIndex = this.leads.findIndex(l => l.id === leadId);
		if (leadIndex === -1) return;
		const subs = this.leads[leadIndex].subscriptions || [];
		const subIndex = subs.findIndex(s => s.id === subId);
		if (subIndex === -1) return;

		const now = new Date().toISOString();
		subs[subIndex] = {
			...subs[subIndex],
			...updates,
			updatedAt: now
		};
		this.leads[leadIndex].subscriptions = [...subs];
		this.leads[leadIndex].updatedAt = now;

		if (this.selectedLead?.id === leadId) {
			this.selectedLead = { ...this.leads[leadIndex] };
		}
		this.saveToStorage();
	}

	deleteSubscription(leadId: string, subId: string) {
		const leadIndex = this.leads.findIndex(l => l.id === leadId);
		if (leadIndex === -1) return;
		const subs = this.leads[leadIndex].subscriptions || [];
		this.leads[leadIndex].subscriptions = subs.filter(s => s.id !== subId);
		this.leads[leadIndex].updatedAt = new Date().toISOString();

		if (this.selectedLead?.id === leadId) {
			this.selectedLead = { ...this.leads[leadIndex] };
		}
		this.saveToStorage();
	}

	// Projetos & Desenvolvimento por Medida
	addProject(leadId: string, proj: Omit<ClientProject, 'id' | 'createdAt'>) {
		const leadIndex = this.leads.findIndex(l => l.id === leadId);
		if (leadIndex === -1) return;
		const now = new Date().toISOString();
		const newProj: ClientProject = {
			...proj,
			id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
			createdAt: now,
			updatedAt: now
		};
		const currentProjects = this.leads[leadIndex].projects || [];
		this.leads[leadIndex].projects = [newProj, ...currentProjects];
		this.leads[leadIndex].updatedAt = now;
		if (!this.leads[leadIndex].createdAt) this.leads[leadIndex].createdAt = now;

		// Log note in lead history
		this.leads[leadIndex].notes.unshift({
			id: `note-${Date.now()}`,
			content: `Projeto iniciado: "${newProj.name}" (Fase: ${newProj.stage}) - Progresso ${newProj.progress}%.`,
			createdAt: now,
			type: 'general'
		});

		if (this.selectedLead?.id === leadId) {
			this.selectedLead = { ...this.leads[leadIndex] };
		}
		this.saveToStorage();
	}

	updateProject(leadId: string, projId: string, updates: Partial<ClientProject>) {
		const leadIndex = this.leads.findIndex(l => l.id === leadId);
		if (leadIndex === -1) return;
		const projs = this.leads[leadIndex].projects || [];
		const projIndex = projs.findIndex(p => p.id === projId);
		if (projIndex === -1) return;

		const now = new Date().toISOString();
		projs[projIndex] = {
			...projs[projIndex],
			...updates,
			updatedAt: now
		};
		this.leads[leadIndex].projects = [...projs];
		this.leads[leadIndex].updatedAt = now;

		if (this.selectedLead?.id === leadId) {
			this.selectedLead = { ...this.leads[leadIndex] };
		}
		this.saveToStorage();
	}

	deleteProject(leadId: string, projId: string) {
		const leadIndex = this.leads.findIndex(l => l.id === leadId);
		if (leadIndex === -1) return;
		const projs = this.leads[leadIndex].projects || [];
		this.leads[leadIndex].projects = projs.filter(p => p.id !== projId);
		this.leads[leadIndex].updatedAt = new Date().toISOString();

		if (this.selectedLead?.id === leadId) {
			this.selectedLead = { ...this.leads[leadIndex] };
		}
		this.saveToStorage();
	}

	// Contratos de Assistência Técnica & Assessoria
	addSupportContract(leadId: string, contract: Omit<SupportContract, 'id' | 'createdAt'>) {
		const leadIndex = this.leads.findIndex(l => l.id === leadId);
		if (leadIndex === -1) return;
		const now = new Date().toISOString();
		const newContract: SupportContract = {
			...contract,
			id: `contract-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
			createdAt: now,
			updatedAt: now
		};
		const currentContracts = this.leads[leadIndex].supportContracts || [];
		this.leads[leadIndex].supportContracts = [newContract, ...currentContracts];
		this.leads[leadIndex].updatedAt = now;
		if (!this.leads[leadIndex].createdAt) this.leads[leadIndex].createdAt = now;

		// Log note in lead history
		this.leads[leadIndex].notes.unshift({
			id: `note-${Date.now()}`,
			content: `Contrato de suporte firmado: "${newContract.title}" - ${newContract.priceKz.toLocaleString('pt-AO')} Kz.`,
			createdAt: now,
			type: 'general'
		});

		if (this.selectedLead?.id === leadId) {
			this.selectedLead = { ...this.leads[leadIndex] };
		}
		this.saveToStorage();
	}

	updateSupportContract(leadId: string, contractId: string, updates: Partial<SupportContract>) {
		const leadIndex = this.leads.findIndex(l => l.id === leadId);
		if (leadIndex === -1) return;
		const contracts = this.leads[leadIndex].supportContracts || [];
		const cIndex = contracts.findIndex(c => c.id === contractId);
		if (cIndex === -1) return;

		const now = new Date().toISOString();
		contracts[cIndex] = {
			...contracts[cIndex],
			...updates,
			updatedAt: now
		};
		this.leads[leadIndex].supportContracts = [...contracts];
		this.leads[leadIndex].updatedAt = now;

		if (this.selectedLead?.id === leadId) {
			this.selectedLead = { ...this.leads[leadIndex] };
		}
		this.saveToStorage();
	}

	deleteSupportContract(leadId: string, contractId: string) {
		const leadIndex = this.leads.findIndex(l => l.id === leadId);
		if (leadIndex === -1) return;
		const contracts = this.leads[leadIndex].supportContracts || [];
		this.leads[leadIndex].supportContracts = contracts.filter(c => c.id !== contractId);
		this.leads[leadIndex].updatedAt = new Date().toISOString();

		if (this.selectedLead?.id === leadId) {
			this.selectedLead = { ...this.leads[leadIndex] };
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

	async restoreFromBackup(file: File): Promise<{ success: boolean; message: string }> {
		try {
			const text = await file.text();
			const json = JSON.parse(text);

			if (!json || typeof json !== 'object' || !Array.isArray(json.leads)) {
				return { success: false, message: 'Formato inválido. O ficheiro deve ser uma exportação completa do CRM.' };
			}

			if (json.company) {
				companyStore.updateCompany(json.company);
			}
			if (json.team && Array.isArray(json.team)) {
				companyStore.team = json.team;
				try { localStorage.setItem('amasoft_crm_team_v1', JSON.stringify(json.team)); } catch {}
				fetch('/api/company', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ type: 'team', data: json.team })
				}).catch(() => {});
			}

			this.leads = json.leads;
			await this.saveToStorage();
			this.selectedLead = null;
			this.isDrawerOpen = false;

			return { success: true, message: `${json.leads.length} leads, empresa e equipa restaurados com sucesso.` };
		} catch (e: any) {
			return { success: false, message: `Erro ao ler o ficheiro: ${e.message || 'Sintaxe inválida.'}` };
		}
	}

	// Export full CRM database with notes, pipeline, company & team data
	exportToJSON() {
		const payload = {
			company: companyStore.company,
			team: companyStore.team,
			leads: this.leads
		};
		const jsonStr = JSON.stringify(payload, null, 2);
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

			// Priority always starts cold — user changes manually
			const priority: LeadPriority = 'cold';

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
				nextFollowUpDate: null,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
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
