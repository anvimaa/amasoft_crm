import type { RequestHandler } from './$types';
import { getLatestGtpRupe, saveLatestGtpRupe } from '#lib/server/db.ts';
import type { GtpRupeData } from '#lib/types/gtp-rupe.ts';

export const GET: RequestHandler = async () => {
	try {
		const latest = getLatestGtpRupe();
		return Response.json(latest);
	} catch (e) {
		console.error('Error in GET /api/gtp-rupe:', e);
		return Response.json({ error: 'Erro ao obter dados da Guia RUPE' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body: GtpRupeData = await request.json();
		if (!body || typeof body.rupe !== 'string') {
			return Response.json({ error: 'Objeto GtpRupeData inválido' }, { status: 400 });
		}
		const ok = saveLatestGtpRupe(body);
		if (ok) {
			return Response.json({ success: true, rupe: body.rupe });
		}
		return Response.json({ error: 'Falha ao guardar dados do RUPE' }, { status: 500 });
	} catch (e) {
		console.error('Error in POST /api/gtp-rupe:', e);
		return Response.json({ error: 'Erro no corpo da requisição' }, { status: 400 });
	}
};
