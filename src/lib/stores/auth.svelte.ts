import { goto } from '$app/navigation';
import { toast } from './toast.svelte';

export interface AuthUserInfo {
	username: string;
	role: string;
}

class AuthStore {
	user = $state<AuthUserInfo | null>(null);
	isLoading = $state<boolean>(true);
	isSubmitting = $state<boolean>(false);

	get isAuthenticated(): boolean {
		return !!this.user;
	}

	async checkAuth(): Promise<boolean> {
		this.isLoading = true;
		try {
			// If sessionStorage is empty (e.g. browser was closed and reopened), enforce logout
			if (typeof window !== 'undefined' && !sessionStorage.getItem('amasoft_active_session')) {
				await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
				this.user = null;
				return false;
			}

			const res = await fetch('/api/auth/me');
			if (res.ok) {
				const data = await res.json();
				if (data.authenticated && data.user) {
					this.user = data.user;
					if (typeof window !== 'undefined') {
						sessionStorage.setItem('amasoft_active_session', 'true');
					}
					return true;
				}
			}
			if (typeof window !== 'undefined') {
				sessionStorage.removeItem('amasoft_active_session');
			}
			this.user = null;
			return false;
		} catch {
			if (typeof window !== 'undefined') {
				sessionStorage.removeItem('amasoft_active_session');
			}
			this.user = null;
			return false;
		} finally {
			this.isLoading = false;
		}
	}

	async login(username: string, password: string): Promise<boolean> {
		if (!username.trim() || !password.trim()) {
			toast.error('Campos Obrigatórios', 'Por favor, informe o utilizador e a palavra-passe.');
			return false;
		}

		this.isSubmitting = true;
		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username: username.trim(), password })
			});

			const data = await res.json();

			if (!res.ok || !data.success) {
				toast.error('Erro de Autenticação', data.message || 'Credenciais inválidas.');
				return false;
			}

			this.user = data.user;
			if (typeof window !== 'undefined') {
				sessionStorage.setItem('amasoft_active_session', 'true');
			}
			toast.success('Bem-vindo ao Amasoft CRM', `Sessão iniciada como ${this.user?.username}.`);
			await goto('/dashboard');
			return true;
		} catch (err: any) {
			toast.error('Erro de Rede', 'Não foi possível comunicar com o servidor de autenticação.');
			return false;
		} finally {
			this.isSubmitting = false;
		}
	}

	async logout(): Promise<void> {
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
		} catch {
			// Proceed anyway
		}
		if (typeof window !== 'undefined') {
			sessionStorage.removeItem('amasoft_active_session');
		}
		this.user = null;
		toast.info('Sessão Terminada', 'A sua sessão no CRM foi encerrada.');
		await goto('/login');
	}
}

export const authStore = new AuthStore();
