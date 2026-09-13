<script lang="ts">
	import { crmStore } from '../stores/crm.svelte';
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
			onClose();
			toast.success(
				'Base de Dados Restaurada',
				'A base foi restaurada com sucesso para o estado original de clientes.json.'
			);
		} catch (e) {
			toast.error('Erro ao Restaurar', 'Não foi possível restaurar os dados originais.');
		} finally {
			isResetting = false;
		}
	}
</script>

{#if isOpen}
	<!-- Backdrop -->
	<button
		type="button"
		class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm w-full h-full border-0 cursor-default"
		onclick={onClose}
		aria-label="Fechar modal"
	></button>

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
					<h3 class="text-base font-semibold text-white">Restaurar Base de Dados Original?</h3>
					<p class="text-xs text-zinc-400 mt-1 leading-relaxed">
						Esta ação irá repor todos os 100 registos padrão de <code class="font-mono text-zinc-300">clientes.json</code> no servidor <code class="font-mono text-zinc-300">data/crm-database.json</code>. Anotações personalizadas serão substituídas.
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
