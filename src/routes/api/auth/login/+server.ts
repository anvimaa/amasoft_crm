import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyCredentials, createSessionCookie, type AuthUser } from '#lib/server/auth.ts';
import { z } from 'zod';

const LoginSchema = z.object({
	username: z.string().trim().min(1, 'Nome de utilizador é obrigatório.'),
	password: z.string().trim().min(1, 'Palavra-passe é obrigatória.')
});

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const rawBody = await request.json();
		const validation = LoginSchema.safeParse(rawBody);

		if (!validation.success) {
			return json(
				{
					success: false,
					message: validation.error.issues[0]?.message || 'Credenciais inválidas.',
					details: validation.error.issues
				},
				{ status: 400 }
			);
		}

		const { username, password } = validation.data;

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
