import type { RequestHandler } from './$types';
import { getLeads, saveLeads } from '#lib/server/db.ts';
import type { ClientLead } from '#lib/types/crm.ts';

export const GET: RequestHandler = async () => {
	const leads = getLeads();
	return Response.json(leads);
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const payload = (await request.json()) as ClientLead[];
		if (Array.isArray(payload)) {
			saveLeads(payload);
			return Response.json({ success: true, count: payload.length });
		}
		return Response.json({ success: false, error: 'Formato inválido' }, { status: 400 });
	} catch (e) {
		console.error('API Error saving leads:', e);
		return Response.json({ success: false, error: 'Erro interno ao salvar' }, { status: 500 });
	}
};
