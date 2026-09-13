import type { RequestHandler } from './$types';
import { getLeads, saveLeads } from '#lib/server/db.ts';
import type { ClientLead } from '#lib/types/crm.ts';
import crypto from 'node:crypto';

function computeEtag(data: ClientLead[]): string {
	const hash = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
	return `"${hash}"`;
}

export const GET: RequestHandler = async ({ request }) => {
	const leads = getLeads();
	const etag = computeEtag(leads);

	const ifNoneMatch = request.headers.get('if-none-match');
	if (ifNoneMatch && ifNoneMatch === etag) {
		return new Response(null, { status: 304 });
	}

	return new Response(JSON.stringify(leads), {
		headers: {
			'Content-Type': 'application/json',
			'ETag': etag,
			'Cache-Control': 'no-cache'
		}
	});
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
