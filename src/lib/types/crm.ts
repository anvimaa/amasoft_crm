export type LeadStatus = 'lead' | 'contacted' | 'meeting' | 'proposal' | 'won' | 'lost';

export type LeadPriority = 'hot' | 'warm' | 'cold';

export type InteractionChannel = 'whatsapp' | 'call' | 'visit' | 'email';

export type NoteType = InteractionChannel | 'meeting' | 'general';

export type InteractionOutcome =
	| 'sem-resposta'
	| 'contactado'
	| 'interessado'
	| 'proposta-pedida'
	| 'recusou';

export interface Note {
	id: string;
	content: string;
	createdAt: string;
	type?: NoteType;
	outcome?: InteractionOutcome | null;
	nextFollowUpDate?: string | null;
}

export interface ClientLead {
	id: string;
	title: string;
	categories: string[];
	categoryName: string;
	address: string | null;
	neighborhood: string | null;
	street: string | null;
	city: string | null;
	postalCode: string | null;
	state: string | null;
	countryCode: string | null;
	website: string | null;
	phone: string | null;
	phoneUnformatted: string | null;
	location: {
		lat: number;
		lng: number;
	} | null;
	plusCode: string | null;
	
	// Campos CRM
	status: LeadStatus;
	priority: LeadPriority;
	estimatedValue: number; // Em Kwanzas (AOA)
	tags: string[];
	notes: Note[];
	lastContactDate: string | null;
	nextFollowUpDate: string | null;
	assignedTo?: string;
	decisionMaker?: string;
	decisionMakerRole?: string;
	email?: string;

	// Módulos Multi-Negócio & Serviços
	targetBusinessLines?: BusinessLine[];
	subscriptions?: SaaSSubscription[];
	projects?: ClientProject[];
	supportContracts?: SupportContract[];
}

export type BusinessLine = 'saas' | 'custom_dev' | 'tech_support' | 'consulting';

export type BillingCycle = 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'lifetime';

export type SubscriptionStatus = 'active' | 'trial' | 'expiring_soon' | 'expired' | 'canceled' | 'suspended';

export interface SaaSSubscription {
	id: string;
	productName: string; // Ex: "Fact Flexi", "Amasoft CRM", "ERP Amasoft"
	productId?: string;
	planName: string; // Ex: "Plano Starter", "Plano Profissional", "Empresa (5 utilizadores)"
	billingCycle: BillingCycle;
	priceKz: number; // Valor da subscrição em Kwanzas (AOA)
	status: SubscriptionStatus;
	startDate: string; // YYYY-MM-DD
	renewalDate: string; // YYYY-MM-DD
	instanceUrl?: string; // Ex: "app.factflexi.ao/empresa"
	licenseKey?: string; // Chave de ativação ou licença
	notes?: string;
	createdAt: string;
	updatedAt?: string;
}

export type ProjectType = 'website' | 'mobile_app' | 'custom_system' | 'ecommerce' | 'landing_page' | 'portal' | 'other';

export type ProjectStage = 'briefing' | 'design_ui' | 'development' | 'testing' | 'completed' | 'on_hold';

export interface ClientProject {
	id: string;
	name: string; // Ex: "Website Institucional & Catálogo"
	type: ProjectType;
	stage: ProjectStage;
	progress: number; // 0 - 100 (%)
	estimatedValue: number; // Em Kwanzas (AOA)
	startDate?: string;
	targetDeliveryDate?: string;
	demoUrl?: string;
	repositoryUrl?: string;
	notes?: string;
	createdAt: string;
	updatedAt?: string;
}

export type SupportContractType = 'technical_support' | 'fiscal_consulting' | 'sysadmin_infra' | 'custom_retainer';

export type SupportContractStatus = 'active' | 'paused' | 'expired' | 'canceled';

export interface SupportContract {
	id: string;
	title: string; // Ex: "Assistência Técnica de TI & Redes"
	type: SupportContractType;
	status: SupportContractStatus;
	monthlyHours?: number; // Ex: 20h/mês
	priceKz: number; // Valor da avença em Kwanzas
	billingCycle: BillingCycle;
	startDate: string;
	endDate?: string;
	slaDescription?: string;
	notes?: string;
	createdAt: string;
	updatedAt?: string;
}

