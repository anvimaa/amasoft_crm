import type { ClientLead, SaaSSubscription, SaaSProductCatalogItem, SaaSProductPlan } from '#lib/types/crm.ts';
import { DEFAULT_SAAS_CATALOG } from '#lib/data/defaults.ts';
import { crmStore } from './crm.svelte';
import { toast } from './toast.svelte';

const STORAGE_KEY = 'amasoft_crm_saas_catalog_v1';

export interface IssuedLicenseRecord {
	lead: ClientLead;
	subscription: SaaSSubscription;
	daysUntil: number;
	isOverdue: boolean;
	isExpiringSoon: boolean;
}

class SaaSState {
	catalog = $state<SaaSProductCatalogItem[]>(DEFAULT_SAAS_CATALOG);
	isLoaded = $state<boolean>(false);
	isSaving = $state<boolean>(false);

	// Filter states
	search = $state<string>('');
	activeTab = $state<'catalog' | 'licenses'>('catalog');
	licenseStatusFilter = $state<'all' | 'active' | 'expiring' | 'expired' | 'trial'>('all');
	licenseProductFilter = $state<string>('all');

	// Product modal states
	isProductModalOpen = $state<boolean>(false);
	editingProduct = $state<SaaSProductCatalogItem | null>(null);
	deletingProduct = $state<SaaSProductCatalogItem | null>(null);

	// Plan modal states
	isPlanModalOpen = $state<boolean>(false);
	targetProductIdForPlan = $state<string | null>(null);
	editingPlan = $state<SaaSProductPlan | null>(null);
	editingPlanIndex = $state<number | null>(null);
	deletingPlan = $state<{ productId: string; planIndex: number; planName: string } | null>(null);

	constructor() {
		this.init();
	}

	async init() {
		if (typeof window !== 'undefined') {
			try {
				const res = await fetch('/api/saas');
				if (res.ok) {
					const data = await res.json();
					if (Array.isArray(data) && data.length > 0) {
						this.catalog = data;
						this.isLoaded = true;
						try {
							localStorage.setItem(STORAGE_KEY, JSON.stringify(this.catalog));
						} catch { }
						return;
					}
				}
			} catch (e) {
				console.warn('Failed to load SaaS catalog from server, checking localStorage:', e);
			}

			try {
				const saved = localStorage.getItem(STORAGE_KEY);
				if (saved) {
					const parsed = JSON.parse(saved);
					if (Array.isArray(parsed) && parsed.length > 0) {
						this.catalog = parsed;
						this.isLoaded = true;
						return;
					}
				}
			} catch { }
		}

		this.catalog = DEFAULT_SAAS_CATALOG;
		this.isLoaded = true;
	}

