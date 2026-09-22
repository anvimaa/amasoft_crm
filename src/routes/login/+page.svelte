<script lang="ts">
	import { authStore } from '#lib/stores/auth.svelte.ts';
	import Icon from '#lib/components/Icon.svelte';

	let username = $state<string>('');
	let password = $state<string>('');
	let showPassword = $state<boolean>(false);
	let rememberDevice = $state<boolean>(true);
	let errorMessage = $state<string>('');

	async function handleSubmit(e?: Event) {
		if (e) e.preventDefault();
		errorMessage = '';

		if (!username.trim() || !password.trim()) {
			errorMessage = 'Por favor, introduza o utilizador e a palavra-passe.';
			return;
		}

		const ok = await authStore.login(username, password);
		if (!ok) {
			errorMessage = 'Credenciais inválidas. Verifique os dados introduzidos.';
		}
	}
</script>

<svelte:head>
	<title>Entrar | Amasoft CRM</title>
</svelte:head>

<div class="min-h-screen w-full flex flex-col items-center justify-between bg-[#08090d] text-zinc-100 p-6 selection:bg-emerald-500/20 selection:text-emerald-200">
	<!-- Top Simple Brand -->
	<header class="w-full max-w-sm flex items-center justify-between pt-4">
		<div class="flex items-center gap-2.5">
			<div class="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center font-bold text-sm text-emerald-400 shadow-sm">
				A
			</div>
			<div class="flex flex-col">
				<span class="text-xs font-bold tracking-tight text-white uppercase">Amasoft CRM</span>
				<span class="text-[10px] text-zinc-400 font-mono">B2B Angola</span>
			</div>
		</div>

		<div class="flex items-center gap-1.5 rounded-full bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-[11px] text-zinc-400">
			<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
			<span>Sistema Ativo</span>
		</div>
	</header>

	<!-- Centered Modern Card -->
	<main class="w-full max-w-sm my-auto py-8">
		<div class="rounded-2xl border border-zinc-800 bg-[#0e1017] p-7 shadow-2xl shadow-black/80 space-y-6">
			<!-- Header inside card -->
			<div class="space-y-1.5">
				<h1 class="text-lg font-semibold tracking-tight text-white">
					Iniciar Sessão
				</h1>
				<p class="text-xs text-zinc-400">
					Aceda ao seu painel comercial e gestão de clientes.
				</p>
			</div>

			{#if errorMessage}
				<div class="flex items-center gap-2.5 rounded-lg bg-rose-950/40 border border-rose-900/50 p-3 text-xs text-rose-300">
					<Icon name="alert-triangle" class="w-4 h-4 text-rose-400 shrink-0" />
					<span>{errorMessage}</span>
				</div>
			{/if}

			<form onsubmit={handleSubmit} class="space-y-4">
				<!-- Username -->
				<div class="space-y-1.5">
					<label for="username" class="block text-xs font-medium text-zinc-300">
						Utilizador
					</label>
					<div class="relative">
						<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
							<Icon name="user" class="w-4 h-4" />
						</div>
						<input
							id="username"
							type="text"
							bind:value={username}
							placeholder="Introduza o seu utilizador"
							autocomplete="username"
							disabled={authStore.isSubmitting}
							class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:bg-zinc-900 focus:outline-none transition-all disabled:opacity-50"
						/>
					</div>
				</div>

				<!-- Password -->
				<div class="space-y-1.5">
					<div class="flex items-center justify-between">
						<label for="password" class="block text-xs font-medium text-zinc-300">
							Palavra-passe
						</label>
					</div>
					<div class="relative">
						<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
							<Icon name="lock" class="w-4 h-4" />
						</div>
						<input
							id="password"
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							placeholder="Palavra-passe de acesso"
							autocomplete="current-password"
							disabled={authStore.isSubmitting}
							class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 pl-9 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:bg-zinc-900 focus:outline-none transition-all disabled:opacity-50 font-mono"
						/>
						<button
							type="button"
							onclick={() => showPassword = !showPassword}
							class="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
							tabindex="-1"
							title={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
						>
							{#if showPassword}
								<Icon name="eye-off" class="w-4 h-4" />
							{:else}
								<Icon name="eye" class="w-4 h-4" />
							{/if}
						</button>
					</div>
				</div>

				<!-- Remember Session Checkbox -->
				<div class="flex items-center justify-between pt-0.5">
					<label class="flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-400 hover:text-zinc-300">
						<input
							type="checkbox"
							bind:checked={rememberDevice}
							class="rounded border-zinc-700 bg-zinc-900 text-emerald-600 focus:ring-0 cursor-pointer h-3.5 w-3.5"
						/>
						<span>Lembrar neste dispositivo</span>
					</label>
				</div>

				<!-- Submit Button -->
				<div class="pt-2">
					<button
						type="submit"
						disabled={authStore.isSubmitting}
						class="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-white active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-950/40"
					>
						{#if authStore.isSubmitting}
							<div class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
							<span>A autenticar...</span>
						{:else}
							<span>Entrar no CRM</span>
							<Icon name="arrow-right" class="w-3.5 h-3.5" />
						{/if}
					</button>
				</div>
			</form>
		</div>
	</main>

	<!-- Footer -->
	<footer class="w-full max-w-sm flex items-center justify-between pb-4 text-[11px] text-zinc-400 font-mono">
		<span>&copy; {new Date().getFullYear()} Amasoft</span>
		<div class="flex items-center gap-1.5">
			<Icon name="shield-check" class="w-3.5 h-3.5 text-emerald-400" />
			<span>Conexão Segura</span>
		</div>
	</footer>
</div>
