import type { ClientLead, CommercialProposal, ProposalItem, ProposalStatus } from '../types/crm';
import { DEFAULT_PROPOSALS } from '../data/defaults';
import { crmStore } from './crm.svelte';
import { companyStore } from './company.svelte';

const STORAGE_KEY = 'amasoft_crm_proposals_v1';

class ProposalsState {
	proposals = $state<CommercialProposal[]>(DEFAULT_PROPOSALS);
	search = $state<string>('');
	statusFilter = $state<ProposalStatus | 'all'>('all');
	isLoaded = $state<boolean>(false);
	isSaving = $state<boolean>(false);

	isEditorModalOpen = $state<boolean>(false);
	isViewModalOpen = $state<boolean>(false);

	editingProposal = $state<CommercialProposal | null>(null);
	viewingProposal = $state<CommercialProposal | null>(null);

	// Context lead for when initiating proposal directly from a lead drawer
	targetLead = $state<ClientLead | null>(null);

	constructor() {
		this.init();
	}

	async init() {
		if (typeof window !== 'undefined') {
			try {
				const res = await fetch('/api/proposals');
				if (res.ok) {
					const data = await res.json();
					if (Array.isArray(data)) {
						this.proposals = data;
						this.isLoaded = true;
						try {
							localStorage.setItem(STORAGE_KEY, JSON.stringify(this.proposals));
						} catch {}
						return;
					}
				}
			} catch (e) {
				console.warn('Failed to load proposals from server, checking localStorage:', e);
			}

			try {
				const saved = localStorage.getItem(STORAGE_KEY);
				if (saved) {
					const parsed = JSON.parse(saved);
					if (Array.isArray(parsed)) {
						this.proposals = parsed;
						this.isLoaded = true;
						return;
					}
				}
			} catch {}
		}

		this.proposals = DEFAULT_PROPOSALS;
		this.isLoaded = true;
	}

