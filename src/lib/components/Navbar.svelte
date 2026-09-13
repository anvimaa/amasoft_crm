<script lang="ts">
	import { crmStore } from '../stores/crm.svelte';
	import Icon from './Icon.svelte';

	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('pt-AO', {
			style: 'currency',
			currency: 'AOA',
			maximumFractionDigits: 0
		}).format(value).replace('AOA', 'Kz');
	}
</script>

<header class="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-15 items-center justify-between gap-4">
			
			<!-- Brand & Workspace -->
			<div class="flex items-center gap-3">
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 text-white font-semibold text-xs tracking-wider">
					AS
				</div>
				<div class="flex flex-col">
					<div class="flex items-center gap-2">
						<span class="text-sm font-semibold text-zinc-100 tracking-tight">Amasoft CRM</span>
						<span class="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 border border-zinc-700/60">
							Angola B2B
						</span>
					</div>
					<span class="text-[11px] text-zinc-400">Base de Prospecção Comercial</span>
				</div>
			</div>

			<!-- Navigation Tabs (Segmented Control) -->
			<nav class="hidden md:flex items-center rounded-lg bg-zinc-900/90 p-1 border border-zinc-800">
				<button
					type="button"
					onclick={() => crmStore.activeView = 'dashboard'}
					class="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer {crmStore.activeView === 'dashboard' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}"
				>
					<Icon name="dashboard" class="w-3.5 h-3.5" />
					Visão Geral
				</button>
				
				<button
					type="button"
					onclick={() => crmStore.activeView = 'kanban'}
					class="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer {crmStore.activeView === 'kanban' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}"
				>
					<Icon name="kanban" class="w-3.5 h-3.5" />
					Pipeline
				</button>

				<button
					type="button"
					onclick={() => crmStore.activeView = 'table'}
					class="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer {crmStore.activeView === 'table' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}"
				>
					<Icon name="table" class="w-3.5 h-3.5" />
					Empresas
					<span class="rounded-full bg-zinc-800 px-1.5 py-0.2 text-[10px] text-zinc-400 border border-zinc-700/60">
						{crmStore.leads.length}
					</span>
				</button>

				<button
					type="button"
					onclick={() => crmStore.activeView = 'map'}
					class="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer {crmStore.activeView === 'map' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}"
				>
					<Icon name="map" class="w-3.5 h-3.5" />
					Cobertura Geográfica
				</button>
			</nav>

			<!-- Right Actions -->
			<div class="flex items-center gap-2 sm:gap-3">
				<!-- Pipeline summary -->
				<div class="hidden lg:flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-1.5 border border-zinc-800 text-xs">
					<span class="text-zinc-400">Total Pipeline:</span>
					<span class="font-semibold text-zinc-200 font-mono">{formatCurrency(crmStore.stats.totalPipelineValue)}</span>
				</div>

				<!-- Export Button -->
				<button
					type="button"
					onclick={() => crmStore.exportToJSON()}
					title="Exportar base em formato JSON"
					class="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
				>
					<Icon name="download" class="w-3.5 h-3.5" />
					<span class="hidden sm:inline">Exportar</span>
				</button>

				<!-- Reset Button -->
				<button
					type="button"
					onclick={() => {
						if (confirm('Deseja restaurar os dados padrão do arquivo clientes.json?')) {
							crmStore.resetToDefaults();
						}
					}}
					title="Restaurar dados padrão"
					class="rounded-md border border-zinc-800 p-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors cursor-pointer"
				>
					<Icon name="refresh" class="w-3.5 h-3.5" />
				</button>

				<!-- Add Lead Button -->
				<button
					type="button"
					onclick={() => crmStore.isAddModalOpen = true}
					class="flex items-center gap-1.5 rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-white transition-colors cursor-pointer shadow-sm"
				>
					<Icon name="plus" class="w-3.5 h-3.5" />
					<span>Adicionar Empresa</span>
				</button>
			</div>

		</div>

		<!-- Mobile Navigation Bar -->
		<div class="flex md:hidden overflow-x-auto py-2 border-t border-zinc-800 gap-1 scrollbar-none">
			<button
				type="button"
				onclick={() => crmStore.activeView = 'dashboard'}
				class="flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium {crmStore.activeView === 'dashboard' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}"
			>
				<Icon name="dashboard" class="w-3.5 h-3.5" />
				Visão Geral
			</button>
			<button
				type="button"
				onclick={() => crmStore.activeView = 'kanban'}
				class="flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium {crmStore.activeView === 'kanban' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}"
			>
				<Icon name="kanban" class="w-3.5 h-3.5" />
				Pipeline
			</button>
			<button
				type="button"
				onclick={() => crmStore.activeView = 'table'}
				class="flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium {crmStore.activeView === 'table' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}"
			>
				<Icon name="table" class="w-3.5 h-3.5" />
				Empresas ({crmStore.leads.length})
			</button>
			<button
				type="button"
				onclick={() => crmStore.activeView = 'map'}
				class="flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium {crmStore.activeView === 'map' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}"
			>
				<Icon name="map" class="w-3.5 h-3.5" />
				Geolocalização
			</button>
		</div>
	</div>
</header>
