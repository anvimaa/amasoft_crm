import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSessionUser } from '#lib/server/auth.ts';

export const GET: RequestHandler = async ({ cookies }) => {
	const user = getSessionUser(cookies);

	if (!user) {
		return json({
			authenticated: false,
			user: null
		}, { status: 401 });
	}

	return json({
		authenticated: true,
		user
	});
};
