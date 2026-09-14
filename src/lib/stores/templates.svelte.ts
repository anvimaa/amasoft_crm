import type { ApproachTemplate, ClientLead, CompanyProfile, TemplateCategory } from '#lib/types/crm.ts';
import { DEFAULT_TEMPLATES } from '#lib/data/defaults.ts';
import { companyStore } from './company.svelte';

const STORAGE_KEY = 'amasoft_crm_templates_v1';

class TemplatesState {
	templates = $state<ApproachTemplate[]>(DEFAULT_TEMPLATES);
	activeCategory = $state<TemplateCategory | 'all'>('all');
	search = $state<string>('');
	isLoaded = $state<boolean>(false);
	isSaving = $state<boolean>(false);
	isEditorModalOpen = $state<boolean>(false);
	editingTemplate = $state<ApproachTemplate | null>(null);

	constructor() {
		this.init();
	}

	async init() {
		if (typeof window !== 'undefined') {
			try {
				const res = await fetch('/api/templates');
				if (res.ok) {
					const data = await res.json();
					if (Array.isArray(data) && data.length > 0) {
						this.templates = data;
						this.isLoaded = true;
						try {
							localStorage.setItem(STORAGE_KEY, JSON.stringify(this.templates));
						} catch { }
						return;
					}
				}
			} catch (e) {
				console.warn('Failed to load templates from server, checking localStorage:', e);
			}

			try {
				const saved = localStorage.getItem(STORAGE_KEY);
				if (saved) {
					const parsed = JSON.parse(saved);
					if (Array.isArray(parsed) && parsed.length > 0) {
						this.templates = parsed;
						this.isLoaded = true;
						return;
					}
				}
			} catch { }
		}

		this.templates = DEFAULT_TEMPLATES;
		this.isLoaded = true;
	}

	private async save() {
		if (typeof window === 'undefined') return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.templates));
		} catch { }

		try {
			this.isSaving = true;
			await fetch('/api/templates', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(this.templates)
			});
		} catch (e) {
			console.error('Failed to save templates to server:', e);
		} finally {
			this.isSaving = false;
		}
	}

	filteredTemplates = $derived.by(() => {
		let list = [...this.templates];

		if (this.activeCategory !== 'all') {
			list = list.filter((t) => t.category === this.activeCategory);
		}

		if (this.search.trim()) {
			const q = this.search.toLowerCase().trim();
			list = list.filter(
				(t) =>
					t.title.toLowerCase().includes(q) ||
					t.description.toLowerCase().includes(q) ||
					t.content.toLowerCase().includes(q)
			);
		}

		return list;
	});

	countsByCategory = $derived.by(() => {
		const counts: Record<string, number> = {
			all: this.templates.length,
			prospecting: 0,
			followup: 0,
			meeting: 0,
			closing: 0,
			reactivation: 0,
			general: 0
		};
		for (const t of this.templates) {
			if (counts[t.category] !== undefined) {
				counts[t.category]++;
			}
		}
		return counts;
	});

	renderTemplate(
		template: ApproachTemplate,
		context: {
			lead?: Partial<ClientLead> | null;
			company?: Partial<CompanyProfile> | null;
			assigneeName?: string;
		}
	): string {
		const comp = context.company || companyStore.company;
		const lead = context.lead || {};

		let rendered = template.content;

		// Replacements
		const vars: Record<string, string> = {
			'{empresa}': lead.title || 'Vossa Empresa',
			'{setor}': lead.categoryName || 'prestação de serviços',
			'{cidade}': lead.city || 'Angola',
			'{decisor}': lead.decisionMaker || 'Estimada Direção',
			'{minha_empresa}': comp.name || 'Amasoft Technologies',
			'{slogan}': comp.slogan || 'Soluções Tecnológicas',
			'{meu_nome}': context.assigneeName || comp.name || 'Amasoft Commercial Team',
			'{website}': comp.website || '',
			'{telefone}': comp.phone || '',
			'{email}': comp.email || ''
		};

		for (const [key, val] of Object.entries(vars)) {
			rendered = rendered.replaceAll(key, val);
		}

		return rendered;
	}

	addTemplate(template: Omit<ApproachTemplate, 'id' | 'createdAt'>) {
		const newTmpl: ApproachTemplate = {
			...template,
			id: `tmpl-${Date.now()}`,
			createdAt: new Date().toISOString()
		};
		this.templates = [newTmpl, ...this.templates];
		this.save();
		return newTmpl;
	}

	updateTemplate(id: string, partial: Partial<ApproachTemplate>) {
		this.templates = this.templates.map((t) =>
			t.id === id ? { ...t, ...partial, updatedAt: new Date().toISOString() } : t
		);
		this.save();
	}

	deleteTemplate(id: string) {
		this.templates = this.templates.filter((t) => t.id !== id);
		this.save();
	}

	async resetToDefaults() {
		this.templates = DEFAULT_TEMPLATES;
		await this.save();
	}

	openNewModal(category?: TemplateCategory) {
		this.editingTemplate = null;
		this.isEditorModalOpen = true;
	}

	openEditModal(template: ApproachTemplate) {
		this.editingTemplate = template;
		this.isEditorModalOpen = true;
	}

	closeModal() {
		this.isEditorModalOpen = false;
		this.editingTemplate = null;
	}
}

export const templatesStore = new TemplatesState();
