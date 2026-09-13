export type LeadStatus = 'lead' | 'contacted' | 'meeting' | 'proposal' | 'won' | 'lost';

export type LeadPriority = 'hot' | 'warm' | 'cold';

export interface Note {
	id: string;
	content: string;
	createdAt: string;
	type?: 'call' | 'whatsapp' | 'meeting' | 'general';
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
}

export interface CRMFilterOptions {
	search: string;
	status: LeadStatus | 'all';
	priority: LeadPriority | 'all';
	city: string | 'all';
	category: string | 'all';
	hasWebsite: 'all' | 'yes' | 'no';
	hasPhone: 'all' | 'yes' | 'no';
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
	topCities: { city: string; count: number }[];
	topCategories: { category: string; count: number }[];
}