export interface SaaSProductPlan {
	id?: string;
	name: string;
	priceMonthlyKz: number;
	priceAnnualKz: number;
	features?: string[];
}

export interface SaaSProductCatalogItem {
	id: string;
	name: string;
	category: string;
	description: string;
	icon?: string;
	defaultPlans: SaaSProductPlan[];
}


export type BusinessFilterLine = 'all' | 'has_saas' | 'has_factflexi' | 'has_project' | 'has_contract' | 'prospect_only';

export interface CRMFilterOptions {
	search: string;
	status: LeadStatus | 'all';
	priority: LeadPriority | 'all';
	city: string | 'all';
	category: string | 'all';
	hasWebsite: 'all' | 'yes' | 'no';
	hasPhone: 'all' | 'yes' | 'no';
	businessLine?: BusinessFilterLine;
	sortBy: 'title' | 'city' | 'status' | 'priority' | 'estimatedValue' | 'lastContactDate';
	sortOrder: 'asc' | 'desc';
}

export interface CRMStats {
	totalLeads: number;
	byStatus: Record<LeadStatus, number>;
	byPriority: Record<LeadPriority, number>;
	totalPipelineValue: number;
	wonPipelineValue: number;
	conversionRate: number;
	missingWebsiteCount: number;
	withPhoneCount: number;
	missingPhoneCount: number;
	topCities: { city: string; count: number }[];
	topCategories: { category: string; count: number }[];
	// Multi-Business Lines & Recurring Revenue Metrics
	totalMRR: number;
	totalARR: number;
	saasMRR: number;
	supportMRR: number;
	activeSubscriptionsCount: number;
	expiringSoonSubscriptionsCount: number;
	activeProjectsCount: number;
	activeProjectsValue: number;
	activeSupportContractsCount: number;
	expiringSubscriptionsList: { lead: ClientLead; subscription: SaaSSubscription; daysUntil: number }[];
	activeProjectsList: { lead: ClientLead; project: ClientProject }[];
}

export interface FollowUpGroups {
	overdue: ClientLead[];
	today: ClientLead[];
	tomorrow: ClientLead[];
	next7: ClientLead[];
	unscheduled: ClientLead[];
}

export interface CompanyProfile {
	id: string;
	name: string;
	nif: string;
	sector: string;
	website: string;
	email: string;
	phone: string;
	address: string;
	city: string;
	logoUrl?: string;
	slogan?: string;
	bankName?: string;
	bankIban?: string;
	bankAccountHolder?: string;
	bankSwift?: string;
}

export interface TeamMember {
	id: string;
	name: string;
	role: string;
	email: string;
	phone: string;
	color: string;
	isActive: boolean;
}

export interface RawClientData {
	title: string;
	categories?: string[];
	categoryName?: string;
	address?: string | null;
	neighborhood?: string | null;
	street?: string | null;
	city?: string | null;
	postalCode?: string | null;
	state?: string | null;
	countryCode?: string | null;
	website?: string | null;
	phone?: string | null;
	phoneUnformatted?: string | null;
	location?: {
		lat: number;
		lng: number;
	} | null;
	plusCode?: string | null;
}

export type TemplateCategory =
	| 'prospecting'
	| 'followup'
	| 'meeting'
	| 'proposal'
	| 'closing'
	| 'reactivation'
	| 'general';

export interface ApproachTemplate {
	id: string;
	title: string;
	description: string;
	category: TemplateCategory;
	content: string;
	isDefault?: boolean;
	createdAt: string;
	updatedAt?: string;
}

export interface ProposalItem {
	id: string;
	description: string;
	quantity: number;
	unitPrice: number;
	discountPercent: number;
	total: number;
}

export type ProposalStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

export interface CommercialProposal {
	id: string;
	code: string;
	leadId: string;
	leadTitle: string;
	leadCategory?: string;
	leadCity?: string;
	leadAddress?: string;
	leadNif?: string;
	leadContact?: string;
	leadPhone?: string;
	leadEmail?: string;
	status: ProposalStatus;
	issueDate: string;
	validUntil: string;
	items: ProposalItem[];
	subtotal: number;
	taxPercent: number;
	taxAmount: number;
	total: number;
	paymentTerms: string;
	deliveryTerms: string;
	bankDetails?: string;
	notes?: string;
	createdAt: string;
	updatedAt: string;
}

