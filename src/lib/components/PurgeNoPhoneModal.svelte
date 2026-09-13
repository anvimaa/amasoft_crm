<script lang="ts">
	import { crmStore } from '../stores/crm.svelte';
	import { toast } from '../stores/toast.svelte';
	import Icon from './Icon.svelte';
	import StatusBadge from './StatusBadge.svelte';

	let leadsToPurge = $derived(crmStore.leads.filter(l => !l.phone || l.phone.trim() === ''));
	let isProcessing = $state<boolean>(false);

	async function handleConfirmPurge() {
		isProcessing = true;
		try {
			const count = leadsToPurge.length;
			const removed = crmStore.deleteLeadsWithoutPhone();
			crmStore.isPurgeModalOpen = false;
			toast.success(
				'Limpeza de Base Concluída',
				`${removed} empresas sem número de telefone foram removidas do ficheiro central data/crm-database.json.`
			);
		} catch (e) {
			toast.error('Erro ao Excluir', 'Não foi possível concluir a exclusão de dados.');
		} finally {
			isProcessing = false;
		}
	}
</script>

{#if crmStore.isPurgeModalOpen}
	<!-- Modal Backdrop -->
	<button
		type="button"
		class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm w-full h-full border-0 cursor-default"
		onclick={() => crmStore.isPurgeModalOpen = false}
		aria-label="Fechar modal"
	></button>

	<!-- Modal Wrapper -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
		<div
			class="pointer-events-auto relative w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col"
		>
			<!-- Header -->
			<div class="flex items-start justify-between border-b border-zinc-800/80 pb-4">
				<div class="flex items-center gap-3">
					<div class="rounded-xl bg-rose-950/40 p-2.5 text-rose-400 border border-rose-900/40">
						<Icon name="trash" class="w-5 h-5" />
					</div>
					<div>
						<div class="flex items-center gap-2">
							<h3 class="text-base font-semibold text-white tracking-tight">
								Exclusão de Empresas Sem Telefone
							</h3>
							<span class="rounded-full bg-rose-950/60 px-2 py-0.5 text-xs font-mono font-semibold text-rose-300 border border-rose-900/50">
								{leadsToPurge.length} {leadsToPurge.length === 1 ? 'empresa' : 'empresas'}
							</span>
						</div>
						<p class="text-xs text-zinc-400 mt-0.5">
							As contas abaixo não possuem número de contacto e serão excluídas da base de prospeção.
						</p>
					</div>
				</div>

				<button
					type="button"
					onclick={() => crmStore.isPurgeModalOpen = false}
					class="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
					aria-label="Fechar"
				>
					<Icon name="close" class="w-4 h-4" />
				</button>
			</div>

			<!-- Preview Table Container -->
			<div class="flex-1 overflow-hidden flex flex-col min-h-0 border border-zinc-800/80 rounded-xl bg-zinc-900/30">
				<div class="px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800/80 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex justify-between items-center">
					<span>Pré-visualização dos Registos a Remover</span>
					<span class="text-zinc-500 font-mono normal-case">{leadsToPurge.length} encontrados</span>
				</div>

				<div class="overflow-y-auto max-h-64 divide-y divide-zinc-800/60 text-xs">
					{#each leadsToPurge as item (item.id)}
						<div class="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-zinc-800/20 transition-colors">
							<div class="min-w-0 flex-1">
								<h4 class="font-medium text-zinc-200 truncate">{item.title}</h4>
								<div class="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
									<span class="truncate">{item.categoryName}</span>
									<span>•</span>
									<span class="text-zinc-400">{item.city || 'Angola'}</span>
								</div>
							</div>

							<div class="flex items-center gap-2.5 shrink-0">
								{#if item.website}
									<span class="text-[10px] text-zinc-400 border border-zinc-700/50 bg-zinc-800 px-1.5 py-0.2 rounded">
										Com Site
									</span>
								{:else}
									<span class="text-[10px] text-zinc-400 border border-zinc-800 bg-zinc-900 px-1.5 py-0.2 rounded">
										Sem Site
									</span>
								{/if}
								
								<StatusBadge status={item.status} size="sm" />
							</div>
						</div>
					{:else}
						<div class="p-8 text-center text-xs text-zinc-500">
							Nenhuma empresa sem contacto telefónico encontrada na base.
						</div>
					{/each}
				</div>
			</div>

			<!-- Notice Banner -->
			<div class="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-xs text-zinc-400 flex items-start gap-2.5">
				<Icon name="dashboard" class="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
				<p class="leading-relaxed">
					Ao confirmar, o ficheiro central <code class="text-zinc-300 font-mono text-[11px] bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">data/crm-database.json</code> será atualizado no servidor. Pode restaurar os dados originais a qualquer momento pelo botão de reposição.
				</p>
			</div>

			<!-- Modal Actions -->
			<div class="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
				<button
					type="button"
					onclick={() => crmStore.isPurgeModalOpen = false}
					class="rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
				>
					Cancelar
				</button>
				
				<button
					type="button"
					onclick={handleConfirmPurge}
					disabled={isProcessing || leadsToPurge.length === 0}
					class="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
				>
					{#if isProcessing}
						<div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
						<span>A excluir...</span>
					{:else}
						<Icon name="trash" class="w-3.5 h-3.5" />
						<span>Confirmar e Eliminar {leadsToPurge.length} {leadsToPurge.length === 1 ? 'Empresa' : 'Empresas'}</span>
					{/if}
				</button>
			</div>

		</div>
	</div>
{/if}
