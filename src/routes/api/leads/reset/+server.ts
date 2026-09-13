import type { RequestHandler } from './$types';
import { resetLeads } from '#lib/server/db.ts';

export const POST: RequestHandler = async () => {
	const leads = resetLeads();
	return Response.json({ success: true, count: leads.length, leads });
};
