import type { RequestHandler } from './$types';
import { getLeads, exportOriginalFormat } from '#lib/server/db.ts';

export const GET: RequestHandler = async () => {
	const leads = getLeads();
	const originalFormatted = exportOriginalFormat(leads);

	const jsonContent = JSON.stringify(originalFormatted, null, 2);

	return new Response(jsonContent, {
		headers: {
			'Content-Type': 'application/json',
			'Content-Disposition': `attachment; filename="clientes_${new Date().toISOString().split('T')[0]}.json"`
		}
	});
};
