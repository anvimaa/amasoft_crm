import type { RequestHandler } from './$types';
import { getSessionUser } from '#lib/server/auth.ts';

export const GET: RequestHandler = async ({ cookies }) => {
	const user = getSessionUser(cookies);

	if (!user) {
		return Response.json({
			authenticated: false,
			user: null
		}, { status: 401 });
	}

	return Response.json({
		authenticated: true,
		user
	});
};