	private async save() {
		if (typeof window === 'undefined') return;
		this.isSaving = true;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.catalog));
			await fetch('/api/saas', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(this.catalog)
			});
		} catch (e) {
			console.error('Error saving SaaS catalog:', e);
		} finally {
			this.isSaving = false;
		}
	}

	// Derived: all issued client licenses in CRM
	allIssuedLicenses = $derived.by<IssuedLicenseRecord[]>(() => {
		const list: IssuedLicenseRecord[] = [];
		const nowMs = Date.now();

		for (const lead of crmStore.leads) {
			if (lead.subscriptions && lead.subscriptions.length > 0) {
				for (const sub of lead.subscriptions) {
					let daysUntil = 999;
					let isOverdue = false;
					let isExpiringSoon = false;

					if (sub.renewalDate) {
						const renewalTime = new Date(sub.renewalDate).getTime();
						if (!isNaN(renewalTime)) {
							const diffMs = renewalTime - nowMs;
							daysUntil = Math.round(diffMs / 86400000);
							isOverdue = daysUntil < 0;
							isExpiringSoon = daysUntil >= 0 && daysUntil <= 30;
						}
					}

					list.push({
						lead,
						subscription: sub,
						daysUntil,
						isOverdue,
						isExpiringSoon
					});
				}
			}
		}

		// Sort by renewal date ascending (overdue and soon first)
		list.sort((a, b) => a.daysUntil - b.daysUntil);
		return list;
	});

	// Filtered licenses
	filteredLicenses = $derived.by<IssuedLicenseRecord[]>(() => {
		let result = this.allIssuedLicenses;

		// Filter by Product
		if (this.licenseProductFilter !== 'all') {
			result = result.filter(r => r.subscription.productName.toLowerCase() === this.licenseProductFilter.toLowerCase());
		}

		// Filter by Status
		if (this.licenseStatusFilter !== 'all') {
			if (this.licenseStatusFilter === 'expiring') {
				result = result.filter(r => r.isExpiringSoon || r.subscription.status === 'expiring_soon');
			} else if (this.licenseStatusFilter === 'expired') {
				result = result.filter(r => r.isOverdue || r.subscription.status === 'expired');
			} else {
				result = result.filter(r => r.subscription.status === this.licenseStatusFilter);
			}
		}

		// Search
		if (this.search.trim()) {
			const q = this.search.toLowerCase();
			result = result.filter(r =>
				r.lead.title.toLowerCase().includes(q) ||
				r.subscription.productName.toLowerCase().includes(q) ||
				r.subscription.planName.toLowerCase().includes(q) ||
				(r.subscription.licenseKey && r.subscription.licenseKey.toLowerCase().includes(q))
			);
		}

		return result;
	});

	// Metrics
	stats = $derived.by(() => {
		let totalSaaSMRR = 0;
		let activeCount = 0;
		let expiringSoonCount = 0;
		let expiredCount = 0;

		for (const rec of this.allIssuedLicenses) {
			const sub = rec.subscription;
			if (sub.status === 'active' || sub.status === 'trial' || sub.status === 'expiring_soon') {
				activeCount++;
				let monthlyVal = sub.priceKz;
				if (sub.billingCycle === 'annual') monthlyVal = sub.priceKz / 12;
				else if (sub.billingCycle === 'semiannual') monthlyVal = sub.priceKz / 6;
				else if (sub.billingCycle === 'quarterly') monthlyVal = sub.priceKz / 3;
				else if (sub.billingCycle === 'lifetime') monthlyVal = 0;

				totalSaaSMRR += monthlyVal;

				if (rec.isExpiringSoon) {
					expiringSoonCount++;
				}
			}

			if (rec.isOverdue || sub.status === 'expired') {
				expiredCount++;
			}
		}

		const totalSaaSARR = totalSaaSMRR * 12;

		return {
			totalProducts: this.catalog.length,
			totalPlans: this.catalog.reduce((acc, p) => acc + (p.defaultPlans?.length || 0), 0),
			totalLicenses: this.allIssuedLicenses.length,
			activeCount,
			expiringSoonCount,
			expiredCount,
			totalSaaSMRR,
			totalSaaSARR
		};
	});

	// Product actions
	openNewProduct() {
		this.editingProduct = null;
		this.isProductModalOpen = true;
	}

	openEditProduct(product: SaaSProductCatalogItem) {
		this.editingProduct = JSON.parse(JSON.stringify(product));
		this.isProductModalOpen = true;
	}

	saveProduct(productData: Omit<SaaSProductCatalogItem, 'id' | 'defaultPlans'> & { id?: string }) {
		if (!productData.name.trim()) {
			toast.error('Campo Obrigatório', 'Indique o nome do software SaaS.');
			return;
		}

		if (this.editingProduct && this.editingProduct.id) {
			const idx = this.catalog.findIndex(p => p.id === this.editingProduct!.id);
			if (idx !== -1) {
				this.catalog[idx] = {
					...this.catalog[idx],
					name: productData.name.trim(),
					category: productData.category.trim() || 'Software Corporativo',
					description: productData.description.trim() || '',
					icon: productData.icon || 'tag'
				};
				toast.success('Produto Atualizado', `Software "${productData.name}" guardado.`);
			}
		} else {
			const newId = `prod-${Date.now()}`;
			const newProduct: SaaSProductCatalogItem = {
				id: newId,
				name: productData.name.trim(),
				category: productData.category.trim() || 'Software Corporativo',
				description: productData.description.trim() || '',
				icon: productData.icon || 'tag',
				defaultPlans: [
					{
						name: 'Plano Padrão',
						priceMonthlyKz: 25000,
						priceAnnualKz: 250000,
						features: ['Acesso ao sistema', 'Suporte standard']
					}
				]
			};
			this.catalog.push(newProduct);
			toast.success('Novo SaaS Criado', `Software "${productData.name}" adicionado ao catálogo.`);
		}

		this.save();
		this.isProductModalOpen = false;
	}

	openDeleteProduct(product: SaaSProductCatalogItem) {
		this.deletingProduct = product;
	}

	confirmDeleteProduct() {
		if (!this.deletingProduct) return;
		const name = this.deletingProduct.name;
		this.catalog = this.catalog.filter(p => p.id !== this.deletingProduct!.id);
		this.save();
		toast.info('Produto Removido', `O software "${name}" foi removido do catálogo.`);
		this.deletingProduct = null;
	}

	// Plan actions
	openNewPlan(productId: string) {
		this.targetProductIdForPlan = productId;
		this.editingPlanIndex = null;
		this.editingPlan = {
			name: '',
			priceMonthlyKz: 20000,
			priceAnnualKz: 200000,
			features: []
		};
		this.isPlanModalOpen = true;
	}

	openEditPlan(productId: string, planIndex: number, plan: SaaSProductPlan) {
		this.targetProductIdForPlan = productId;
		this.editingPlanIndex = planIndex;
		this.editingPlan = JSON.parse(JSON.stringify(plan));
		this.isPlanModalOpen = true;
	}

	savePlan(productId: string, planData: SaaSProductPlan) {
		if (!planData.name.trim()) {
			toast.error('Campo Obrigatório', 'Indique o nome do plano.');
			return;
		}

		const product = this.catalog.find(p => p.id === productId);
		if (!product) return;

		if (!Array.isArray(product.defaultPlans)) {
			product.defaultPlans = [];
		}

		if (this.editingPlanIndex !== null && this.editingPlanIndex >= 0) {
			product.defaultPlans[this.editingPlanIndex] = {
				name: planData.name.trim(),
				priceMonthlyKz: Number(planData.priceMonthlyKz) || 0,
				priceAnnualKz: Number(planData.priceAnnualKz) || 0,
				features: planData.features || []
			};
			toast.success('Plano Atualizado', `Plano "${planData.name}" guardado.`);
		} else {
			product.defaultPlans.push({
				name: planData.name.trim(),
				priceMonthlyKz: Number(planData.priceMonthlyKz) || 0,
				priceAnnualKz: Number(planData.priceAnnualKz) || 0,
				features: planData.features || []
			});
			toast.success('Plano Adicionado', `Plano "${planData.name}" associado ao ${product.name}.`);
		}

		this.save();
		this.isPlanModalOpen = false;
	}

	openDeletePlan(productId: string, planIndex: number, planName: string) {
		this.deletingPlan = { productId, planIndex, planName };
	}

	confirmDeletePlan() {
		if (!this.deletingPlan) return;
		const product = this.catalog.find(p => p.id === this.deletingPlan!.productId);
		if (product && Array.isArray(product.defaultPlans)) {
			product.defaultPlans.splice(this.deletingPlan.planIndex, 1);
			this.save();
			toast.info('Plano Removido', `O plano "${this.deletingPlan.planName}" foi eliminado.`);
		}
		this.deletingPlan = null;
	}
}

export const saasStore = new SaaSState();
