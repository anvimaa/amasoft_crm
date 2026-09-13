<script lang="ts">
	import { crmStore } from '../stores/crm.svelte';
	import Icon from './Icon.svelte';

	interface Props {
		onToggleMobile: () => void;
	}

	let { onToggleMobile }: Props = $props();
	let isExportMenuOpen = $state<boolean>(false);

	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('pt-AO', {
			style: 'currency',
			currency: 'AOA',
			maximumFractionDigits: 0
		}).format(value).replace('AOA', 'Kz');
	}

	let viewTitles: Record<string, { title: string; subtitle: string }> = {
		dashboard: { title: 'Visão Geral', subtitle: 'Métricas e inteligência de prospecção' },
		kanban: { title: 'Pipeline Comercial', subtitle: 'Fluxo de conversão e negociação' },
		table: { title: 'Diretório de Empresas', subtitle: 'Lista completa de contas em Angola' },
		map: { title: 'Cobertura Territorial', subtitle: 'Distribuição geográfica por província' }
	};

	let current = $derived(viewTitles[crmStore.activeView] || viewTitles.dashboard);
</script>

<header class="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-800/80 bg-[#090a0f]/90 px-4 sm:px-6 backdrop-blur-md">
	
	<!-- Left: Hamburger (Mobile) + Breadcrumb -->
	<div class="flex items-center gap-3">
		<button
			type="button"
			onclick={onToggleMobile}
			class="rounded-md p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white lg:hidden cursor-pointer"
			aria-label="Abrir menu lateral"
		>
			<Icon name="dashboard" class="w-5 h-5" />
		</button>

		<div class="flex flex-col">
			<div class="flex items-center gap-2 text-xs text-zinc-400">
				<span>Amasoft</span>
				<span>/</span>
				<span class="font-semibold text-zinc-100">{current.title}</span>
			</div>
			<span class="hidden sm:inline text-[11px] text-zinc-400">{current.subtitle}</span>
		</div>
	</div>

	<!-- Center/Right Search & Actions -->
	<div class="flex items-center gap-3">
		
		<!-- Global Search Input -->
		<div class="relative hidden sm:block w-64 md:w-80">
			<Icon name="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
			<input
				type="text"
				bind:value={crmStore.filters.search}
				placeholder="Pesquisar contas, setores, cidades..."
				class="w-full rounded-md bg-zinc-900/90 border border-zinc-800 pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none transition-colors"
			/>
		</div>

		<!-- Status Indicator (Server Save Status) -->
		{#if crmStore.isSaving}
			<span class="text-[10px] text-zinc-400 flex items-center gap-1">
				<span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
				<span class="hidden md:inline">A guardar...</span>
			</span>
		{/if}

		<!-- Import Button -->
		<button
			type="button"
			onclick={() => crmStore.isImportModalOpen = true}
			class="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
			title="Importar empresas no formato clientes.json"
		>
			<Icon name="upload" class="w-3.5 h-3.5" />
			<span class="hidden md:inline">Importar</span>
		</button>

		<!-- Export Dropdown -->
		<div class="relative">
			<button
				type="button"
				onclick={() => isExportMenuOpen = !isExportMenuOpen}
				class="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
			>
				<Icon name="download" class="w-3.5 h-3.5" />
				<span class="hidden md:inline">Exportar</span>
				<Icon name="chevron-down" class="w-3 h-3 text-zinc-500" />
			</button>

			{#if isExportMenuOpen}
				<!-- Backdrop to close -->
				<button
					type="button"
					class="fixed inset-0 z-40 bg-transparent cursor-default border-0"
					onclick={() => isExportMenuOpen = false}
					aria-label="Fechar menu"
				></button>

				<div class="absolute right-0 mt-2 z-50 w-64 rounded-xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl space-y-1 text-xs">
					<button
						type="button"
						onclick={() => {
							crmStore.exportOriginalFormat();
							isExportMenuOpen = false;
						}}
						class="w-full text-left p-2 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer flex flex-col"
					>
						<span class="font-semibold text-zinc-200">Formato Original (clientes.json)</span>
						<span class="text-[11px] text-zinc-400">Estrutura padrão idêntica para importações</span>
					</button>

					<button
						type="button"
						onclick={() => {
							crmStore.exportToJSON();
							isExportMenuOpen = false;
						}}
						class="w-full text-left p-2 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer flex flex-col"
					>
						<span class="font-semibold text-zinc-200">Base Completa do CRM (.json)</span>
						<span class="text-[11px] text-zinc-400">Inclui todas as notas, pipeline e valores em Kz</span>
					</button>
				</div>
			{/if}
		</div>

		<!-- Add Lead CTA -->
		<button
			type="button"
			onclick={() => crmStore.isAddModalOpen = true}
			class="flex items-center gap-1.5 rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-white transition-colors cursor-pointer shadow-sm"
		>
			<Icon name="plus" class="w-3.5 h-3.5 text-zinc-950" />
			<span class="hidden sm:inline">Adicionar Empresa</span>
			<span class="sm:hidden">Novo</span>
		</button>

	</div>

</header>
