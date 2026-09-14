<script lang="ts">
	import { crmStore } from '../stores/crm.svelte';
	import { companyStore } from '../stores/company.svelte';
	import { templatesStore } from '../stores/templates.svelte';
	import { proposalsStore } from '../stores/proposals.svelte';
	import Icon from './Icon.svelte';
	import StatusBadge from './StatusBadge.svelte';
	import PriorityBadge from './PriorityBadge.svelte';
	import type {
		ClientLead,
		CommercialProposal,
		InteractionOutcome,
		LeadPriority,
		LeadStatus,
		NoteType,
		SaaSSubscription,
		BillingCycle,
		SubscriptionStatus,
		ClientProject,
		ProjectType,
		ProjectStage,
		SupportContract
	} from '../types/crm';
	import { generateWhatsAppLink, WHATSAPP_CATEGORIES } from '../utils/whatsapp';
	import { formatKz } from '../utils/format';
	import { generateProposalPDF } from '../utils/pdf-generator';
	import { DEFAULT_SAAS_CATALOG } from '../data/defaults';

	import { toast } from '../stores/toast.svelte';

	let lead = $derived(crmStore.selectedLead);
	let leadProposals = $derived.by(() => (lead ? proposalsStore.getProposalsByLead(lead.id) : []));
	let leadSubscriptions = $derived.by(() => (lead?.subscriptions || []));
	let leadProjects = $derived.by(() => (lead?.projects || []));
	let leadContracts = $derived.by(() => (lead?.supportContracts || []));
	
	let selectedTemplateId = $state<string>('');
	let customMessage = $state<string>('');
	let newNoteText = $state<string>('');
	let newNoteChannel = $state<NoteType>('general');
	let newNoteOutcome = $state<InteractionOutcome | ''>('');
	let newNoteNextFollowUp = $state<string>('');
	let noteChannelFilter = $state<'all' | NoteType>('all');
	let isConfirmingDelete = $state<boolean>(false);

	let activeTab = $state<'whatsapp' | 'saas' | 'projects' | 'proposals' | 'contracts' | 'notes' | 'details'>('whatsapp');
	let isWideMode = $state<boolean>(false);

	let isSubModalOpen = $state<boolean>(false);
	let editingSubId = $state<string | null>(null);
	let deletingSub = $state<SaaSSubscription | null>(null);

	let isCustomProduct = $state<boolean>(false);
	let isCustomPlan = $state<boolean>(false);

	let formSubProduct = $state<string>('Fact Flexi');
	let formSubPlan = $state<string>('Plano Profissional (Multi-Caixa)');
	let formSubCycle = $state<BillingCycle>('annual');
	let formSubPrice = $state<number>(350000);
	let formSubStatus = $state<SubscriptionStatus>('active');
	let formSubStart = $state<string>(new Date().toISOString().slice(0, 10));
	let formSubRenewal = $state<string>('');
	let formSubUrl = $state<string>('');
	let formSubKey = $state<string>('');
	let formSubNotes = $state<string>('');

	// Projects management state
	let isProjectModalOpen = $state<boolean>(false);
	let editingProjectId = $state<string | null>(null);
	let deletingProject = $state<ClientProject | null>(null);

	let formProjName = $state<string>('');
	let formProjType = $state<ProjectType>('website');
	let formProjStage = $state<ProjectStage>('development');
	let formProjProgress = $state<number>(50);
	let formProjValue = $state<number>(0);
	let formProjStartDate = $state<string>(new Date().toISOString().slice(0, 10));
	let formProjDeliveryDate = $state<string>('');
	let formProjDemoUrl = $state<string>('');
	let formProjRepoUrl = $state<string>('');
	let formProjNotes = $state<string>('');

	// Contact & follow-up drafts (synced from selected lead)
	let decisionMaker = $state<string>('');
	let decisionMakerRole = $state<string>('');
	let email = $state<string>('');
	let assignedTo = $state<string>('');
	let emailError = $state<string>('');
	let followUpDraft = $state<string>('');

	// Editable cadastral fields
	let editPhone = $state<string>('');
	let editAddress = $state<string>('');
	let editCity = $state<string>('');
	let editWebsite = $state<string>('');
	let editNeighborhood = $state<string>('');
	let editStreet = $state<string>('');
	let editPostalCode = $state<string>('');
	let editState = $state<string>('');
	let editCategory = $state<string>('');
	let editEmail = $state<string>('');
	let isEditingCadastral = $state<boolean>(false);

	let pendingWhatsAppOutcome = $state<boolean>(false);
	let messageBeingSent = $state<string>('');
	let templateTitleBeingSent = $state<string>('');

	$effect(() => {
		if (lead) {
			pendingWhatsAppOutcome = false;
			const templates = templatesStore.templates;
			const t = templates.find((x) => x.id === selectedTemplateId) || templates[0];
			if (t) {
				selectedTemplateId = t.id;
				const assigneeName = lead.assignedTo ? companyStore.getMemberByName(lead.assignedTo)?.name : undefined;
				customMessage = templatesStore.renderTemplate(t, { lead, company: companyStore.company, assigneeName });
			}
			isConfirmingDelete = false;
			decisionMaker = lead.decisionMaker || '';
			decisionMakerRole = lead.decisionMakerRole || '';
			email = lead.email || '';
			assignedTo = lead.assignedTo || '';
			emailError = '';
			followUpDraft = lead.nextFollowUpDate ? lead.nextFollowUpDate.slice(0, 10) : '';
			if (!newNoteNextFollowUp) newNoteNextFollowUp = '';
			editPhone = lead.phone || '';
			editAddress = lead.address || '';
			editCity = lead.city || '';
			editWebsite = lead.website || '';
			editNeighborhood = lead.neighborhood || '';
			editStreet = lead.street || '';
			editPostalCode = lead.postalCode || '';
			editState = lead.state || '';
			editCategory = lead.categoryName || 'Geral';
			editEmail = lead.email || '';
			isEditingCadastral = false;
		}
	});

	let filteredNotes = $derived.by(() => {
		if (!lead) return [];
		if (noteChannelFilter === 'all') return lead.notes;
		return lead.notes.filter((n) => (n.type || 'general') === noteChannelFilter);
	});

	let followUpState = $derived.by(() => {
		if (!lead?.nextFollowUpDate) return { label: 'Sem agendamento', overdue: false } as const;
		const day = new Date(lead.nextFollowUpDate);
		if (isNaN(day.getTime())) return { label: lead.nextFollowUpDate, overdue: false } as const;
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const d = new Date(day.getFullYear(), day.getMonth(), day.getDate());
		const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
		const label = d.toLocaleDateString('pt-AO', { dateStyle: 'medium' });
		if (diff < 0) return { label: `Atrasado desde ${label}`, overdue: true } as const;
		if (diff === 0) return { label: `Hoje · ${label}`, overdue: false } as const;
		if (diff === 1) return { label: `Amanhã · ${label}`, overdue: false } as const;
		return { label, overdue: false } as const;
	});

	function handleTemplateChange(templateId: string) {
		selectedTemplateId = templateId;
		if (lead) {
			const t = templatesStore.templates.find((x) => x.id === templateId) || templatesStore.templates[0];
			if (t) {
				const assigneeName = lead.assignedTo ? companyStore.getMemberByName(lead.assignedTo)?.name : undefined;
				customMessage = templatesStore.renderTemplate(t, { lead, company: companyStore.company, assigneeName });
			}
		}
	}

	function sendWhatsApp() {
		if (!lead?.phone) {
			toast.error('Contacto Indisponível', `A empresa "${lead?.title}" não possui número de telefone registado.`);
			return;
		}
		if (!customMessage.trim()) {
			toast.error('Mensagem Vazia', 'Escreva uma mensagem antes de abrir o WhatsApp.');
			return;
		}
		const url = generateWhatsAppLink(lead.phone, customMessage);
		if (url) {
			window.open(url, '_blank');
			messageBeingSent = customMessage;
			const currentTmpl = templatesStore.templates.find((x) => x.id === selectedTemplateId);
			templateTitleBeingSent = currentTmpl ? currentTmpl.title : 'Abordagem Comercial';
			pendingWhatsAppOutcome = true;
			toast.info('WhatsApp Aberto', 'Verifique o WhatsApp e confirme o desfecho da mensagem abaixo.');
		}
	}

	function confirmWhatsAppSent() {
		if (!lead) return;
		const noteText = `Mensagem de abordagem enviada via WhatsApp [${templateTitleBeingSent}]:\n\n${messageBeingSent}`;
		crmStore.logInteraction(lead.id, noteText, 'whatsapp', { outcome: 'contactado' });
		
		// Auto advance to 'contacted' if currently 'lead'
		if (lead.status === 'lead') {
			crmStore.updateStatus(lead.id, 'contacted');
		}

		pendingWhatsAppOutcome = false;
		toast.success('Envio Registado', 'A mensagem foi guardada no histórico com sucesso.');
	}

	function cancelWhatsAppOutcome() {
		pendingWhatsAppOutcome = false;
		toast.info('Envio Cancelado', 'Nenhum registo ou alteração foi guardada no histórico do lead.');
	}

	function markNoWhatsApp() {
		if (!lead) return;
		crmStore.logInteraction(
			lead.id,
			'Tentativa de contacto via WhatsApp sem sucesso (número sem WhatsApp ou inválido).',
			'whatsapp',
			{ outcome: 'sem-resposta' }
		);
		
		const currentTags = lead.tags || [];
		if (!currentTags.includes('Sem WhatsApp')) {
			crmStore.updateLead({
				...lead,
				tags: [...currentTags, 'Sem WhatsApp']
			});
		}

		pendingWhatsAppOutcome = false;
		toast.info('Marcado sem WhatsApp', 'O lead foi sinalizado com a etiqueta "Sem WhatsApp".');
	}

	function handleAddNote() {
		if (lead && newNoteText.trim()) {
			crmStore.logInteraction(lead.id, newNoteText.trim(), newNoteChannel, {
				outcome: newNoteOutcome || null,
				nextFollowUp: newNoteNextFollowUp || null
			});
			newNoteText = '';
			newNoteOutcome = '';
			newNoteNextFollowUp = '';
			toast.success('Atividade registada', 'Interação guardada e acompanhamento atualizado.');
		}
	}

	function handleDownloadLeadProposal(p: CommercialProposal) {
		try {
			generateProposalPDF(p, companyStore.company, true);
			toast.success('PDF Gerado', `Ficheiro "Proposta_${p.code}.pdf" descarregado com sucesso.`);
		} catch (e) {
			console.error('Erro ao gerar PDF:', e);
			toast.error('Erro no PDF', 'Falha ao gerar o ficheiro PDF.');
		}
	}

	function calculateRenewalDate(startDate: string, cycle: BillingCycle): string {
		if (!startDate) return '';
		const d = new Date(startDate);
		if (isNaN(d.getTime())) return '';
		if (cycle === 'monthly') d.setMonth(d.getMonth() + 1);
		else if (cycle === 'quarterly') d.setMonth(d.getMonth() + 3);
		else if (cycle === 'semiannual') d.setMonth(d.getMonth() + 6);
		else if (cycle === 'annual') d.setFullYear(d.getFullYear() + 1);
		else if (cycle === 'lifetime') d.setFullYear(d.getFullYear() + 99);
		return d.toISOString().slice(0, 10);
	}

	let currentCatalogProduct = $derived.by(() => {
		return DEFAULT_SAAS_CATALOG.find((x) => x.name.toLowerCase() === formSubProduct.toLowerCase());
	});

	let availablePlansForCurrentProduct = $derived.by(() => {
		return currentCatalogProduct ? currentCatalogProduct.defaultPlans : [];
	});

	function handleProductSelect(productName: string) {
		if (productName === 'custom') {
			isCustomProduct = true;
			isCustomPlan = true;
			formSubProduct = '';
			formSubPlan = '';
			formSubPrice = 0;
			return;
		}

		isCustomProduct = false;
		formSubProduct = productName;
		const cat = DEFAULT_SAAS_CATALOG.find((x) => x.name === productName);
		if (cat && cat.defaultPlans.length > 0) {
			isCustomPlan = false;
			formSubPlan = cat.defaultPlans[0].name;
			updatePriceFromCatalog(cat, cat.defaultPlans[0].name, formSubCycle);
		}
		formSubRenewal = calculateRenewalDate(formSubStart, formSubCycle);
	}

	function handlePlanSelect(planName: string) {
		if (planName === 'custom') {
			isCustomPlan = true;
			formSubPlan = '';
			return;
		}

		isCustomPlan = false;
		formSubPlan = planName;
		const cat = currentCatalogProduct;
		if (cat) {
			updatePriceFromCatalog(cat, planName, formSubCycle);
		}
	}

	function updatePriceFromCatalog(catItem: any, planName: string, cycle: BillingCycle) {
		const pl = catItem.defaultPlans.find((x: any) => x.name === planName);
		if (pl) {
			if (cycle === 'annual') {
				formSubPrice = pl.priceAnnualKz;
			} else if (cycle === 'monthly') {
				formSubPrice = pl.priceMonthlyKz;
			} else if (cycle === 'quarterly') {
				formSubPrice = pl.priceMonthlyKz * 3;
			} else if (cycle === 'semiannual') {
				formSubPrice = pl.priceMonthlyKz * 6;
			} else if (cycle === 'lifetime') {
				formSubPrice = pl.priceAnnualKz * 2.5;
			}
		}
	}

	function handleCycleChange(newCycle: BillingCycle) {
		formSubCycle = newCycle;
		formSubRenewal = calculateRenewalDate(formSubStart, newCycle);
		if (currentCatalogProduct && !isCustomPlan) {
			updatePriceFromCatalog(currentCatalogProduct, formSubPlan, newCycle);
		}
	}

	function openAddSubscription() {
		editingSubId = null;
		isCustomProduct = false;
		isCustomPlan = false;
		formSubProduct = 'Fact Flexi';
		formSubPlan = 'Plano Profissional (Multi-Caixa)';
		formSubCycle = 'annual';
		formSubPrice = 350000;
		formSubStatus = 'active';
		formSubStart = new Date().toISOString().slice(0, 10);
		formSubRenewal = calculateRenewalDate(formSubStart, 'annual');
		formSubUrl = '';
		formSubKey = `FF-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${new Date().getFullYear()}`;
		formSubNotes = '';
		isSubModalOpen = true;
	}

	function openEditSubscription(sub: SaaSSubscription) {
		editingSubId = sub.id;
		formSubProduct = sub.productName;
		formSubPlan = sub.planName;
		formSubCycle = sub.billingCycle;
		formSubPrice = sub.priceKz;
		formSubStatus = sub.status;
		formSubStart = sub.startDate;
		formSubRenewal = sub.renewalDate;
		formSubUrl = sub.instanceUrl || '';
		formSubKey = sub.licenseKey || '';
		formSubNotes = sub.notes || '';

		const matchingCat = DEFAULT_SAAS_CATALOG.find((x) => x.name.toLowerCase() === sub.productName.toLowerCase());
		isCustomProduct = !matchingCat;
		if (matchingCat) {
			const matchingPlan = matchingCat.defaultPlans.find((x) => x.name.toLowerCase() === sub.planName.toLowerCase());
			isCustomPlan = !matchingPlan;
		} else {
			isCustomPlan = true;
		}

		isSubModalOpen = true;
	}

	function handleSaveSubscription() {
		if (!lead) return;
		if (!formSubProduct.trim() || !formSubPlan.trim()) {
			toast.error('Campos Obrigatórios', 'Indique o nome do software e do plano.');
			return;
		}

		if (editingSubId) {
			crmStore.updateSubscription(lead.id, editingSubId, {
				productName: formSubProduct.trim(),
				planName: formSubPlan.trim(),
				billingCycle: formSubCycle,
				priceKz: Number(formSubPrice) || 0,
				status: formSubStatus,
				startDate: formSubStart,
				renewalDate: formSubRenewal || calculateRenewalDate(formSubStart, formSubCycle),
				instanceUrl: formSubUrl.trim() || undefined,
				licenseKey: formSubKey.trim() || undefined,
				notes: formSubNotes.trim() || undefined
			});
			toast.success('Subscrição Atualizada', `Licença de "${formSubProduct}" atualizada.`);
		} else {
			crmStore.addSubscription(lead.id, {
				productName: formSubProduct.trim(),
				planName: formSubPlan.trim(),
				billingCycle: formSubCycle,
				priceKz: Number(formSubPrice) || 0,
				status: formSubStatus,
				startDate: formSubStart,
				renewalDate: formSubRenewal || calculateRenewalDate(formSubStart, formSubCycle),
				instanceUrl: formSubUrl.trim() || undefined,
				licenseKey: formSubKey.trim() || undefined,
				notes: formSubNotes.trim() || undefined
			});
			toast.success('Subscrição Registada', `Licença de "${formSubProduct}" associada à empresa.`);
		}
		isSubModalOpen = false;
	}

	function confirmDeleteSub() {
		if (!lead || !deletingSub) return;
		crmStore.deleteSubscription(lead.id, deletingSub.id);
		toast.info('Subscrição Removida', `A licença de "${deletingSub.productName}" foi eliminada.`);
		deletingSub = null;
	}

	function sendSubscriptionRenewalNotice(sub: SaaSSubscription) {
		if (!lead) return;
		if (!lead.phone) {
			toast.error('Sem Telefone', 'O cliente não possui telefone registado para envio WhatsApp.');
			return;
		}

		const comp = companyStore.company;
		const cycleLabels: Record<BillingCycle, string> = {
			monthly: 'Mensal',
			quarterly: 'Trimestral',
			semiannual: 'Semestral',
			annual: 'Anual',
			lifetime: 'Vitalício'
		};

		const bankSection = comp.bankIban
			? `\n*Coordenadas Bancárias para Pagamento:*\n• *Banco:* ${comp.bankName || 'BAI'}\n• *IBAN:* ${comp.bankIban}\n• *Titular:* ${comp.bankAccountHolder || comp.name}`
			: '';

		const message = `*Aviso de Renovação de Licença — ${comp.name}*\n\nEstimada equipa da *${lead.title}*,\n\nEsperamos que se encontrem bem.\n\nInformamos que a subscrição do vosso software *${sub.productName}* (*${sub.planName}*) tem renovação agendada para o dia *${sub.renewalDate}*.\n\n*Detalhes da Subscrição:*\n• *Software:* ${sub.productName}\n• *Plano:* ${sub.planName}\n• *Ciclo:* ${cycleLabels[sub.billingCycle]}\n• *Valor de Renovação:* *${formatKz(sub.priceKz)}*${sub.licenseKey ? `\n• *Ref/Chave:* \`${sub.licenseKey}\`` : ''}${bankSection}\n\nApós o envio do comprovativo de pagamento, procederemos à extensão imediata da licença no sistema.\n\nCom os melhores cumprimentos,\n*${comp.name}*\n${comp.phone || ''}`;

		const link = generateWhatsAppLink(lead.phone, message);
		if (link) {
			window.open(link, '_blank');
			toast.success('WhatsApp de Renovação', 'Mensagem de renovação gerada e aberta no WhatsApp.');
		}
	}

	function getSubscriptionDaysInfo(renewalDateStr: string): { days: number; label: string; isUrgent: boolean; isExpired: boolean } {
		if (!renewalDateStr) return { days: 0, label: 'Data indefinida', isUrgent: false, isExpired: false };
		const target = new Date(renewalDateStr);
		if (isNaN(target.getTime())) return { days: 0, label: renewalDateStr, isUrgent: false, isExpired: false };
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const t = new Date(target.getFullYear(), target.getMonth(), target.getDate());
		const diffDays = Math.round((t.getTime() - today.getTime()) / 86400000);

		if (diffDays < 0) {
			return { days: diffDays, label: `Expirou há ${Math.abs(diffDays)} dias`, isUrgent: true, isExpired: true };
		}
		if (diffDays === 0) {
			return { days: 0, label: 'Expira hoje!', isUrgent: true, isExpired: false };
		}
		if (diffDays <= 15) {
			return { days: diffDays, label: `Expira em ${diffDays} dias`, isUrgent: true, isExpired: false };
		}
		if (diffDays <= 30) {
			return { days: diffDays, label: `Expira em ${diffDays} dias`, isUrgent: false, isExpired: false };
		}
		return { days: diffDays, label: `Renovação: ${t.toLocaleDateString('pt-AO')}`, isUrgent: false, isExpired: false };
	}

	const PROJECT_TYPE_LABELS: Record<ProjectType, { label: string; icon: string }> = {
		website: { label: 'Website Institucional', icon: 'globe' },
		mobile_app: { label: 'Aplicação Móvel (App)', icon: 'phone' },
		custom_system: { label: 'Sistema / Software por Medida', icon: 'building' },
		ecommerce: { label: 'Loja Virtual / E-commerce', icon: 'money' },
		landing_page: { label: 'Landing Page Comercial', icon: 'sparkles' },
		portal: { label: 'Portal do Cliente / Web App', icon: 'globe' },
		other: { label: 'Outro Projeto Digital', icon: 'file' }
	};

	const PROJECT_STAGE_CONFIG: Record<ProjectStage, { label: string; defaultProgress: number; bg: string; text: string; border: string }> = {
		briefing: { label: '1. Briefing & Requisitos', defaultProgress: 15, bg: 'bg-zinc-800', text: 'text-zinc-300', border: 'border-zinc-700' },
		design_ui: { label: '2. Design UI & Protótipo', defaultProgress: 35, bg: 'bg-indigo-950/60', text: 'text-indigo-300', border: 'border-indigo-800' },
		development: { label: '3. Desenvolvimento & Código', defaultProgress: 65, bg: 'bg-sky-950/60', text: 'text-sky-300', border: 'border-sky-800' },
		testing: { label: '4. Testes & Homologação', defaultProgress: 85, bg: 'bg-amber-950/60', text: 'text-amber-300', border: 'border-amber-800' },
		completed: { label: '5. Publicado / Concluído', defaultProgress: 100, bg: 'bg-emerald-950/60', text: 'text-emerald-300', border: 'border-emerald-800' },
		on_hold: { label: 'Pausa / Aguarda Cliente', defaultProgress: 50, bg: 'bg-rose-950/60', text: 'text-rose-300', border: 'border-rose-800' }
	};

	const PROJECT_STAGES_LIST: ProjectStage[] = ['briefing', 'design_ui', 'development', 'testing', 'completed'];

	function openAddProject() {
		editingProjectId = null;
		formProjName = lead?.website ? 'Reformulação de Website Institucional' : 'Desenvolvimento de Website Corporativo';
		formProjType = 'website';
		formProjStage = 'briefing';
		formProjProgress = 15;
		formProjValue = 450000;
		formProjStartDate = new Date().toISOString().slice(0, 10);
		
		const deliveryDate = new Date();
		deliveryDate.setDate(deliveryDate.getDate() + 30);
		formProjDeliveryDate = deliveryDate.toISOString().slice(0, 10);
		formProjDemoUrl = '';
		formProjRepoUrl = '';
		formProjNotes = '';
		isProjectModalOpen = true;
	}

	function openEditProject(proj: ClientProject) {
		editingProjectId = proj.id;
		formProjName = proj.name;
		formProjType = proj.type;
		formProjStage = proj.stage;
		formProjProgress = proj.progress;
		formProjValue = proj.estimatedValue;
		formProjStartDate = proj.startDate || '';
		formProjDeliveryDate = proj.targetDeliveryDate || '';
		formProjDemoUrl = proj.demoUrl || '';
		formProjRepoUrl = proj.repositoryUrl || '';
		formProjNotes = proj.notes || '';
		isProjectModalOpen = true;
	}

	function handleProjectStageSelect(newStage: ProjectStage) {
		formProjStage = newStage;
		if (PROJECT_STAGE_CONFIG[newStage]) {
			formProjProgress = PROJECT_STAGE_CONFIG[newStage].defaultProgress;
		}
	}

	function handleQuickAdvanceProjectStage(proj: ClientProject, nextStage: ProjectStage) {
		if (!lead) return;
		const nextProgress = PROJECT_STAGE_CONFIG[nextStage]?.defaultProgress ?? proj.progress;
		crmStore.updateProject(lead.id, proj.id, {
			stage: nextStage,
			progress: nextProgress
		});
		toast.success('Etapa Atualizada', `Projeto "${proj.name}" avançou para "${PROJECT_STAGE_CONFIG[nextStage].label}".`);
	}

	function handleSaveProject() {
		if (!lead) return;
		if (!formProjName.trim()) {
			toast.error('Campo Obrigatório', 'Indique o nome/escopo do projeto.');
			return;
		}

		if (editingProjectId) {
			crmStore.updateProject(lead.id, editingProjectId, {
				name: formProjName.trim(),
				type: formProjType,
				stage: formProjStage,
				progress: Math.min(100, Math.max(0, Number(formProjProgress) || 0)),
				estimatedValue: Number(formProjValue) || 0,
				startDate: formProjStartDate || undefined,
				targetDeliveryDate: formProjDeliveryDate || undefined,
				demoUrl: formProjDemoUrl.trim() || undefined,
				repositoryUrl: formProjRepoUrl.trim() || undefined,
				notes: formProjNotes.trim() || undefined
			});
			toast.success('Projeto Atualizado', `Projeto "${formProjName}" guardado.`);
		} else {
			crmStore.addProject(lead.id, {
				name: formProjName.trim(),
				type: formProjType,
				stage: formProjStage,
				progress: Math.min(100, Math.max(0, Number(formProjProgress) || 0)),
				estimatedValue: Number(formProjValue) || 0,
				startDate: formProjStartDate || undefined,
				targetDeliveryDate: formProjDeliveryDate || undefined,
				demoUrl: formProjDemoUrl.trim() || undefined,
				repositoryUrl: formProjRepoUrl.trim() || undefined,
				notes: formProjNotes.trim() || undefined
			});
			toast.success('Projeto Criado', `Projeto "${formProjName}" adicionado.`);
		}
		isProjectModalOpen = false;
	}

	function confirmDeleteProj() {
		if (!lead || !deletingProject) return;
		crmStore.deleteProject(lead.id, deletingProject.id);
		toast.info('Projeto Removido', `O projeto "${deletingProject.name}" foi eliminado.`);
		deletingProject = null;
	}

	function isValidEmail(v: string): boolean {
		return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
	}

	function handleSaveContact() {
		if (!lead) return;
		if (email.trim() && !isValidEmail(email)) {
			emailError = 'Email inválido. Verifique o formato.';
			return;
		}
		emailError = '';
		crmStore.updateLead({
			...lead,
			decisionMaker: decisionMaker.trim() || undefined,
			decisionMakerRole: decisionMakerRole.trim() || undefined,
			email: email.trim() || undefined,
			assignedTo: assignedTo.trim() || undefined
		});
		toast.success('Contacto atualizado', 'Dados do decisor guardados.');
	}

	function handleSaveFollowUp() {
		if (!lead) return;
		crmStore.scheduleFollowUp(lead.id, followUpDraft || null);
		toast.success('Acompanhamento atualizado', followUpDraft ? `Próximo passo agendado.` : 'Agendamento removido.');
	}

	function handleCompleteFollowUp() {
		if (!lead) return;
		crmStore.completeFollowUp(lead.id);
		followUpDraft = '';
	}

	function handleSaveCadastral() {
		if (!lead) return;
		if (editEmail.trim() && !isValidEmail(editEmail)) {
			toast.error('Email inválido', 'Verifique o formato do email antes de guardar.');
			return;
		}
		const phoneClean = editPhone.trim().replace(/[^0-9+]/g, '');
		const phoneUnformatted = phoneClean.replace(/[^0-9]/g, '') || null;
		const newTags: string[] = [];
		if (!editWebsite.trim()) newTags.push('Sem Website');
		else newTags.push('Com Website');
		if (phoneClean) newTags.push('Telefone Válido');
		if (editCity.trim()) newTags.push(editCity.trim());
		crmStore.updateLead({
			...lead,
			phone: phoneClean || null,
			phoneUnformatted,
			address: editAddress.trim() || null,
			city: editCity.trim() || 'Desconhecida',
			website: editWebsite.trim() || null,
			email: editEmail.trim() || undefined,
			neighborhood: editNeighborhood.trim() || null,
			street: editStreet.trim() || null,
			postalCode: editPostalCode.trim() || null,
			state: editState.trim() || null,
			categoryName: editCategory.trim() || 'Geral',
			categories: editCategory.trim() ? [editCategory.trim()] : lead.categories,
			tags: newTags
		});
		isEditingCadastral = false;
		toast.success('Dados cadastrais atualizados', 'Informação da empresa guardada com sucesso.');
	}

	function formatDate(isoString: string): string {
		try {
			return new Date(isoString).toLocaleString('pt-AO', {
				dateStyle: 'short',
				timeStyle: 'short'
			});
		} catch {
			return isoString;
		}
	}
</script>

{#if crmStore.isDrawerOpen && lead}
	<!-- Backdrop -->
	<button
		type="button"
		class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity w-full h-full border-0 cursor-default"
		onclick={() => crmStore.selectLead(null)}
		aria-label="Fechar painel"
	></button>

	<!-- Slide-over Drawer Panel (65-70% width by default, expandable to 90%) -->
	<aside
		class="fixed inset-y-0 right-0 z-50 flex flex-col bg-zinc-950 border-l border-zinc-800 shadow-2xl transition-all duration-300 ease-in-out overflow-hidden {isWideMode ? 'w-full lg:w-[92vw] xl:w-[88vw]' : 'w-full sm:w-[80vw] md:w-[72vw] lg:w-[68vw] xl:w-[62vw] max-w-7xl'}"
	>
		<!-- Header -->
		<div class="flex items-start justify-between border-b border-zinc-800 p-5 bg-zinc-900/60">
			<div class="space-y-1.5 max-w-2xl">
				<div class="flex items-center gap-2">
					<PriorityBadge priority={lead.priority} size="sm" />
					<StatusBadge status={lead.status} size="sm" />
				</div>
				<h2 class="text-lg font-bold text-zinc-100 leading-tight">{lead.title}</h2>
				<p class="text-xs text-zinc-400">{lead.categoryName} • {lead.city || 'Angola'}</p>
			</div>

			<div class="flex items-center gap-2">
				<button
					type="button"
					onclick={() => proposalsStore.openNewProposal(lead)}
					class="flex items-center gap-1.5 rounded-md bg-zinc-100 hover:bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-950 transition-colors cursor-pointer shadow-sm"
					title="Emitir proposta comercial formal para esta empresa"
				>
					<Icon name="file-text" class="w-3.5 h-3.5" />
					<span>Criar Proposta</span>
				</button>

				<!-- Toggle Width Button -->
				<button
					type="button"
					onclick={() => isWideMode = !isWideMode}
					class="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer border border-zinc-800"
					title={isWideMode ? 'Restaurar largura normal (68%)' : 'Expandir para ecrã panorâmico (90%)'}
				>
					<Icon name={isWideMode ? 'minimize' : 'maximize'} class="w-3.5 h-3.5" />
				</button>

				<button
					type="button"
					onclick={() => crmStore.selectLead(null)}
					class="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
					title="Fechar painel"
				>
					<Icon name="close" class="w-4 h-4" />
				</button>
			</div>
		</div>

		<!-- Quick Modifiers -->
		<div class="grid grid-cols-2 gap-3 px-5 py-3 bg-zinc-900/30 border-b border-zinc-800 text-xs">
			<div>
				<label for="drawer-status" class="block text-[11px] font-medium text-zinc-400 mb-1">Estágio Comercial</label>
				<select
					id="drawer-status"
					value={lead.status}
					onchange={(e) => lead && crmStore.updateStatus(lead.id, (e.target as HTMLSelectElement).value as LeadStatus)}
					class="w-full rounded-md bg-zinc-900 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-zinc-500 focus:outline-none"
				>
					<option value="lead">Novo Lead</option>
					<option value="contacted">Em Contacto</option>
					<option value="meeting">Qualificação / Reunião</option>
					<option value="proposal">Proposta Enviada</option>
					<option value="won">Cliente Fechado</option>
					<option value="lost">Desqualificado</option>
				</select>
			</div>

			<div>
				<label for="drawer-priority" class="block text-[11px] font-medium text-zinc-400 mb-1">Nível de Prioridade</label>
				<select
					id="drawer-priority"
					value={lead.priority}
					onchange={(e) => lead && crmStore.updatePriority(lead.id, (e.target as HTMLSelectElement).value as LeadPriority)}
					class="w-full rounded-md bg-zinc-900 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-zinc-500 focus:outline-none"
				>
					<option value="hot">Alta</option>
					<option value="warm">Média</option>
					<option value="cold">Baixa</option>
				</select>
			</div>
		</div>

		<!-- Next follow-up banner -->
		<div class="flex flex-col sm:flex-row sm:items-center gap-2.5 px-5 py-3 bg-zinc-900/30 border-b border-zinc-800 text-xs">
			<div class="flex items-center gap-2 flex-1 min-w-0">
				<Icon name="calendar" class="w-3.5 h-3.5 {followUpState.overdue ? 'text-rose-400' : 'text-zinc-400'}" />
				<span class="text-[11px] font-medium text-zinc-400">Próximo passo:</span>
				<span class="text-xs font-semibold {followUpState.overdue ? 'text-rose-300' : 'text-zinc-100'} truncate">{followUpState.label}</span>
			</div>
			<div class="flex items-center gap-2">
				<input
					type="date"
					bind:value={followUpDraft}
					aria-label="Data do próximo acompanhamento"
					class="rounded-md bg-zinc-900 border border-zinc-700 px-2 py-1 text-xs text-zinc-200 focus:border-zinc-500 focus:outline-none"
				/>
				<button
					type="button"
					onclick={handleSaveFollowUp}
					class="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-900 hover:bg-white cursor-pointer"
				>
					Agendar
				</button>
				{#if lead.nextFollowUpDate}
					<button
						type="button"
						onclick={handleCompleteFollowUp}
						title="Marcar acompanhamento como concluído"
						class="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800 cursor-pointer"
					>
						Concluir
					</button>
				{/if}
			</div>
		</div>

		<!-- Tabs Bar -->
		<div class="flex border-b border-zinc-800 px-5 bg-zinc-900/20 overflow-x-auto">
			<button
				type="button"
				onclick={() => activeTab = 'whatsapp'}
				class="flex items-center gap-1.5 border-b-2 py-2.5 px-3 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer {activeTab === 'whatsapp' ? 'border-zinc-100 text-zinc-100 font-semibold' : 'border-transparent text-zinc-400 hover:text-zinc-200'}"
			>
				<Icon name="whatsapp" class="w-3.5 h-3.5 text-emerald-400" />
				Abordagem
			</button>
			<button
				type="button"
				onclick={() => activeTab = 'saas'}
				class="flex items-center gap-1.5 border-b-2 py-2.5 px-3 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer {activeTab === 'saas' ? 'border-zinc-100 text-zinc-100 font-semibold' : 'border-transparent text-zinc-400 hover:text-zinc-200'}"
			>
				<Icon name="tag" class="w-3.5 h-3.5 text-sky-400" />
				SaaS & Licenças
				{#if leadSubscriptions.length > 0}
					<span class="rounded-full bg-sky-950 border border-sky-800/80 px-1.5 py-0.2 text-[10px] font-mono text-sky-300 font-bold">
						{leadSubscriptions.length}
					</span>
				{/if}
			</button>
			<button
				type="button"
				onclick={() => activeTab = 'projects'}
				class="flex items-center gap-1.5 border-b-2 py-2.5 px-3 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer {activeTab === 'projects' ? 'border-zinc-100 text-zinc-100 font-semibold' : 'border-transparent text-zinc-400 hover:text-zinc-200'}"
			>
				<Icon name="globe" class="w-3.5 h-3.5 text-indigo-400" />
				Projetos Web/App
				{#if leadProjects.length > 0}
					<span class="rounded-full bg-indigo-950 border border-indigo-800/80 px-1.5 py-0.2 text-[10px] font-mono text-indigo-300 font-bold">
						{leadProjects.length}
					</span>
				{/if}
			</button>
			<button
				type="button"
				onclick={() => activeTab = 'proposals'}
				class="flex items-center gap-1.5 border-b-2 py-2.5 px-3 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer {activeTab === 'proposals' ? 'border-zinc-100 text-zinc-100 font-semibold' : 'border-transparent text-zinc-400 hover:text-zinc-200'}"
			>
				<Icon name="file-text" class="w-3.5 h-3.5 text-zinc-400" />
				Propostas ({leadProposals.length})
			</button>
			<button
				type="button"
				onclick={() => activeTab = 'notes'}
				class="flex items-center gap-1.5 border-b-2 py-2.5 px-3 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer {activeTab === 'notes' ? 'border-zinc-100 text-zinc-100 font-semibold' : 'border-transparent text-zinc-400 hover:text-zinc-200'}"
			>
				<Icon name="edit" class="w-3.5 h-3.5 text-zinc-400" />
				Atividades ({lead.notes.length})
			</button>
			<button
				type="button"
				onclick={() => activeTab = 'details'}
				class="flex items-center gap-1.5 border-b-2 py-2.5 px-3 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer {activeTab === 'details' ? 'border-zinc-100 text-zinc-100 font-semibold' : 'border-transparent text-zinc-400 hover:text-zinc-200'}"
			>
				<Icon name="building" class="w-3.5 h-3.5 text-zinc-400" />
				Dados Cadastrais
			</button>
		</div>

		<!-- Content Area -->
		<div class="flex-1 overflow-y-auto p-5 space-y-5">
			
			<!-- TAB 1: WHATSAPP OUTREACH -->
			{#if activeTab === 'whatsapp'}
				<div class="space-y-4">
					<div class="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3.5 flex items-center justify-between text-xs">
						<div class="flex items-center gap-2 text-zinc-300">
							<Icon name="phone" class="w-3.5 h-3.5 text-zinc-400" />
							<span>Contacto: <strong class="font-mono text-zinc-100">{lead.phone || 'Não disponível'}</strong></span>
						</div>
						{#if !lead.website}
							<span class="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300 border border-zinc-700/60">
								Sem Website Registado
							</span>
						{/if}
					</div>

					<!-- Template Selector with Categories -->
					<div>
						<div class="flex items-center justify-between mb-2">
							<label for="template-picker" class="block text-xs font-medium text-zinc-300">
								Modelos de Comunicação ({templatesStore.templates.length})
							</label>
							<a
								href="/templates"
								class="text-[11px] text-zinc-400 hover:text-white hover:underline"
							>
								Gerir Modelos
							</a>
						</div>
						<div class="space-y-3">
							{#each Object.entries(WHATSAPP_CATEGORIES) as [catKey, catInfo]}
								{@const catTemplates = templatesStore.templates.filter(t => t.category === catKey)}
								{#if catTemplates.length > 0}
									<div>
										<div class="flex items-center gap-2 mb-1.5">
											<span class="w-2 h-2 rounded-full" style="background-color: {catInfo.color}"></span>
											<span class="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">{catInfo.label}</span>
										</div>
										<div class="grid grid-cols-1 gap-1.5">
											{#each catTemplates as template (template.id)}
												<button
													type="button"
													onclick={() => handleTemplateChange(template.id)}
													class="text-left p-2.5 rounded-lg border transition-all cursor-pointer {selectedTemplateId === template.id ? 'border-zinc-500 bg-zinc-900 text-white' : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'}"
												>
													<div class="text-[11px] font-semibold">{template.title}</div>
													<div class="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{template.description}</div>
												</button>
											{/each}
										</div>
									</div>
								{/if}
							{/each}
						</div>
					</div>

					<!-- Editable Message Area -->
					<div>
						<label for="custom-msg" class="block text-xs font-medium text-zinc-300 mb-1.5">Mensagem Pronta para Envio</label>
						<textarea
							id="custom-msg"
							rows="8"
							bind:value={customMessage}
							class="w-full rounded-lg bg-zinc-900 border border-zinc-800 p-3 text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none leading-relaxed font-sans"
						></textarea>
					</div>

					<!-- Send Button -->
					<button
						type="button"
						onclick={sendWhatsApp}
						disabled={!lead.phone}
						class="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
					>
						<Icon name="whatsapp" class="w-4 h-4" />
						{pendingWhatsAppOutcome ? 'Reabrir WhatsApp' : 'Abrir Conversa no WhatsApp'}
					</button>

					{#if pendingWhatsAppOutcome}
						<!-- OUTCOME CONFIRMATION CARD -->
						<div class="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-4 space-y-3.5 shadow-lg shadow-emerald-950/20">
							<div class="flex items-start gap-3">
								<div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 border border-emerald-500/20">
									<Icon name="whatsapp" class="w-5 h-5" />
								</div>
								<div class="space-y-1">
									<div class="flex items-center gap-2">
										<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
										<h4 class="text-xs font-semibold text-emerald-300">Confirmação de Envio no WhatsApp</h4>
									</div>
									<p class="text-[11px] text-zinc-300 leading-relaxed">
										A conversa foi aberta no WhatsApp. Conseguiu enviar a mensagem para <strong class="text-white">{lead.title}</strong>?
									</p>
								</div>
							</div>

							<!-- Action Buttons -->
							<div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
								<button
									type="button"
									onclick={confirmWhatsAppSent}
									class="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors cursor-pointer shadow-sm"
								>
									<Icon name="check" class="w-3.5 h-3.5" />
									<span>Sim, Enviada</span>
								</button>

								<button
									type="button"
									onclick={cancelWhatsAppOutcome}
									class="flex items-center justify-center gap-1.5 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer"
								>
									<Icon name="close" class="w-3.5 h-3.5" />
									<span>Não Enviei</span>
								</button>

								<button
									type="button"
									onclick={markNoWhatsApp}
									class="flex items-center justify-center gap-1.5 rounded-lg bg-amber-950/40 border border-amber-800/50 px-3 py-2 text-xs font-medium text-amber-300 hover:bg-amber-900/50 transition-colors cursor-pointer"
								>
									<Icon name="phone-off" class="w-3.5 h-3.5" />
									<span>Sem WhatsApp</span>
								</button>
							</div>
						</div>
					{/if}
				</div>

			<!-- TAB: SAAS & LICENSES -->
			{:else if activeTab === 'saas'}
				<div class="space-y-4">
					<div class="flex items-center justify-between gap-3">
						<div>
							<span class="text-xs font-semibold text-zinc-200">
								Subscrições & Licenças de Software ({leadSubscriptions.length})
							</span>
							<p class="text-[11px] text-zinc-400 mt-0.5">
								Controlo de licenças Fact Flexi, Amasoft CRM e produtos SaaS por subscrição.
							</p>
						</div>
						<button
							type="button"
							onclick={openAddSubscription}
							class="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-white transition-colors cursor-pointer shadow-sm shrink-0"
						>
							<Icon name="plus" class="w-3.5 h-3.5" />
							<span>Registar Licença</span>
						</button>
					</div>

					{#if leadSubscriptions.length > 0}
						<div class="space-y-3">
							{#each leadSubscriptions as sub (sub.id)}
								{@const daysInfo = getSubscriptionDaysInfo(sub.renewalDate)}
								<div class="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3 hover:border-zinc-700 transition-colors">
									<!-- Top Bar: Product & Plan + Status Badge -->
									<div class="flex items-start justify-between gap-3">
										<div class="space-y-1">
											<div class="flex items-center gap-2">
												<h4 class="text-sm font-bold text-white">{sub.productName}</h4>
												{#if sub.status === 'active'}
													<span class="rounded px-2 py-0.5 text-[10px] font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800/80">
														Ativa
													</span>
												{:else if sub.status === 'expiring_soon'}
													<span class="rounded px-2 py-0.5 text-[10px] font-semibold bg-amber-950/70 text-amber-300 border border-amber-800/80">
														A Expirar
													</span>
												{:else if sub.status === 'expired'}
													<span class="rounded px-2 py-0.5 text-[10px] font-semibold bg-rose-950/70 text-rose-300 border border-rose-800/80">
														Expirada
													</span>
												{:else if sub.status === 'trial'}
													<span class="rounded px-2 py-0.5 text-[10px] font-semibold bg-sky-950/70 text-sky-300 border border-sky-800/80">
														Em Teste (Trial)
													</span>
												{:else}
													<span class="rounded px-2 py-0.5 text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
														Cancelada
													</span>
												{/if}
											</div>
											<p class="text-xs text-zinc-300 font-medium">
												{sub.planName}
											</p>
										</div>

										<div class="text-right font-mono shrink-0">
											<span class="text-sm font-bold text-emerald-400">{formatKz(sub.priceKz)}</span>
											<p class="text-[10px] text-zinc-500 uppercase tracking-wider">/ {sub.billingCycle}</p>
										</div>
									</div>

									<!-- Key Dates & License Info -->
									<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs rounded-lg bg-zinc-950/60 p-2.5 border border-zinc-800/60">
										<div class="space-y-0.5">
											<span class="text-[10px] text-zinc-500">Início da Vigência:</span>
											<p class="font-mono text-zinc-300">{sub.startDate || '—'}</p>
										</div>
										<div class="space-y-0.5">
											<span class="text-[10px] text-zinc-500">Data de Renovação:</span>
											<p class="font-mono {daysInfo.isExpired ? 'text-rose-400 font-bold' : daysInfo.isUrgent ? 'text-amber-400 font-bold' : 'text-zinc-200'}">
												{sub.renewalDate || '—'} 
												<span class="text-[10px] font-sans font-normal opacity-80">({daysInfo.label})</span>
											</p>
										</div>

										{#if sub.licenseKey}
											<div class="col-span-1 sm:col-span-2 space-y-0.5 pt-1 border-t border-zinc-800/40">
												<span class="text-[10px] text-zinc-500">Chave / Referência:</span>
												<code class="block font-mono text-[11px] text-zinc-300 bg-zinc-900 px-2 py-1 rounded border border-zinc-800 select-all">
													{sub.licenseKey}
												</code>
											</div>
										{/if}

										{#if sub.instanceUrl}
											<div class="col-span-1 sm:col-span-2 space-y-0.5">
												<span class="text-[10px] text-zinc-500">Instância / URL de Acesso:</span>
												<a
													href={sub.instanceUrl.startsWith('http') ? sub.instanceUrl : `https://${sub.instanceUrl}`}
													target="_blank"
													rel="noopener noreferrer"
													class="block text-[11px] text-sky-400 hover:underline truncate"
												>
													{sub.instanceUrl}
												</a>
											</div>
										{/if}

										{#if sub.notes}
											<div class="col-span-1 sm:col-span-2 space-y-0.5 text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/40">
												<span>Obs: {sub.notes}</span>
											</div>
										{/if}
									</div>

									<!-- Action Buttons Footer -->
									<div class="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs">
										<button
											type="button"
											onclick={() => sendSubscriptionRenewalNotice(sub)}
											class="flex items-center gap-1.5 rounded border border-emerald-800/60 bg-emerald-950/40 px-2.5 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/60 transition-colors cursor-pointer"
											title="Enviar mensagem de cobrança/renovação de licença via WhatsApp"
										>
											<Icon name="whatsapp" class="w-3.5 h-3.5" />
											<span>Aviso de Renovação</span>
										</button>

										<div class="flex items-center gap-1">
											<button
												type="button"
												onclick={() => openEditSubscription(sub)}
												class="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
												title="Editar licença"
											>
												<Icon name="edit" class="w-3.5 h-3.5" />
											</button>
											<button
												type="button"
												onclick={() => deletingSub = sub}
												class="rounded p-1 text-zinc-400 hover:bg-rose-950/60 hover:text-rose-300 transition-colors cursor-pointer"
												title="Remover licença"
											>
												<Icon name="trash" class="w-3.5 h-3.5" />
											</button>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="rounded-xl border border-dashed border-zinc-800 p-8 text-center space-y-3 bg-zinc-950/40">
							<div class="inline-flex rounded-full bg-zinc-900 p-2.5 text-zinc-500 border border-zinc-800">
								<Icon name="tag" class="w-5 h-5" />
							</div>
							<div class="space-y-1">
								<h4 class="text-xs font-semibold text-zinc-300">Nenhuma subscrição registada</h4>
								<p class="text-[11px] text-zinc-500 max-w-xs mx-auto">
									Associe licenças ativas do Fact Flexi, Amasoft CRM ou outros produtos SaaS a esta empresa.
								</p>
							</div>
							<button
								type="button"
								onclick={openAddSubscription}
								class="rounded-lg bg-zinc-100 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-white cursor-pointer shadow-sm"
							>
								Registar Primeira Licença
							</button>
						</div>
					{/if}
				</div>

			<!-- TAB: PROJECTS & CUSTOM DEV -->
			{:else if activeTab === 'projects'}
				<div class="space-y-4">
					<div class="flex items-center justify-between gap-3">
						<div>
							<span class="text-xs font-semibold text-zinc-200">
								Projetos Web & Desenvolvimento por Medida ({leadProjects.length})
							</span>
							<p class="text-[11px] text-zinc-400 mt-0.5">
								Acompanhamento de fases, prazos e entregas de Websites, Apps e Sistemas.
							</p>
						</div>
						<button
							type="button"
							onclick={openAddProject}
							class="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-white transition-colors cursor-pointer shadow-sm shrink-0"
						>
							<Icon name="plus" class="w-3.5 h-3.5" />
							<span>Novo Projeto</span>
						</button>
					</div>

					{#if leadProjects.length > 0}
						<div class="space-y-3.5">
							{#each leadProjects as proj (proj.id)}
								{@const st = PROJECT_STAGE_CONFIG[proj.stage]}
								{@const typeInfo = PROJECT_TYPE_LABELS[proj.type]}
								<div class="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3.5 hover:border-zinc-700 transition-colors">
									<!-- Top Bar: Title & Status -->
									<div class="flex items-start justify-between gap-3">
										<div class="space-y-1">
											<div class="flex flex-wrap items-center gap-2">
												<h4 class="text-sm font-bold text-white">{proj.name}</h4>
												<span class="rounded px-2 py-0.5 text-[10px] font-semibold {st.bg} {st.text} border {st.border}">
													{st.label}
												</span>
												<span class="rounded bg-zinc-800/80 px-2 py-0.5 text-[10px] text-zinc-400 border border-zinc-700/60">
													{typeInfo?.label || proj.type}
												</span>
											</div>
											{#if proj.notes}
												<p class="text-xs text-zinc-400 line-clamp-1">
													{proj.notes}
												</p>
											{/if}
										</div>

										<div class="text-right font-mono shrink-0">
											<span class="text-sm font-bold text-emerald-400">
												{proj.estimatedValue ? formatKz(proj.estimatedValue) : 'Sob Orçamento'}
											</span>
											<p class="text-[10px] text-zinc-500 font-sans">Valor Contratado</p>
										</div>
									</div>

									<!-- Interactive Stage Progress Tracker -->
									<div class="space-y-2 rounded-lg bg-zinc-950/70 p-3 border border-zinc-800/70">
										<div class="flex items-center justify-between text-xs">
											<span class="text-[11px] font-medium text-zinc-400">Progresso do Desenvolvimento:</span>
											<span class="font-mono font-bold text-zinc-200">{proj.progress}%</span>
										</div>

										<!-- Progress Bar -->
										<div class="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
											<div
												class="h-full transition-all duration-500 rounded-full {proj.stage === 'completed' ? 'bg-emerald-500' : proj.progress >= 70 ? 'bg-sky-500' : 'bg-indigo-500'}"
												style="width: {proj.progress}%;"
											></div>
										</div>

										<!-- Stage Steps Flow -->
										<div class="grid grid-cols-5 gap-1 pt-1.5 text-center">
											{#each PROJECT_STAGES_LIST as stepStage, idx}
												{@const isCurrent = proj.stage === stepStage}
												{@const isPassed = PROJECT_STAGES_LIST.indexOf(proj.stage) >= idx}
												<button
													type="button"
													onclick={() => handleQuickAdvanceProjectStage(proj, stepStage)}
													class="group/step p-1 rounded transition-colors cursor-pointer text-left sm:text-center {isCurrent ? 'bg-zinc-800/90 border border-zinc-700' : 'hover:bg-zinc-900/60'}"
													title="Mudar etapa para {PROJECT_STAGE_CONFIG[stepStage].label}"
												>
													<div class="w-2 h-2 mx-auto rounded-full mb-1 {isCurrent ? 'bg-sky-400 ring-2 ring-sky-400/30' : isPassed ? 'bg-emerald-400' : 'bg-zinc-700'}"></div>
													<span class="block text-[9px] font-medium leading-tight truncate {isCurrent ? 'text-white font-bold' : isPassed ? 'text-zinc-300' : 'text-zinc-500'}">
														{PROJECT_STAGE_CONFIG[stepStage].label.split('. ')[1] || stepStage}
													</span>
												</button>
											{/each}
										</div>
									</div>

									<!-- Dates & Links -->
									<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
										<div class="rounded-lg bg-zinc-950/40 p-2 border border-zinc-800/40 flex items-center justify-between">
											<span class="text-[10px] text-zinc-500">Início do Projeto:</span>
											<span class="font-mono text-zinc-300">{proj.startDate || '—'}</span>
										</div>
										<div class="rounded-lg bg-zinc-950/40 p-2 border border-zinc-800/40 flex items-center justify-between">
											<span class="text-[10px] text-zinc-500">Previsão de Entrega:</span>
											<span class="font-mono font-semibold text-zinc-200">{proj.targetDeliveryDate || 'A definir'}</span>
										</div>

										{#if proj.demoUrl}
											<div class="col-span-1 sm:col-span-2 rounded-lg bg-zinc-950/40 p-2 border border-zinc-800/40 flex items-center justify-between">
												<span class="text-[10px] text-zinc-500">Link de Demonstração / Homologação:</span>
												<a
													href={proj.demoUrl.startsWith('http') ? proj.demoUrl : `https://${proj.demoUrl}`}
													target="_blank"
													rel="noopener noreferrer"
													class="text-[11px] text-sky-400 hover:underline flex items-center gap-1 truncate"
												>
													<span>{proj.demoUrl}</span>
													<Icon name="external" class="w-3 h-3 shrink-0" />
												</a>
											</div>
										{/if}
									</div>

									<!-- Action Buttons Footer -->
									<div class="flex items-center justify-end gap-1.5 pt-2 border-t border-zinc-800/80 text-xs">
										<button
											type="button"
											onclick={() => openEditProject(proj)}
											class="flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer"
											title="Editar informações do projeto"
										>
											<Icon name="edit" class="w-3.5 h-3.5" />
											<span>Editar</span>
										</button>
										<button
											type="button"
											onclick={() => deletingProject = proj}
											class="rounded p-1 text-zinc-400 hover:bg-rose-950/60 hover:text-rose-300 transition-colors cursor-pointer"
											title="Remover projeto"
										>
											<Icon name="trash" class="w-3.5 h-3.5" />
										</button>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="rounded-xl border border-dashed border-zinc-800 p-8 text-center space-y-3 bg-zinc-950/40">
							<div class="inline-flex rounded-full bg-zinc-900 p-2.5 text-zinc-500 border border-zinc-800">
								<Icon name="globe" class="w-5 h-5" />
							</div>
							<div class="space-y-1">
								<h4 class="text-xs font-semibold text-zinc-300">Nenhum projeto em desenvolvimento</h4>
								<p class="text-[11px] text-zinc-500 max-w-xs mx-auto">
									Acompanhe a criação de Websites, Aplicações Móveis e Softwares por medida para este cliente.
								</p>
							</div>
							<button
								type="button"
								onclick={openAddProject}
								class="rounded-lg bg-zinc-100 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-white cursor-pointer shadow-sm"
							>
								Criar Primeiro Projeto
							</button>
						</div>
					{/if}
				</div>

			<!-- TAB: PROPOSALS -->
			{:else if activeTab === 'proposals'}
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<span class="text-xs font-semibold text-zinc-200">
							Propostas Emitidas ({leadProposals.length})
						</span>
						<button
							type="button"
							onclick={() => proposalsStore.openNewProposal(lead)}
							class="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-white transition-colors cursor-pointer shadow-sm"
						>
							<Icon name="plus" class="w-3.5 h-3.5" />
							<span>Nova Proposta</span>
						</button>
					</div>

					{#if leadProposals.length > 0}
						<div class="space-y-2.5">
							{#each leadProposals as proposal (proposal.id)}
								<div class="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3 hover:border-zinc-700 transition-colors">
									<div class="flex items-start justify-between gap-2">
										<div>
											<div class="flex items-center gap-2">
												<span class="font-mono text-xs font-bold text-zinc-100">{proposal.code}</span>
												<span class="rounded bg-zinc-800 px-1.5 py-0.2 text-[10px] uppercase font-semibold text-zinc-300 border border-zinc-700">
													{proposal.status}
												</span>
											</div>
											<p class="text-[11px] text-zinc-400 mt-1">
												Emitida em {proposal.issueDate} • Validade até {proposal.validUntil}
											</p>
										</div>

										<div class="text-right font-mono">
											<span class="text-sm font-bold text-emerald-400">{formatKz(proposal.total)}</span>
											<p class="text-[10px] text-zinc-500">{proposal.items.length} {proposal.items.length === 1 ? 'item' : 'itens'}</p>
										</div>
									</div>

									<div class="flex items-center justify-end gap-1.5 pt-2 border-t border-zinc-800/80 text-xs">
										<button
											type="button"
											onclick={() => proposalsStore.openViewProposal(proposal)}
											class="flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer"
										>
											<Icon name="eye" class="w-3.5 h-3.5" />
											<span>Ver</span>
										</button>
										<button
											type="button"
											onclick={() => handleDownloadLeadProposal(proposal)}
											class="flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-100 hover:bg-zinc-100 hover:text-zinc-950 transition-colors cursor-pointer"
											title="Descarregar PDF"
										>
											<Icon name="download" class="w-3.5 h-3.5" />
											<span>PDF</span>
										</button>
										<button
											type="button"
											onclick={() => proposalsStore.openEditProposal(proposal)}
											class="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
											title="Editar proposta"
										>
											<Icon name="edit" class="w-3.5 h-3.5" />
										</button>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="rounded-xl border border-dashed border-zinc-800 p-8 text-center space-y-3 bg-zinc-950/40">
							<div class="inline-flex rounded-full bg-zinc-900 p-2.5 text-zinc-500 border border-zinc-800">
								<Icon name="file-text" class="w-5 h-5" />
							</div>
							<div class="space-y-1">
								<h4 class="text-xs font-semibold text-zinc-300">Nenhuma proposta emitida</h4>
								<p class="text-[11px] text-zinc-500 max-w-xs mx-auto">
									Crie orçamentos comerciais formais com serviços detalhados em Kwanzas para este cliente.
								</p>
							</div>
							<button
								type="button"
								onclick={() => proposalsStore.openNewProposal(lead)}
								class="rounded-lg bg-zinc-100 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-white cursor-pointer shadow-sm"
							>
								Criar Primeira Proposta
							</button>
						</div>
					{/if}
				</div>

			<!-- TAB 2: NOTES & TIMELINE -->
			{:else if activeTab === 'notes'}
				<div class="space-y-4">
					<!-- Add Note Form -->
					<div class="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3.5 space-y-2.5">
						<span class="text-xs font-medium text-zinc-200">Novo Registo de Atividade</span>
						
						<div class="flex flex-wrap gap-1.5">
							<button
								type="button"
								onclick={() => newNoteChannel = 'general'}
								class="rounded px-2 py-0.5 text-xs font-medium cursor-pointer {newNoteChannel === 'general' ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-800 text-zinc-400'}"
							>
								Geral
							</button>
							<button
								type="button"
								onclick={() => newNoteChannel = 'whatsapp'}
								class="rounded px-2 py-0.5 text-xs font-medium cursor-pointer {newNoteChannel === 'whatsapp' ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-800 text-zinc-400'}"
							>
								WhatsApp
							</button>
							<button
								type="button"
								onclick={() => newNoteChannel = 'call'}
								class="rounded px-2 py-0.5 text-xs font-medium cursor-pointer {newNoteChannel === 'call' ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-800 text-zinc-400'}"
							>
								Chamada
							</button>
							<button
								type="button"
								onclick={() => newNoteChannel = 'visit'}
								class="rounded px-2 py-0.5 text-xs font-medium cursor-pointer {newNoteChannel === 'visit' ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-800 text-zinc-400'}"
							>
								Visita
							</button>
							<button
								type="button"
								onclick={() => newNoteChannel = 'email'}
								class="rounded px-2 py-0.5 text-xs font-medium cursor-pointer {newNoteChannel === 'email' ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-800 text-zinc-400'}"
							>
								Email
							</button>
							<button
								type="button"
								onclick={() => newNoteChannel = 'meeting'}
								class="rounded px-2 py-0.5 text-xs font-medium cursor-pointer {newNoteChannel === 'meeting' ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-800 text-zinc-400'}"
							>
								Reunião
							</button>
						</div>

						<textarea
							rows="3"
							bind:value={newNoteText}
							placeholder="Adicionar nota sobre o contacto ou alinhamento com a empresa..."
							class="w-full rounded-md bg-zinc-950 border border-zinc-800 p-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
						></textarea>

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
							<div>
								<label for="note-outcome" class="block text-[11px] font-medium text-zinc-400 mb-1">Resultado do contacto</label>
								<select
									id="note-outcome"
									bind:value={newNoteOutcome}
									class="w-full rounded-md bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none"
								>
									<option value="">Sem resultado</option>
									<option value="sem-resposta">Sem resposta</option>
									<option value="contactado">Contactado</option>
									<option value="interessado">Interessado</option>
									<option value="proposta-pedida">Proposta pedida</option>
									<option value="recusou">Recusou</option>
								</select>
							</div>
							<div>
								<label for="note-next" class="block text-[11px] font-medium text-zinc-400 mb-1">Próximo acompanhamento</label>
								<input
									id="note-next"
									type="date"
									bind:value={newNoteNextFollowUp}
									class="w-full rounded-md bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none"
								/>
							</div>
						</div>

						<div class="flex justify-end">
							<button
								type="button"
								onclick={handleAddNote}
								disabled={!newNoteText.trim()}
								class="rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-white disabled:opacity-40 cursor-pointer"
							>
								Salvar Registo
							</button>
						</div>
					</div>

					<!-- Timeline -->
					<div class="space-y-2.5 pt-1">
						<div class="flex items-center justify-between">
							<span class="text-xs font-medium text-zinc-400 uppercase tracking-wider">Histórico</span>
							<select
								bind:value={noteChannelFilter}
								aria-label="Filtrar histórico por canal"
								class="rounded-md bg-zinc-950 border border-zinc-800 px-2 py-1 text-[11px] text-zinc-300 focus:border-zinc-600 focus:outline-none"
							>
								<option value="all">Todos os canais</option>
								<option value="whatsapp">WhatsApp</option>
								<option value="call">Chamadas</option>
								<option value="visit">Visitas</option>
								<option value="email">Emails</option>
								<option value="meeting">Reuniões</option>
								<option value="general">Notas gerais</option>
							</select>
						</div>
						
						{#each filteredNotes as note (note.id)}
							<div class="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3 space-y-1">
								<div class="flex items-center justify-between text-[11px]">
									<span class="font-medium text-zinc-300">
										{#if note.type === 'call'}Chamada Telefónica
										{:else if note.type === 'whatsapp'}WhatsApp
										{:else if note.type === 'visit'}Visita Presencial
										{:else if note.type === 'email'}Email
										{:else if note.type === 'meeting'}Reunião / Demonstração
										{:else}Nota Interna{/if}
										{#if note.outcome}
											<span class="ml-1.5 rounded bg-zinc-800 px-1.5 py-0.2 text-[10px] text-zinc-400 border border-zinc-700/60">{note.outcome}</span>
										{/if}
									</span>
									<span class="text-zinc-500 font-mono">{formatDate(note.createdAt)}</span>
								</div>
								<p class="text-xs text-zinc-300 whitespace-pre-line leading-relaxed">{note.content}</p>
							</div>
						{:else}
							<div class="text-center py-6 text-xs text-zinc-500">
								{#if noteChannelFilter === 'all'}
									Nenhum histórico registado.
								{:else}
									Sem registos neste canal.
								{/if}
							</div>
						{/each}
					</div>
				</div>

		<!-- TAB 3: DETAILS -->
		{:else if activeTab === 'details'}
			<div class="space-y-4 text-xs">
				
				<!-- Contact & Decisor -->
				<div class="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 space-y-3">
					<div class="flex items-center justify-between">
						<span class="font-semibold text-zinc-200">Contacto & Decisor</span>
						<span class="text-[10px] text-zinc-500">Campos para equipa comercial</span>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
						<div>
							<label for="det-decision" class="block text-[11px] font-medium text-zinc-500 mb-1">Nome do Decisor</label>
							<input
								id="det-decision"
								type="text"
								bind:value={decisionMaker}
								placeholder="Ex: João Silva, Directora Comercial..."
								class="w-full rounded bg-zinc-950 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
							/>
						</div>

						<div>
							<label for="det-role" class="block text-[11px] font-medium text-zinc-500 mb-1">Cargo / Função</label>
							<input
								id="det-role"
								type="text"
								bind:value={decisionMakerRole}
								placeholder="Ex: CEO, Gerente de TI..."
								class="w-full rounded bg-zinc-950 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
							/>
						</div>

						<div>
							<label for="det-email" class="block text-[11px] font-medium text-zinc-500 mb-1">Email</label>
							<div class="flex gap-1.5">
								<input
									id="det-email"
									type="email"
									bind:value={email}
									placeholder="Ex: nome@empresa.co.ao"
									class="w-full rounded bg-zinc-950 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
								/>
								{#if email.trim()}
									<a
										href="mailto:{email.trim()}"
										class="shrink-0 rounded bg-zinc-800 border border-zinc-700 px-2 py-1.5 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
										title="Abrir cliente de email"
									>
										<Icon name="mail" class="w-3.5 h-3.5" />
									</a>
								{/if}
							</div>
							{#if emailError}
								<p class="mt-1 text-[11px] text-rose-400">{emailError}</p>
							{/if}
						</div>

						<div>
							<label for="det-phone" class="block text-[11px] font-medium text-zinc-500 mb-1">Telefone Principal</label>
							<div class="flex gap-1.5">
								<span class="flex-1 rounded bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 font-mono text-xs text-zinc-200">
									{lead.phone || 'Não informado'}
								</span>
								{#if lead.phone}
									<a
										href="tel:{lead.phone}"
										class="shrink-0 rounded bg-zinc-800 border border-zinc-700 px-2 py-1.5 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
										title="Ligar"
									>
										<Icon name="phone" class="w-3.5 h-3.5" />
									</a>
									<a
										href="https://wa.me/{lead.phoneUnformatted || lead.phone}"
										target="_blank"
										rel="noopener noreferrer"
										class="shrink-0 rounded bg-zinc-800 border border-zinc-700 px-2 py-1.5 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
										title="WhatsApp"
									>
										<Icon name="whatsapp" class="w-3.5 h-3.5 text-emerald-400" />
									</a>
								{/if}
							</div>
						</div>

						<div class="sm:col-span-2">
							<label for="det-assigned" class="block text-[11px] font-medium text-zinc-500 mb-1">Responsável</label>
							<div class="flex gap-1.5">
								<select
									id="det-assigned"
									bind:value={assignedTo}
									class="flex-1 rounded bg-zinc-950 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-zinc-500 focus:outline-none"
								>
									<option value="">Sem responsável</option>
									{#each companyStore.activeMembers as member (member.id)}
										<option value={member.name}>{member.name} — {member.role}</option>
									{/each}
									{#each crmStore.availableAssignees as a (a)}
										{#if !companyStore.getMemberByName(a)}
											<option value={a}>{a}</option>
										{/if}
									{/each}
								</select>
							</div>
						</div>
					</div>

					<div class="flex justify-end pt-1">
						<button
							type="button"
							onclick={handleSaveContact}
							class="rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-white cursor-pointer"
						>
							Guardar Contacto
						</button>
					</div>
				</div>

				<!-- Company Details -->
				<div class="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 space-y-3">
					<div class="flex items-center justify-between">
						<span class="font-semibold text-zinc-200">Dados Cadastrais</span>
						{#if !isEditingCadastral}
							<button
								type="button"
								onclick={() => isEditingCadastral = true}
								class="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
							>
								<Icon name="edit" class="w-3 h-3" />
								Editar
							</button>
						{/if}
					</div>

					{#if isEditingCadastral}
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
							<div>
								<label for="edit-phone" class="block text-[11px] font-medium text-zinc-500 mb-1">Telefone</label>
								<input
									id="edit-phone"
									type="text"
									bind:value={editPhone}
									placeholder="+244 9XX XXX XXX"
									class="w-full rounded bg-zinc-950 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none font-mono"
								/>
							</div>

							<div>
								<label for="edit-city" class="block text-[11px] font-medium text-zinc-500 mb-1">Província / Cidade</label>
								<input
									id="edit-city"
									type="text"
									bind:value={editCity}
									placeholder="Ex: Luanda, Benguela..."
									class="w-full rounded bg-zinc-950 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
								/>
							</div>

							<div class="sm:col-span-2">
								<label for="edit-address" class="block text-[11px] font-medium text-zinc-500 mb-1">Endereço</label>
								<input
									id="edit-address"
									type="text"
									bind:value={editAddress}
									placeholder="Ex: Rua Major Kanhangulo, 234"
									class="w-full rounded bg-zinc-950 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
								/>
							</div>

							<div>
								<label for="edit-neighborhood" class="block text-[11px] font-medium text-zinc-500 mb-1">Bairro</label>
								<input
									id="edit-neighborhood"
									type="text"
									bind:value={editNeighborhood}
									placeholder="Ex: Ingombota"
									class="w-full rounded bg-zinc-950 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
								/>
							</div>

							<div>
								<label for="edit-street" class="block text-[11px] font-medium text-zinc-500 mb-1">Rua</label>
								<input
									id="edit-street"
									type="text"
									bind:value={editStreet}
									placeholder="Ex: Rua 5 de Outubro"
									class="w-full rounded bg-zinc-950 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
								/>
							</div>

							<div>
								<label for="edit-website" class="block text-[11px] font-medium text-zinc-500 mb-1">Website</label>
								<input
									id="edit-website"
									type="text"
									bind:value={editWebsite}
									placeholder="Ex: https://empresa.co.ao"
									class="w-full rounded bg-zinc-950 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
								/>
							</div>

							<div>
								<label for="edit-email-cad" class="block text-[11px] font-medium text-zinc-500 mb-1">Email</label>
								<input
									id="edit-email-cad"
									type="email"
									bind:value={editEmail}
									placeholder="Ex: geral@empresa.co.ao"
									class="w-full rounded bg-zinc-950 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
								/>
							</div>

							<div>
								<label for="edit-postal" class="block text-[11px] font-medium text-zinc-500 mb-1">Código Postal</label>
								<input
									id="edit-postal"
									type="text"
									bind:value={editPostalCode}
									placeholder="Ex: CP 1234"
									class="w-full rounded bg-zinc-950 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
								/>
							</div>

							<div>
								<label for="edit-state" class="block text-[11px] font-medium text-zinc-500 mb-1">Província</label>
								<input
									id="edit-state"
									type="text"
									bind:value={editState}
									placeholder="Ex: Luanda"
									class="w-full rounded bg-zinc-950 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
								/>
							</div>

							<div>
								<label for="edit-category" class="block text-[11px] font-medium text-zinc-500 mb-1">Setor Comercial</label>
								<input
									id="edit-category"
									type="text"
									bind:value={editCategory}
									placeholder="Ex: Telecomunicações"
									class="w-full rounded bg-zinc-950 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
								/>
							</div>
						</div>

						<div class="flex justify-end gap-2 pt-2">
							<button
								type="button"
								onclick={() => { isEditingCadastral = false; if (lead) { editPhone = lead.phone || ''; editAddress = lead.address || ''; editCity = lead.city || ''; editWebsite = lead.website || ''; editNeighborhood = lead.neighborhood || ''; editStreet = lead.street || ''; editPostalCode = lead.postalCode || ''; editState = lead.state || ''; editCategory = lead.categoryName || 'Geral'; editEmail = lead.email || ''; } }}
								class="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 cursor-pointer"
							>
								Cancelar
							</button>
							<button
								type="button"
								onclick={handleSaveCadastral}
								class="rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-white cursor-pointer"
							>
								Guardar Dados
							</button>
						</div>
					{:else}
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
							<div>
								<span class="text-zinc-500 block text-[11px]">Telefone</span>
								<span class="font-mono text-zinc-200 text-xs">{lead.phone || 'Não informado'}</span>
							</div>

							<div>
								<span class="text-zinc-500 block text-[11px]">Província / Cidade</span>
								<span class="text-zinc-200 text-xs">{lead.city || 'Angola'}</span>
							</div>

							<div>
								<span class="text-zinc-500 block text-[11px]">Endereço</span>
								<span class="text-zinc-200 text-xs">{lead.address || 'Não informado'}</span>
							</div>

							<div>
								<span class="text-zinc-500 block text-[11px]">Website</span>
								{#if lead.website}
									<a href={lead.website} target="_blank" rel="noopener noreferrer" class="text-indigo-400 hover:underline text-xs">{lead.website}</a>
								{:else}
									<span class="text-zinc-400 text-xs">Sem Website</span>
								{/if}
							</div>

							<div>
								<span class="text-zinc-500 block text-[11px]">Email</span>
								{#if lead.email}
									<a href="mailto:{lead.email}" class="text-indigo-400 hover:underline text-xs">{lead.email}</a>
								{:else}
									<span class="text-zinc-400 text-xs">Sem Email</span>
								{/if}
							</div>

							{#if lead.neighborhood}
								<div>
									<span class="text-zinc-500 block text-[11px]">Bairro</span>
									<span class="text-zinc-200 text-xs">{lead.neighborhood}</span>
								</div>
							{/if}

							{#if lead.street}
								<div>
									<span class="text-zinc-500 block text-[11px]">Rua</span>
									<span class="text-zinc-200 text-xs">{lead.street}</span>
								</div>
							{/if}

							<div>
								<span class="text-zinc-500 block text-[11px]">Setor Comercial</span>
								<span class="text-zinc-200 text-xs">{lead.categoryName}</span>
							</div>

							<div>
								<span class="text-zinc-500 block text-[11px]">Valor Estimado</span>
								<input
									type="number"
									value={lead.estimatedValue}
									onchange={(e) => {
										if (lead) {
											lead.estimatedValue = Number((e.target as HTMLInputElement).value);
											crmStore.updateLead(lead);
										}
									}}
									class="w-full mt-1 rounded bg-zinc-950 border border-zinc-700 px-2.5 py-1 text-xs text-zinc-100 focus:border-zinc-500 focus:outline-none font-mono"
								/>
							</div>
						</div>
					{/if}
				</div>

				<!-- Delete Action -->
				<div class="pt-3 border-t border-zinc-800 flex justify-between items-center text-xs">
					<span class="text-zinc-500 font-mono">ID: {lead.id}</span>
					
					{#if isConfirmingDelete}
						<div class="flex items-center gap-2">
							<span class="text-[11px] text-zinc-400">Tem a certeza?</span>
							<button
								type="button"
								onclick={() => isConfirmingDelete = false}
								class="text-xs text-zinc-400 hover:text-white px-2 py-0.5 rounded cursor-pointer"
							>
								Cancelar
							</button>
							<button
								type="button"
								onclick={() => {
									if (lead) {
										const title = lead.title;
										crmStore.deleteLead(lead.id);
										toast.success('Registo Removido', `A empresa "${title}" foi removida do CRM.`);
									}
								}}
								class="text-xs bg-rose-600 hover:bg-rose-500 text-white font-semibold px-2.5 py-1 rounded cursor-pointer"
							>
								Sim, Excluir
							</button>
						</div>
					{:else}
						<button
							type="button"
							onclick={() => isConfirmingDelete = true}
							class="text-xs text-rose-400 hover:text-rose-300 cursor-pointer flex items-center gap-1"
						>
							<Icon name="trash" class="w-3 h-3" />
							<span>Remover Registo</span>
						</button>
					{/if}
				</div>

			</div>
			{/if}

		</div>
	</aside>
{/if}

<!-- MODAL: SUBSCRIPTION EDITOR -->
{#if isSubModalOpen}
	<!-- Static Backdrop -->
	<div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm w-full h-full" aria-hidden="true"></div>

	<!-- Modal Dialog -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pointer-events-none">
		<div
			class="pointer-events-auto relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-zinc-800 pb-3">
				<div class="flex items-center gap-2">
					<div class="rounded-lg bg-sky-950/60 p-2 text-sky-400 border border-sky-800/60">
						<Icon name="tag" class="w-4 h-4" />
					</div>
					<div>
						<h3 class="text-sm font-semibold text-white">
							{editingSubId ? 'Editar Subscrição SaaS' : 'Registar Nova Licença SaaS'}
						</h3>
						<p class="text-[11px] text-zinc-400">
							{lead?.title}
						</p>
					</div>
				</div>
				<button
					type="button"
					onclick={() => isSubModalOpen = false}
					class="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
				>
					<Icon name="close" class="w-4 h-4" />
				</button>
			</div>

			<!-- Scrollable Form Body -->
			<div class="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
				<!-- Quick Catalog Selector (only for new) -->
				{#if !editingSubId}
					<div class="space-y-1.5">
						<span class="block text-[11px] font-medium text-zinc-400">Selecionar do Catálogo:</span>
						<div class="grid grid-cols-2 gap-2">
							{#each DEFAULT_SAAS_CATALOG as catItem}
								<button
									type="button"
									onclick={() => handleProductSelect(catItem.name)}
									class="text-left rounded-lg border p-2.5 transition-colors cursor-pointer {formSubProduct === catItem.name ? 'border-sky-500 bg-sky-950/30 text-white' : 'border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-900'}"
								>
									<span class="font-semibold block text-xs">{catItem.name}</span>
									<span class="text-[10px] text-zinc-400 line-clamp-1">{catItem.category}</span>
								</button>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Product & Plan Selectors -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<!-- Product Dropdown -->
					<div class="space-y-1">
						<label for="sub-product-select" class="block text-[11px] font-medium text-zinc-300">Software / Solução SaaS *</label>
						<select
							id="sub-product-select"
							value={isCustomProduct ? 'custom' : formSubProduct}
							onchange={(e) => handleProductSelect((e.target as HTMLSelectElement).value)}
							class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white focus:border-zinc-600 focus:outline-none"
						>
							{#each DEFAULT_SAAS_CATALOG as catItem}
								<option value={catItem.name}>{catItem.name} — {catItem.category}</option>
							{/each}
							<option value="custom">Outro Software (Personalizado)...</option>
						</select>

						{#if isCustomProduct}
							<input
								type="text"
								bind:value={formSubProduct}
								placeholder="Digite o nome do software SaaS..."
								class="w-full mt-1.5 rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
							/>
						{/if}
					</div>

					<!-- Plan Dropdown -->
					<div class="space-y-1">
						<label for="sub-plan-select" class="block text-[11px] font-medium text-zinc-300">Plano / Modalidade *</label>
						{#if !isCustomProduct && availablePlansForCurrentProduct.length > 0}
							<select
								id="sub-plan-select"
								value={isCustomPlan ? 'custom' : formSubPlan}
								onchange={(e) => handlePlanSelect((e.target as HTMLSelectElement).value)}
								class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white focus:border-zinc-600 focus:outline-none"
							>
								{#each availablePlansForCurrentProduct as planItem}
									<option value={planItem.name}>
										{planItem.name} ({formatKz(formSubCycle === 'annual' ? planItem.priceAnnualKz : planItem.priceMonthlyKz)})
									</option>
								{/each}
								<option value="custom">Personalizado / Outro Plano...</option>
							</select>
						{/if}

						{#if isCustomProduct || isCustomPlan}
							<input
								type="text"
								bind:value={formSubPlan}
								placeholder="Digite o nome do plano ou versão..."
								class="w-full mt-1.5 rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
							/>
						{/if}
					</div>
				</div>

				<!-- Cycle & Price -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div class="space-y-1">
						<label for="sub-cycle" class="block text-[11px] font-medium text-zinc-300">Ciclo de Faturação *</label>
						<select
							id="sub-cycle"
							value={formSubCycle}
							onchange={(e) => handleCycleChange((e.target as HTMLSelectElement).value as BillingCycle)}
							class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white focus:border-zinc-600 focus:outline-none"
						>
							<option value="annual">Anual (12 meses — Recomendado)</option>
							<option value="monthly">Mensal (1 mês)</option>
							<option value="semiannual">Semestral (6 meses)</option>
							<option value="quarterly">Trimestral (3 meses)</option>
							<option value="lifetime">Vitalício (Licença Definitiva)</option>
						</select>
					</div>

					<div class="space-y-1">
						<div class="flex items-center justify-between">
							<label for="sub-price" class="block text-[11px] font-medium text-zinc-300">Valor Recorrente (Kz) *</label>
							{#if currentCatalogProduct && !isCustomPlan}
								<span class="text-[10px] text-zinc-400 font-mono">Tabela oficial</span>
							{/if}
						</div>
						<input
							id="sub-price"
							type="number"
							bind:value={formSubPrice}
							class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-emerald-400 font-mono font-bold focus:border-zinc-600 focus:outline-none"
						/>
					</div>
				</div>

				<!-- Status & Start Date -->
				<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
					<div class="space-y-1">
						<label for="sub-status" class="block text-[11px] font-medium text-zinc-300">Estado da Licença</label>
						<select
							id="sub-status"
							bind:value={formSubStatus}
							class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-2 text-xs text-white focus:border-zinc-600 focus:outline-none"
						>
							<option value="active">Ativa</option>
							<option value="trial">Em Teste (Trial)</option>
							<option value="expiring_soon">A Expirar</option>
							<option value="expired">Expirada</option>
							<option value="canceled">Cancelada</option>
						</select>
					</div>

					<div class="space-y-1">
						<label for="sub-start" class="block text-[11px] font-medium text-zinc-300">Data de Início</label>
						<input
							id="sub-start"
							type="date"
							bind:value={formSubStart}
							onchange={() => formSubRenewal = calculateRenewalDate(formSubStart, formSubCycle)}
							class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs text-white focus:border-zinc-600 focus:outline-none"
						/>
					</div>

					<div class="space-y-1">
						<label for="sub-renewal" class="block text-[11px] font-medium text-zinc-300">Próxima Renovação</label>
						<input
							id="sub-renewal"
							type="date"
							bind:value={formSubRenewal}
							class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs text-white focus:border-zinc-600 focus:outline-none"
						/>
					</div>
				</div>

				<!-- License Key & URL -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div class="space-y-1">
						<label for="sub-key" class="block text-[11px] font-medium text-zinc-300">Chave de Licença / Código</label>
						<input
							id="sub-key"
							type="text"
							bind:value={formSubKey}
							placeholder="Ex: FF-9821A-2026"
							class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 font-mono placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
						/>
					</div>

					<div class="space-y-1">
						<label for="sub-url" class="block text-[11px] font-medium text-zinc-300">Instância / URL de Acesso</label>
						<input
							id="sub-url"
							type="text"
							bind:value={formSubUrl}
							placeholder="Ex: app.factflexi.ao/empresa"
							class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
						/>
					</div>
				</div>

				<!-- Notes -->
				<div class="space-y-1">
					<label for="sub-notes" class="block text-[11px] font-medium text-zinc-300">Observações Internas</label>
					<textarea
						id="sub-notes"
						bind:value={formSubNotes}
						rows="2"
						placeholder="Ex: Licença inclui módulo de faturação e gestão de stocks em 2 armazéns..."
						class="w-full rounded-lg bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none resize-none"
					></textarea>
				</div>
			</div>

			<!-- Footer -->
			<div class="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
				<button
					type="button"
					onclick={() => isSubModalOpen = false}
					class="rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 cursor-pointer"
				>
					Cancelar
				</button>
				<button
					type="button"
					onclick={handleSaveSubscription}
					class="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-white cursor-pointer shadow-sm"
				>
					<Icon name="check" class="w-3.5 h-3.5" />
					<span>{editingSubId ? 'Salvar Alterações' : 'Confirmar Subscrição'}</span>
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- MODAL: DELETE SUBSCRIPTION CONFIRMATION -->
{#if deletingSub}
	<!-- Static Backdrop -->
	<div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm w-full h-full" aria-hidden="true"></div>

	<!-- Modal Wrapper -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
		<div
			class="pointer-events-auto relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4"
		>
			<div class="flex items-start gap-3">
				<div class="rounded-xl bg-rose-950/40 p-2.5 text-rose-400 border border-rose-900/40 shrink-0">
					<Icon name="trash" class="w-5 h-5" />
				</div>
				<div class="space-y-1.5 flex-1 min-w-0">
					<h3 class="text-base font-semibold text-white">Eliminar Licença de Software?</h3>
					<p class="text-xs text-zinc-400 leading-relaxed">
						Esta ação removerá o registo da licença <strong class="text-zinc-200">{deletingSub.productName} ({deletingSub.planName})</strong> associada a esta empresa.
					</p>

					<div class="mt-2 rounded-lg bg-zinc-900/70 border border-zinc-800/80 p-2.5 text-xs font-mono space-y-1">
						<div class="flex justify-between text-zinc-300">
							<span>Valor:</span>
							<span class="text-emerald-400 font-bold">{formatKz(deletingSub.priceKz)}</span>
						</div>
						<div class="flex justify-between text-zinc-400 text-[11px]">
							<span>Renovação:</span>
							<span>{deletingSub.renewalDate}</span>
						</div>
					</div>
				</div>
			</div>

			<div class="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
				<button
					type="button"
					onclick={() => deletingSub = null}
					class="rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 cursor-pointer"
				>
					Cancelar
				</button>
				<button
					type="button"
					onclick={confirmDeleteSub}
					class="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 cursor-pointer shadow-sm"
				>
					<Icon name="trash" class="w-3.5 h-3.5" />
					<span>Eliminar Licença</span>
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- MODAL: PROJECT EDITOR -->
{#if isProjectModalOpen}
	<!-- Static Backdrop -->
	<div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm w-full h-full" aria-hidden="true"></div>

	<!-- Modal Dialog -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pointer-events-none">
		<div
			class="pointer-events-auto relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-zinc-800 pb-3">
				<div class="flex items-center gap-2">
					<div class="rounded-lg bg-indigo-950/60 p-2 text-indigo-400 border border-indigo-800/60">
						<Icon name="globe" class="w-4 h-4" />
					</div>
					<div>
						<h3 class="text-sm font-semibold text-white">
							{editingProjectId ? 'Editar Projeto Digital' : 'Novo Projeto por Medida'}
						</h3>
						<p class="text-[11px] text-zinc-400">
							{lead?.title}
						</p>
					</div>
				</div>
				<button
					type="button"
					onclick={() => isProjectModalOpen = false}
					class="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
				>
					<Icon name="close" class="w-4 h-4" />
				</button>
			</div>

			<!-- Scrollable Form Body -->
			<div class="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
				<!-- Project Name -->
				<div class="space-y-1">
					<label for="proj-name" class="block text-[11px] font-medium text-zinc-300">Nome / Escopo do Projeto *</label>
					<input
						id="proj-name"
						type="text"
						bind:value={formProjName}
						placeholder="Ex: Website Institucional com Catálogo de Produtos..."
						class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
					/>
				</div>

				<!-- Type & Estimated Value -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div class="space-y-1">
						<label for="proj-type" class="block text-[11px] font-medium text-zinc-300">Tipo de Projeto</label>
						<select
							id="proj-type"
							bind:value={formProjType}
							class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white focus:border-zinc-600 focus:outline-none"
						>
							<option value="website">Website Institucional</option>
							<option value="mobile_app">Aplicação Móvel (App)</option>
							<option value="custom_system">Sistema / Software por Medida</option>
							<option value="ecommerce">Loja Virtual / E-commerce</option>
							<option value="landing_page">Landing Page Comercial</option>
							<option value="portal">Portal do Cliente / Web App</option>
							<option value="other">Outro Projeto Digital</option>
						</select>
					</div>

					<div class="space-y-1">
						<label for="proj-val" class="block text-[11px] font-medium text-zinc-300">Valor Cotado (Kz)</label>
						<input
							id="proj-val"
							type="number"
							bind:value={formProjValue}
							class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-emerald-400 font-mono font-bold focus:border-zinc-600 focus:outline-none"
						/>
					</div>
				</div>

				<!-- Stage Selector & Progress -->
				<div class="space-y-2 rounded-lg bg-zinc-900/40 p-3 border border-zinc-800">
					<div class="flex items-center justify-between">
						<label for="proj-stage" class="block text-[11px] font-medium text-zinc-300">Etapa do Projeto</label>
						<span class="font-mono text-xs font-bold text-zinc-200">{formProjProgress}% concluído</span>
					</div>

					<select
						id="proj-stage"
						value={formProjStage}
						onchange={(e) => handleProjectStageSelect((e.target as HTMLSelectElement).value as ProjectStage)}
						class="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-white focus:border-zinc-600 focus:outline-none"
					>
						<option value="briefing">1. Briefing & Levantamento de Requisitos</option>
						<option value="design_ui">2. Design UI / UX & Protótipo</option>
						<option value="development">3. Desenvolvimento & Programação</option>
						<option value="testing">4. Testes & Homologação</option>
						<option value="completed">5. Concluído & Publicado</option>
						<option value="on_hold">Em Pausa / Aguarda Feedback</option>
					</select>

					<!-- Progress Slider -->
					<div class="pt-2 space-y-1">
						<input
							type="range"
							min="0"
							max="100"
							step="5"
							bind:value={formProjProgress}
							class="w-full accent-sky-400 cursor-pointer"
						/>
					</div>
				</div>

				<!-- Dates -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div class="space-y-1">
						<label for="proj-start" class="block text-[11px] font-medium text-zinc-300">Data de Início</label>
						<input
							id="proj-start"
							type="date"
							bind:value={formProjStartDate}
							class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs text-white focus:border-zinc-600 focus:outline-none"
						/>
					</div>

					<div class="space-y-1">
						<label for="proj-delivery" class="block text-[11px] font-medium text-zinc-300">Previsão de Entrega</label>
						<input
							id="proj-delivery"
							type="date"
							bind:value={formProjDeliveryDate}
							class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs text-white focus:border-zinc-600 focus:outline-none"
						/>
					</div>
				</div>

				<!-- URLs -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div class="space-y-1">
						<label for="proj-demo" class="block text-[11px] font-medium text-zinc-300">Link de Demonstração / Homologação</label>
						<input
							id="proj-demo"
							type="text"
							bind:value={formProjDemoUrl}
							placeholder="Ex: dev.cliente.co.ao"
							class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
						/>
					</div>

					<div class="space-y-1">
						<label for="proj-repo" class="block text-[11px] font-medium text-zinc-300">Repositório / Código (Opcional)</label>
						<input
							id="proj-repo"
							type="text"
							bind:value={formProjRepoUrl}
							placeholder="Ex: github.com/empresa/repo"
							class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
						/>
					</div>
				</div>

				<!-- Notes -->
				<div class="space-y-1">
					<label for="proj-notes" class="block text-[11px] font-medium text-zinc-300">Especificações / Observações</label>
					<textarea
						id="proj-notes"
						bind:value={formProjNotes}
						rows="2"
						placeholder="Ex: Integração com gateway de pagamentos Multicaixa Express e área de cliente..."
						class="w-full rounded-lg bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none resize-none"
					></textarea>
				</div>
			</div>

			<!-- Footer -->
			<div class="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
				<button
					type="button"
					onclick={() => isProjectModalOpen = false}
					class="rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 cursor-pointer"
				>
					Cancelar
				</button>
				<button
					type="button"
					onclick={handleSaveProject}
					class="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-white cursor-pointer shadow-sm"
				>
					<Icon name="check" class="w-3.5 h-3.5" />
					<span>{editingProjectId ? 'Salvar Alterações' : 'Criar Projeto'}</span>
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- MODAL: DELETE PROJECT CONFIRMATION -->
{#if deletingProject}
	<!-- Static Backdrop -->
	<div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm w-full h-full" aria-hidden="true"></div>

	<!-- Modal Wrapper -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
		<div
			class="pointer-events-auto relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4"
		>
			<div class="flex items-start gap-3">
				<div class="rounded-xl bg-rose-950/40 p-2.5 text-rose-400 border border-rose-900/40 shrink-0">
					<Icon name="trash" class="w-5 h-5" />
				</div>
				<div class="space-y-1.5 flex-1 min-w-0">
					<h3 class="text-base font-semibold text-white">Eliminar Projeto de Desenvolvimento?</h3>
					<p class="text-xs text-zinc-400 leading-relaxed">
						Esta ação removerá o registo do projeto <strong class="text-zinc-200">"{deletingProject.name}"</strong> associado a esta empresa.
					</p>

					<div class="mt-2 rounded-lg bg-zinc-900/70 border border-zinc-800/80 p-2.5 text-xs font-mono space-y-1">
						<div class="flex justify-between text-zinc-300">
							<span>Etapa:</span>
							<span class="text-zinc-100">{PROJECT_STAGE_CONFIG[deletingProject.stage]?.label || deletingProject.stage}</span>
						</div>
						<div class="flex justify-between text-zinc-400 text-[11px]">
							<span>Valor:</span>
							<span class="text-emerald-400">{formatKz(deletingProject.estimatedValue)}</span>
						</div>
					</div>
				</div>
			</div>

			<div class="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
				<button
					type="button"
					onclick={() => deletingProject = null}
					class="rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 cursor-pointer"
				>
					Cancelar
				</button>
				<button
					type="button"
					onclick={confirmDeleteProj}
					class="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 cursor-pointer shadow-sm"
				>
					<Icon name="trash" class="w-3.5 h-3.5" />
					<span>Eliminar Projeto</span>
				</button>
			</div>
		</div>
	</div>
{/if}


