export interface ToastMessage {
	id: string;
	type: 'success' | 'error' | 'info';
	title: string;
	description?: string;
}

class ToastState {
	toasts = $state<ToastMessage[]>([]);

	show(title: string, description?: string, type: ToastMessage['type'] = 'success', duration = 4000) {
		const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
		const toast: ToastMessage = { id, type, title, description };
		this.toasts.push(toast);

		if (duration > 0) {
			setTimeout(() => {
				this.dismiss(id);
			}, duration);
		}
	}

	success(title: string, description?: string) {
		this.show(title, description, 'success');
	}

	error(title: string, description?: string) {
		this.show(title, description, 'error', 5000);
	}

	info(title: string, description?: string) {
		this.show(title, description, 'info');
	}

	dismiss(id: string) {
		this.toasts = this.toasts.filter(t => t.id !== id);
	}
}

export const toast = new ToastState();
