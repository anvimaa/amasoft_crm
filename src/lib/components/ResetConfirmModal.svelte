<script lang="ts">
	import { crmStore } from '../stores/crm.svelte';
	import { companyStore } from '../stores/company.svelte';
	import { DEFAULT_COMPANY, DEFAULT_TEAM } from '../data/defaults';
	import { toast } from '../stores/toast.svelte';
	import Icon from './Icon.svelte';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
	}

	let { isOpen, onClose }: Props = $props();
	let isResetting = $state<boolean>(false);

	async function handleConfirmReset() {
		isResetting = true;
		try {
			await crmStore.resetToDefaults();
			companyStore.updateCompany(DEFAULT_COMPANY);
			companyStore.team = [...DEFAULT_TEAM];
			try { localStorage.setItem('amasoft_crm_team_v1', JSON.stringify(companyStore.team)); } catch {}
			onClose();
			toast.success(
				'Base de Dados Restaurada',
				'Empresa, equipa e leads repostos para o estado original de fábrica.'
			);
		} catch (e) {
			toast.error('Erro ao Restaurar', 'Não foi possível restaurar os dados originais.');
		} finally {
			isResetting = false;
		}
	}
</script>

{#if isOpen}
	<!-- Static Backdrop (does not close on click) -->
	<div
		class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm w-full h-full"
		aria-hidden="true"
	></div>

	<!-- Modal Wrapper -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
		<div
			class="pointer-events-auto relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4"
		>
			<div class="flex items-start gap-3">
				<div class="rounded-xl bg-amber-950/40 p-2.5 text-amber-400 border border-amber-900/40">
					<Icon name="refresh" class="w-5 h-5" />
				</div>
				<div>
					<h3 class="text-base font-semibold text-white">Restaurar para Estado de Fábrica?</h3>
					<p class="text-xs text-zinc-400 mt-1 leading-relaxed">
						Esta ação irá repor <strong class="text-zinc-300">todos os dados</strong> para o estado original:
					</p>
					<ul class="mt-2 space-y-1 text-[11px] text-zinc-400">
						<li class="flex items-center gap-1.5">
							<span class="w-1 h-1 rounded-full bg-zinc-500"></span>
							Leads: 100 registos padrão de <code class="font-mono text-zinc-300">clientes.json</code>
						</li>
						<li class="flex items-center gap-1.5">
							<span class="w-1 h-1 rounded-full bg-zinc-500"></span>
							Empresa: dados de fábrica da Amasoft Technologies
						</li>
						<li class="flex items-center gap-1.5">
							<span class="w-1 h-1 rounded-full bg-zinc-500"></span>
							Equipa: membro padrão (Anvima)
						</li>
					</ul>
					<p class="mt-2 text-[11px] text-amber-400/80">
						Todas as anotações, contatos e configurações personalizadas serão apagadas.
					</p>
				</div>
			</div>

			<div class="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
				<button
					type="button"
					onclick={onClose}
					class="rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 cursor-pointer"
				>
					Cancelar
				</button>
				<button
					type="button"
					onclick={handleConfirmReset}
					disabled={isResetting}
					class="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-50 cursor-pointer shadow-sm"
				>
					{#if isResetting}
						<div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
						<span>A restaurar...</span>
					{:else}
						<Icon name="refresh" class="w-3.5 h-3.5" />
						<span>Confirmar Restauração</span>
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
