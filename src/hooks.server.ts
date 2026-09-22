import type { Handle } from '@sveltejs/kit/hooks';
import { redirect } from '@sveltejs/kit';
import { getSessionUser } from '#lib/server/auth.ts';

const PUBLIC_API_ROUTES = ['/api/auth/login', '/api/auth/logout'];

export const handle: Handle = async ({ event, resolve }) => {
	// 1. Populate user session in event.locals
	const user = getSessionUser(event.cookies);
	event.locals.user = user;

	const { pathname } = event.url;

	// 2. API Route Protection
	if (pathname.startsWith('/api/')) {
		const isPublicApi = PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route));
		if (!isPublicApi && !user) {
			return Response.json(
				{
					success: false,
					error: 'Unauthorized',
					message: 'Sessão expirada ou não autenticado. Efetue login novamente.'
				},
				{ status: 401 }
			);
		}
		return resolve(event);
	}

	// 3. Page Route Protection
	if (pathname === '/login') {
		if (user) {
			throw redirect(303, '/dashboard');
		}
		return resolve(event);
	}

	// Any other private page route requires an active user session
	if (!user) {
		throw redirect(303, '/login');
	}

	return resolve(event);
};
