import type { Handle } from '@sveltejs/kit/hooks';
import { redirect } from '@sveltejs/kit';
import { getSessionUser } from '#lib/server/auth.ts';
import { FACTFLEXI_API_KEY } from '$app/env/private';

const PUBLIC_API_ROUTES = [
	'/api/auth/login',
	'/api/auth/logout',
	'/api/v1/leads/external',
	'/api/webhooks/factflexi',
	'/api/leads/external',
	'/v1/leads/external',
	'/webhooks/factflexi'
];

const CORS_HEADERS: Record<string, string> = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, api-key, X-Requested-With, Accept',
	'Access-Control-Max-Age': '86400'
};

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	// 1. Handle CORS Preflight for any API / Webhook request
	if (event.request.method === 'OPTIONS') {
		return new Response(null, {
			status: 204,
			headers: CORS_HEADERS
		});
	}

	// 2. Populate user session in event.locals
	const user = getSessionUser(event.cookies);
	event.locals.user = user;

	// 3. Check if this is an API or external integration request
	const normalizedPath = pathname.replace(/\/+$/, ''); // Strip trailing slash for matching
	const isApiRoute =
		normalizedPath.startsWith('/api') ||
		normalizedPath.startsWith('/v1') ||
		normalizedPath.startsWith('/webhooks') ||
		event.request.headers.get('accept')?.includes('application/json') ||
		event.request.headers.has('x-api-key') ||
		event.request.headers.has('api-key');

	if (isApiRoute) {
		const isPublicApi = PUBLIC_API_ROUTES.some(
			(route) => normalizedPath === route || normalizedPath.startsWith(route)
		);
		
		// Check API Key authentication
		const apiKeyHeader = event.request.headers.get('x-api-key') || event.request.headers.get('api-key');
		const authHeader = event.request.headers.get('authorization');
		const bearerKey = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
		const queryKey = event.url.searchParams.get('apiKey') || event.url.searchParams.get('api_key') || event.url.searchParams.get('key');
		
		const expectedKey = FACTFLEXI_API_KEY?.trim();
		const isApiKeyValid = Boolean(
			expectedKey &&
			(
				(apiKeyHeader && apiKeyHeader.trim() === expectedKey) ||
				(bearerKey && bearerKey === expectedKey) ||
				(queryKey && queryKey.trim() === expectedKey)
			)
		);

		// If it's a private API route and neither API key nor user session is present
		if (!isPublicApi && !isApiKeyValid && !user) {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'Unauthorized',
					message: 'Chave de API inválida ou sessão não autorizada. Forneça o header x-api-key ou Authorization: Bearer <chave_api>'
				}),
				{
					status: 401,
					headers: {
						'Content-Type': 'application/json',
						...CORS_HEADERS
					}
				}
			);
		}

		const response = await resolve(event);
		// Append CORS headers to API responses
		Object.entries(CORS_HEADERS).forEach(([k, v]) => {
			if (!response.headers.has(k)) {
				response.headers.set(k, v);
			}
		});
		return response;
	}

	// 4. Page Route Protection (Web UI only)
	if (pathname === '/login') {
		if (user) {
			throw redirect(303, '/dashboard');
		}
		return resolve(event);
	}

	// Any other private UI page route requires an active user session
	if (!user) {
		throw redirect(303, '/login');
	}

	return resolve(event);
};
