import type { RequestHandler } from './$types';
import { getCompany, getTeam, saveCompany, saveTeam } from '#lib/server/db.ts';
import type { CompanyProfile, TeamMember } from '#lib/types/crm.ts';

export const GET: RequestHandler = async () => {
	const company = getCompany();
	const team = getTeam();
	return Response.json({ company, team });
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const payload = await request.json();
		if (payload?.type === 'company' && payload?.data) {
			const ok = saveCompany(payload.data as CompanyProfile);
			return Response.json({ success: ok });
		}
		if (payload?.type === 'team' && Array.isArray(payload?.data)) {
			const ok = saveTeam(payload.data as TeamMember[]);
			return Response.json({ success: ok });
		}
		return Response.json({ success: false, error: 'Formato inválido' }, { status: 400 });
	} catch (e) {
		console.error('API Error saving company/team:', e);
		return Response.json({ success: false, error: 'Erro interno ao salvar' }, { status: 500 });
	}
};
