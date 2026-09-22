import fs from 'node:fs';
import path from 'node:path';
import type { ClientLead, CompanyProfile, TeamMember, SaaSProductCatalogItem } from '../types/crm';
import { INITIAL_LEADS } from '../data/initial-leads';
import { DEFAULT_COMPANY, DEFAULT_TEAM, DEFAULT_SAAS_CATALOG } from '../data/defaults';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'crm-database.json');
const COMPANY_FILE = path.join(DB_DIR, 'company-profile.json');
const TEAM_FILE = path.join(DB_DIR, 'team-members.json');
const SAAS_CATALOG_FILE = path.join(DB_DIR, 'saas-catalog.json');

// In-memory cache — avoids fs.readFileSync on every request
let _leadsCache: ClientLead[] | null = null;

// Ensure data directory exists
function ensureDbExists(): void {
	if (!fs.existsSync(DB_DIR)) {
		fs.mkdirSync(DB_DIR, { recursive: true });
	}

	if (!fs.existsSync(DB_FILE)) {
		fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_LEADS, null, 2), 'utf-8');
	}
}

export function getLeads(): ClientLead[] {
	if (_leadsCache) return _leadsCache;
	ensureDbExists();
	try {
		const raw = fs.readFileSync(DB_FILE, 'utf-8');
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed) && parsed.length > 0) {
			const now = new Date().toISOString();
			const normalized: ClientLead[] = parsed.map((lead: ClientLead) => ({
				...lead,
				createdAt: lead.createdAt || now,
				updatedAt: lead.updatedAt || lead.createdAt || now
			}));
			_leadsCache = normalized;
			return normalized;
		}
	} catch (e) {
		console.error('Error reading crm-database.json:', e);
	}
	_leadsCache = INITIAL_LEADS;
	return INITIAL_LEADS;
}

export function saveLeads(leads: ClientLead[]): boolean {
	ensureDbExists();
	try {
		const now = new Date().toISOString();
		const normalized = leads.map(lead => ({
			...lead,
			createdAt: lead.createdAt || now,
			updatedAt: lead.updatedAt || now
		}));
		_leadsCache = normalized;
		fs.writeFileSync(DB_FILE, JSON.stringify(normalized, null, 2), 'utf-8');
		return true;
	} catch (e) {
		console.error('Error saving crm-database.json:', e);
		return false;
	}
}

export function resetLeads(): ClientLead[] {
	ensureDbExists();
	_leadsCache = INITIAL_LEADS;
	fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_LEADS, null, 2), 'utf-8');
	return INITIAL_LEADS;
}

export function exportOriginalFormat(leads: ClientLead[]) {
	return leads.map(lead => ({
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
}

export function getCompany(): CompanyProfile {
	ensureDbExists();
	try {
		if (fs.existsSync(COMPANY_FILE)) {
			const raw = fs.readFileSync(COMPANY_FILE, 'utf-8');
			const parsed = JSON.parse(raw);
			if (parsed && typeof parsed.name === 'string') {
				return { ...DEFAULT_COMPANY, ...parsed };
			}
		}
	} catch (e) {
		console.error('Error reading company-profile.json:', e);
	}
	return DEFAULT_COMPANY;
}

export function saveCompany(profile: CompanyProfile): boolean {
	ensureDbExists();
	try {
		fs.writeFileSync(COMPANY_FILE, JSON.stringify(profile, null, 2), 'utf-8');
		return true;
	} catch (e) {
		console.error('Error saving company-profile.json:', e);
		return false;
	}
}

export function getTeam(): TeamMember[] {
	ensureDbExists();
	try {
		if (fs.existsSync(TEAM_FILE)) {
			const raw = fs.readFileSync(TEAM_FILE, 'utf-8');
			const parsed = JSON.parse(raw);
			if (Array.isArray(parsed) && parsed.length > 0) {
				return parsed;
			}
		}
	} catch (e) {
		console.error('Error reading team-members.json:', e);
	}
	return DEFAULT_TEAM;
}

export function saveTeam(members: TeamMember[]): boolean {
	ensureDbExists();
	try {
		fs.writeFileSync(TEAM_FILE, JSON.stringify(members, null, 2), 'utf-8');
		return true;
	} catch (e) {
		console.error('Error saving team-members.json:', e);
		return false;
	}
}

export function getSaaSCatalog(): SaaSProductCatalogItem[] {
	ensureDbExists();
	try {
		if (fs.existsSync(SAAS_CATALOG_FILE)) {
			const raw = fs.readFileSync(SAAS_CATALOG_FILE, 'utf-8');
			const parsed = JSON.parse(raw);
			if (Array.isArray(parsed) && parsed.length > 0) {
				return parsed;
			}
		}
	} catch (e) {
		console.error('Error reading saas-catalog.json:', e);
	}
	return DEFAULT_SAAS_CATALOG;
}

export function saveSaaSCatalog(catalog: SaaSProductCatalogItem[]): boolean {
	ensureDbExists();
	try {
		fs.writeFileSync(SAAS_CATALOG_FILE, JSON.stringify(catalog, null, 2), 'utf-8');
		return true;
	} catch (e) {
		console.error('Error saving saas-catalog.json:', e);
		return false;
	}
}