	private async save() {
		if (typeof window === 'undefined') return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.proposals));
		} catch {}

		try {
			this.isSaving = true;
			await fetch('/api/proposals', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(this.proposals)
			});
		} catch (e) {
			console.error('Failed to save proposals to server:', e);
		} finally {
			this.isSaving = false;
		}
	}

	filteredProposals = $derived.by(() => {
		let list = [...this.proposals];

		if (this.statusFilter !== 'all') {
			list = list.filter((p) => p.status === this.statusFilter);
		}

		if (this.search.trim()) {
			const q = this.search.toLowerCase().trim();
			list = list.filter(
				(p) =>
					p.code.toLowerCase().includes(q) ||
					p.leadTitle.toLowerCase().includes(q) ||
					(p.leadCity && p.leadCity.toLowerCase().includes(q)) ||
					(p.notes && p.notes.toLowerCase().includes(q))
			);
		}

		return list.sort(
			(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		);
	});

	stats = $derived.by(() => {
		let totalCount = this.proposals.length;
		let totalValue = 0;
		let acceptedValue = 0;
		let pendingValue = 0;
		let draftCount = 0;
		let sentCount = 0;
		let acceptedCount = 0;
		let rejectedCount = 0;

		for (const p of this.proposals) {
			totalValue += p.total || 0;
			if (p.status === 'accepted') {
				acceptedValue += p.total || 0;
				acceptedCount++;
			} else if (p.status === 'sent') {
				pendingValue += p.total || 0;
				sentCount++;
			} else if (p.status === 'draft') {
				draftCount++;
			} else if (p.status === 'rejected') {
				rejectedCount++;
			}
		}

		const conversionRate = totalCount > 0 ? (acceptedCount / totalCount) * 100 : 0;

		return {
			totalCount,
			totalValue,
			acceptedValue,
			pendingValue,
			draftCount,
			sentCount,
			acceptedCount,
			rejectedCount,
			conversionRate
		};
	});

	generateNextCode(): string {
		const year = new Date().getFullYear();
		const count = this.proposals.length + 1;
		const padded = String(count).padStart(3, '0');
		return `PROP-${year}-${padded}`;
	}

	calculateTotals(items: ProposalItem[], taxPercent: number = 0): {
		subtotal: number;
		taxAmount: number;
		total: number;
	} {
		const subtotal = items.reduce((acc, item) => {
			const itemGross = (item.quantity || 1) * (item.unitPrice || 0);
			const discount = itemGross * ((item.discountPercent || 0) / 100);
			const itemTotal = Math.max(0, itemGross - discount);
			return acc + itemTotal;
		}, 0);

		const taxAmount = subtotal * (taxPercent / 100);
		const total = subtotal + taxAmount;

		return { subtotal, taxAmount, total };
	}

	getProposalsByLead(leadId: string): CommercialProposal[] {
		return this.proposals.filter((p) => p.leadId === leadId);
	}

	createProposal(proposalData: Omit<CommercialProposal, 'id' | 'createdAt' | 'updatedAt'>): CommercialProposal {
		const newProp: CommercialProposal = {
			...proposalData,
			id: `prop-${Date.now()}`,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		this.proposals = [newProp, ...this.proposals];
		this.save();

		// Auto update lead in CRM if leadId matches
		if (newProp.leadId) {
			const lead = crmStore.leads.find((l) => l.id === newProp.leadId);
			if (lead) {
				// Update estimated value to match proposal if lead value is 0 or user wishes
				if (lead.estimatedValue === 0 && newProp.total > 0) {
					crmStore.updateLead({ ...lead, estimatedValue: newProp.total });
				}
				// Add a note
				crmStore.addNote(
					lead.id,
					`Proposta Comercial emitida: ${newProp.code} no valor de ${new Intl.NumberFormat('pt-AO', { maximumFractionDigits: 0 }).format(newProp.total)} Kz.`,
					'general'
				);
				// If status is 'lead' or 'contacted', advance to 'proposal'
				if (lead.status === 'lead' || lead.status === 'contacted' || lead.status === 'meeting') {
					crmStore.updateStatus(lead.id, 'proposal');
				}
			}
		}

		return newProp;
	}

	updateProposal(id: string, partial: Partial<CommercialProposal>) {
		this.proposals = this.proposals.map((p) => {
			if (p.id === id) {
				const updated = { ...p, ...partial, updatedAt: new Date().toISOString() };
				// If status changes to 'accepted', also update CRM lead to 'won'
				if (partial.status === 'accepted' && updated.leadId) {
					crmStore.updateStatus(updated.leadId, 'won');
					const lead = crmStore.leads.find((l) => l.id === updated.leadId);
					if (lead) {
						crmStore.updateLead({ ...lead, estimatedValue: updated.total });
					}
				}
				return updated;
			}
			return p;
		});
		this.save();
	}

	updateStatus(id: string, status: ProposalStatus) {
		this.updateProposal(id, { status });
	}

	deleteProposal(id: string) {
		this.proposals = this.proposals.filter((p) => p.id !== id);
		if (this.viewingProposal?.id === id) {
			this.viewingProposal = null;
			this.isViewModalOpen = false;
		}
		this.save();
	}

	openNewProposal(lead?: ClientLead | null) {
		this.targetLead = lead || null;
		this.editingProposal = null;
		this.isEditorModalOpen = true;
	}

	openEditProposal(proposal: CommercialProposal) {
		this.targetLead = null;
		this.editingProposal = proposal;
		this.isEditorModalOpen = true;
	}

	openViewProposal(proposal: CommercialProposal) {
		this.viewingProposal = proposal;
		this.isViewModalOpen = true;
	}

	closeEditor() {
		this.isEditorModalOpen = false;
		this.editingProposal = null;
		this.targetLead = null;
	}

	closeView() {
		this.isViewModalOpen = false;
		this.viewingProposal = null;
	}
}

export const proposalsStore = new ProposalsState();
