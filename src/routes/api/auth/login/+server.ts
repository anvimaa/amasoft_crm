import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyCredentials, createSessionCookie, type AuthUser } from '#lib/server/auth.ts';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const body = await request.json();
		const { username, password } = body;

		if (!username || !password) {
			return json(
				{ success: false, message: 'Nome de utilizador e palavra-passe são obrigatórios.' },
				{ status: 400 }
			);
		}

		const isValid = verifyCredentials(username, password);
		if (!isValid) {
			return json(
				{ success: false, message: 'Credenciais inválidas. Verifique o utilizador e a palavra-passe.' },
				{ status: 401 }
			);
		}

		const user: AuthUser = {
			username: username.trim(),
			role: 'admin'
		};

		createSessionCookie(cookies, user);

		return json({
			success: true,
			message: 'Autenticação realizada com sucesso!',
			user
		});
	} catch (error) {
		console.error('Login error:', error);
		return json(
			{ success: false, message: 'Erro interno ao processar autenticação.' },
			{ status: 500 }
		);
	}
};
