import fs from 'node:fs';
import path from 'node:path';
import type { ClientLead } from '../types/crm';
import { INITIAL_LEADS } from '../data/initial-leads';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'crm-database.json');

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
	ensureDbExists();
	try {
		const raw = fs.readFileSync(DB_FILE, 'utf-8');
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed) && parsed.length > 0) {
			return parsed;
		}
	} catch (e) {
		console.error('Error reading crm-database.json:', e);
	}
	return INITIAL_LEADS;
}

export function saveLeads(leads: ClientLead[]): boolean {
	ensureDbExists();
	try {
		fs.writeFileSync(DB_FILE, JSON.stringify(leads, null, 2), 'utf-8');
		return true;
	} catch (e) {
		console.error('Error saving crm-database.json:', e);
		return false;
	}
}

export function resetLeads(): ClientLead[] {
	ensureDbExists();
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
