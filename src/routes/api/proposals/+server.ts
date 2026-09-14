import { json } from '@sveltejs/kit';
import fs from 'node:fs';
import path from 'node:path';
import type { RequestHandler } from './$types';
import { DEFAULT_PROPOSALS } from '#lib/data/defaults.ts';
import type { CommercialProposal } from '#lib/types/crm.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const PROPOSALS_FILE = path.join(DATA_DIR, 'proposals.json');

function ensureFile() {
	if (!fs.existsSync(DATA_DIR)) {
		fs.mkdirSync(DATA_DIR, { recursive: true });
	}
	if (!fs.existsSync(PROPOSALS_FILE)) {
		fs.writeFileSync(PROPOSALS_FILE, JSON.stringify(DEFAULT_PROPOSALS, null, 2), 'utf-8');
	}
}

export const GET: RequestHandler = async () => {
	try {
		ensureFile();
		const raw = fs.readFileSync(PROPOSALS_FILE, 'utf-8');
		const proposals = JSON.parse(raw);
		return json(proposals);
	} catch (e) {
		console.error('Error reading proposals file:', e);
		return json(DEFAULT_PROPOSALS);
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		ensureFile();
		const body: CommercialProposal[] = await request.json();
		if (!Array.isArray(body)) {
			return json({ error: 'Array of proposals expected' }, { status: 400 });
		}
		fs.writeFileSync(PROPOSALS_FILE, JSON.stringify(body, null, 2), 'utf-8');
		return json({ success: true, count: body.length });
	} catch (e) {
		console.error('Error writing proposals file:', e);
		return json({ error: 'Failed to save proposals' }, { status: 500 });
	}
};
