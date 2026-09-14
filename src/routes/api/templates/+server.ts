import { json } from '@sveltejs/kit';
import fs from 'node:fs';
import path from 'node:path';
import type { RequestHandler } from './$types';
import { DEFAULT_TEMPLATES } from '#lib/data/defaults.ts';
import type { ApproachTemplate } from '#lib/types/crm.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const TEMPLATES_FILE = path.join(DATA_DIR, 'whatsapp-templates.json');

function ensureFile() {
	if (!fs.existsSync(DATA_DIR)) {
		fs.mkdirSync(DATA_DIR, { recursive: true });
	}
	if (!fs.existsSync(TEMPLATES_FILE)) {
		fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(DEFAULT_TEMPLATES, null, 2), 'utf-8');
	}
}

export const GET: RequestHandler = async () => {
	try {
		ensureFile();
		const raw = fs.readFileSync(TEMPLATES_FILE, 'utf-8');
		const templates = JSON.parse(raw);
		return json(templates);
	} catch (e) {
		console.error('Error reading templates file:', e);
		return json(DEFAULT_TEMPLATES);
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		ensureFile();
		const body: ApproachTemplate[] = await request.json();
		if (!Array.isArray(body)) {
			return json({ error: 'Array of templates expected' }, { status: 400 });
		}
		fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(body, null, 2), 'utf-8');
		return json({ success: true, count: body.length });
	} catch (e) {
		console.error('Error writing templates file:', e);
		return json({ error: 'Failed to save templates' }, { status: 500 });
	}
};
