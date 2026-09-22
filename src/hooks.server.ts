import type { Handle } from '@sveltejs/kit/hooks';
import { redirect } from '@sveltejs/kit';
import { getSessionUser } from '#lib/server/auth.ts';
import { FACTFLEXI_API_KEY } from '$app/env/private';

const PUBLIC_API_ROUTES = [
	'/api/auth/login',
	'/api/auth/logout',
	'/api/v1/leads/external',
	'/api/webhooks/factflexi'
];

export const handle: Handle = async ({ event, resolve }) => {
	// 1. Populate user session in event.locals
	const user = getSessionUser(event.cookies);
	event.locals.user = user;

	const { pathname } = event.url;

	// 2. API Route Protection
	if (pathname.startsWith('/api/')) {
		const isPublicApi = PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route));
		
		// Check API Key authentication
		const apiKeyHeader = event.request.headers.get('x-api-key') || event.request.headers.get('api-key');
		const authHeader = event.request.headers.get('authorization');
		const bearerKey = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
		const queryKey = event.url.searchParams.get('apiKey') || event.url.searchParams.get('api_key');
		
		const expectedKey = FACTFLEXI_API_KEY?.trim();
		const isApiKeyValid = Boolean(
			expectedKey &&
			(
				(apiKeyHeader && apiKeyHeader.trim() === expectedKey) ||
				(bearerKey && bearerKey === expectedKey) ||
				(queryKey && queryKey.trim() === expectedKey)
			)
		);

		if (!isPublicApi && !isApiKeyValid && !user) {
			return Response.json(
				{
					success: false,
					error: 'Unauthorized',
					message: 'Sessão expirada ou chave de API inválida. Forneça uma chave de API válida.'
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
