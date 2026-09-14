import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSaaSCatalog, saveSaaSCatalog } from '#lib/server/db.ts';
import type { SaaSProductCatalogItem } from '#lib/types/crm.ts';

export const GET: RequestHandler = async () => {
	try {
		const catalog = getSaaSCatalog();
		return json(catalog);
	} catch (e) {
		console.error('Error in GET /api/saas:', e);
		return json({ error: 'Erro ao carregar catálogo de SaaS' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body: SaaSProductCatalogItem[] = await request.json();
		if (!Array.isArray(body)) {
			return json({ error: 'Array de produtos SaaS esperado' }, { status: 400 });
		}
		const ok = saveSaaSCatalog(body);
		if (ok) {
			return json({ success: true, count: body.length });
		}
		return json({ error: 'Falha ao guardar catálogo' }, { status: 500 });
	} catch (e) {
		console.error('Error in POST /api/saas:', e);
		return json({ error: 'Erro no corpo da requisição' }, { status: 400 });
	}
};
