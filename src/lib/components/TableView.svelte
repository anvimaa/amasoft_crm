<script lang="ts">
	import { crmStore } from '../stores/crm.svelte';
	import Icon from './Icon.svelte';
	import PriorityBadge from './PriorityBadge.svelte';
	import type { ClientLead, LeadStatus } from '../types/crm';
	import { generateWhatsAppLink, WHATSAPP_TEMPLATES } from '../utils/whatsapp';
	import { formatKz } from '../utils/format';

	import { toast } from '../stores/toast.svelte';

	let currentPage = $state<number>(1);
	let itemsPerPage = $state<number>(20);
	let jumpInput = $state<string>('');

	let totalFiltered = $derived(crmStore.filteredLeads.length);
	let totalPages = $derived(Math.max(1, Math.ceil(totalFiltered / itemsPerPage)));

	let startIndex = $derived(totalFiltered === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1);
	let endIndex = $derived(Math.min(currentPage * itemsPerPage, totalFiltered));

	// Auto-clamp currentPage if totalPages shrinks due to filters
	$effect(() => {
		if (currentPage > totalPages) {
			currentPage = totalPages;
		}
	});

	let paginatedLeads = $derived.by(() => {
		const start = (currentPage - 1) * itemsPerPage;
		return crmStore.filteredLeads.slice(start, start + itemsPerPage);
	});

	function goToPage(page: number) {
		const target = Math.max(1, Math.min(page, totalPages));
		currentPage = target;
	}

	function handleJumpSubmit(e: Event) {
		e.preventDefault();
		const page = parseInt(jumpInput, 10);
		if (!isNaN(page) && page >= 1 && page <= totalPages) {
			goToPage(page);
			jumpInput = '';
		} else {
			toast.info('Página Inválida', `Por favor insira um número entre 1 e ${totalPages}.`);
		}
	}

	function getPaginationRange(current: number, total: number): (number | '...')[] {
		if (total <= 7) {
			return Array.from({ length: total }, (_, i) => i + 1);
		}

		if (current <= 4) {
			return [1, 2, 3, 4, 5, '...', total];
		}

		if (current >= total - 3) {
			return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
		}

		return [1, '...', current - 1, current, current + 1, '...', total];
	}

	let paginationRange = $derived(getPaginationRange(currentPage, totalPages));

	function resetFilters() {
		crmStore.filters.search = '';
		crmStore.filters.status = 'all';
		crmStore.filters.priority = 'all';
		crmStore.filters.city = 'all';
		crmStore.filters.category = 'all';
		crmStore.filters.hasWebsite = 'all';
		crmStore.filters.hasPhone = 'all';
		currentPage = 1;
	}

	function openWhatsApp(lead: ClientLead, e: MouseEvent) {
		e.stopPropagation();
		const defaultTemplate = WHATSAPP_TEMPLATES[0];
		const text = defaultTemplate.getText(lead.title, lead.categoryName, lead.city || 'Angola');
		const url = generateWhatsAppLink(lead.phone, text);
		if (url) {
			window.open(url, '_blank');
			crmStore.addNote(lead.id, `Contacto via WhatsApp realizado.`, 'whatsapp');
		} else {
			toast.error('Contacto Indisponível', `A empresa "${lead.title}" não possui número de telefone registado.`);
		}
	}
</script>

<div class="space-y-4 pb-12">
	
	<!-- Filter Controls -->
	<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
		<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
			
			<!-- Search Bar -->
			<div class="relative flex-1">
				<Icon name="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
				<input
					type="text"
					bind:value={crmStore.filters.search}
					placeholder="Buscar por empresa, setor, endereço, telefone ou cidade..."
					class="w-full rounded-md bg-zinc-950 border border-zinc-800 pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
				/>
			</div>

			<!-- Summary & Actions -->
			<div class="flex flex-wrap items-center justify-between lg:justify-end gap-3 text-xs">
				{#if crmStore.stats.missingPhoneCount > 0}
					<button
						type="button"
						onclick={() => crmStore.isPurgeModalOpen = true}
						class="flex items-center gap-1.5 rounded-md border border-rose-900/50 bg-rose-950/20 px-2.5 py-1 text-xs font-medium text-rose-400 hover:bg-rose-900/40 hover:text-rose-200 transition-colors cursor-pointer"
						title="Rever e excluir empresas sem número de telefone"
					>
						<Icon name="trash" class="w-3.5 h-3.5" />
						<span>Excluir Sem Telefone ({crmStore.stats.missingPhoneCount})</span>
					</button>
				{/if}

				<span class="text-zinc-400">
					A exibir <strong class="text-zinc-200 font-mono">{crmStore.filteredLeads.length}</strong> de <strong class="text-zinc-200 font-mono">{crmStore.leads.length}</strong> contas
				</span>
				<button
					type="button"
					onclick={resetFilters}
					class="text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
				>
					Limpar Filtros
				</button>
			</div>
		</div>

		<!-- Dropdowns Grid -->
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2 border-t border-zinc-800/60">
			<!-- Status -->
			<div>
				<label for="filter-status" class="block text-[10px] font-medium text-zinc-400 mb-1">Estágio</label>
				<select
					id="filter-status"
					bind:value={crmStore.filters.status}
					class="w-full rounded-md bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-300 focus:border-zinc-600 focus:outline-none"
				>
					<option value="all">Todos os Estágios</option>
					<option value="lead">Novo Lead</option>
					<option value="contacted">Em Contacto</option>
					<option value="meeting">Qualificação</option>
					<option value="proposal">Proposta</option>
					<option value="won">Fechado</option>
					<option value="lost">Desqualificado</option>
				</select>
			</div>

			<!-- Priority -->
			<div>
				<label for="filter-priority" class="block text-[10px] font-medium text-zinc-400 mb-1">Prioridade</label>
				<select
					id="filter-priority"
					bind:value={crmStore.filters.priority}
					class="w-full rounded-md bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-300 focus:border-zinc-600 focus:outline-none"
				>
					<option value="all">Todas as Prioridades</option>
					<option value="hot">Alta</option>
					<option value="warm">Média</option>
					<option value="cold">Baixa</option>
				</select>
			</div>

			<!-- City -->
			<div>
				<label for="filter-city" class="block text-[10px] font-medium text-zinc-400 mb-1">Região</label>
				<select
					id="filter-city"
					bind:value={crmStore.filters.city}
					class="w-full rounded-md bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-300 focus:border-zinc-600 focus:outline-none"
				>
					<option value="all">Todas as Regiões</option>
					{#each crmStore.availableCities as city}
						<option value={city}>{city}</option>
					{/each}
				</select>
			</div>

			<!-- Category -->
			<div>
				<label for="filter-category" class="block text-[10px] font-medium text-zinc-400 mb-1">Setor</label>
				<select
					id="filter-category"
					bind:value={crmStore.filters.category}
					class="w-full rounded-md bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-300 focus:border-zinc-600 focus:outline-none truncate"
				>
					<option value="all">Todos os Setores</option>
					{#each crmStore.availableCategories as cat}
						<option value={cat}>{cat}</option>
					{/each}
				</select>
			</div>

			<!-- Has Website -->
			<div>
				<label for="filter-website" class="block text-[10px] font-medium text-zinc-400 mb-1">Website</label>
				<select
					id="filter-website"
					bind:value={crmStore.filters.hasWebsite}
					class="w-full rounded-md bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-300 focus:border-zinc-600 focus:outline-none"
				>
					<option value="all">Todos</option>
					<option value="no">Sem Website</option>
					<option value="yes">Com Website</option>
				</select>
			</div>

			<!-- Sort -->
			<div>
				<label for="filter-sort" class="block text-[10px] font-medium text-zinc-400 mb-1">Ordenação</label>
				<select
					id="filter-sort"
					bind:value={crmStore.filters.sortBy}
					class="w-full rounded-md bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-300 focus:border-zinc-600 focus:outline-none"
				>
					<option value="title">Nome da Empresa</option>
					<option value="city">Cidade</option>
					<option value="estimatedValue">Valor Estimado</option>
					<option value="priority">Prioridade</option>
					<option value="status">Estágio</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Data Table Container -->
	<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs text-zinc-300">
				<thead class="bg-zinc-950 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
					<tr>
						<th scope="col" class="px-4 py-3">Empresa & Setor</th>
						<th scope="col" class="px-4 py-3">Região</th>
						<th scope="col" class="px-4 py-3">Contacto</th>
						<th scope="col" class="px-4 py-3">Estágio</th>
						<th scope="col" class="px-4 py-3">Prioridade</th>
						<th scope="col" class="px-4 py-3">Valor Estimado</th>
						<th scope="col" class="px-4 py-3 text-right">Ação</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-zinc-800/70">
					{#each paginatedLeads as lead (lead.id)}
						<tr
							onclick={() => crmStore.selectLead(lead)}
							class="hover:bg-zinc-800/30 transition-colors cursor-pointer group"
						>
							<!-- Title & Sector -->
							<td class="px-4 py-3 max-w-xs">
								<div class="font-semibold text-zinc-100 group-hover:text-white transition-colors line-clamp-1">
									{lead.title}
								</div>
								<div class="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
									{lead.categoryName}
								</div>
							</td>

							<!-- Location -->
							<td class="px-4 py-3 whitespace-nowrap">
								<div class="flex items-center gap-1.5 text-zinc-200">
									<Icon name="location" class="w-3.5 h-3.5 text-zinc-500" />
									<span>{lead.city || 'Angola'}</span>
								</div>
							</td>

							<!-- Contacts & Web -->
							<td class="px-4 py-3">
								<div class="space-y-1">
									{#if lead.phone}
										<div class="flex items-center gap-2">
											<span class="font-mono text-zinc-300 text-[11px]">{lead.phone}</span>
											<button
												type="button"
												onclick={(e) => openWhatsApp(lead, e)}
												title="Enviar WhatsApp"
												class="text-zinc-400 hover:text-emerald-400 cursor-pointer p-0.5 transition-colors"
											>
												<Icon name="whatsapp" class="w-3.5 h-3.5" />
											</button>
										</div>
									{:else}
										<span class="text-[11px] text-zinc-500">Sem telefone</span>
									{/if}

									{#if lead.website}
										<a
											href={lead.website}
											target="_blank"
											rel="noopener noreferrer"
											onclick={(e) => e.stopPropagation()}
											class="inline-flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 hover:underline"
										>
											<Icon name="globe" class="w-3 h-3" />
											<span>Website</span>
										</a>
									{:else}
										<span class="inline-block rounded bg-zinc-800 px-1.5 py-0.2 text-[9px] text-zinc-400 border border-zinc-700/60">
											Sem Site
										</span>
									{/if}
								</div>
							</td>

							<!-- Status Dropdown -->
							<td class="px-4 py-3 whitespace-nowrap" onclick={(e) => e.stopPropagation()}>
								<select
									value={lead.status}
									onchange={(e) => crmStore.updateStatus(lead.id, (e.target as HTMLSelectElement).value as LeadStatus)}
									class="rounded-md bg-zinc-950 border border-zinc-800 px-2 py-1 text-[11px] font-medium text-zinc-200 focus:border-zinc-600 focus:outline-none cursor-pointer"
								>
									<option value="lead">Novo Lead</option>
									<option value="contacted">Em Contacto</option>
									<option value="meeting">Qualificação</option>
									<option value="proposal">Proposta</option>
									<option value="won">Fechado</option>
									<option value="lost">Desqualificado</option>
								</select>
							</td>

							<!-- Priority -->
							<td class="px-4 py-3 whitespace-nowrap">
								<PriorityBadge priority={lead.priority} size="sm" />
							</td>

							<!-- Value -->
							<td class="px-4 py-3 whitespace-nowrap font-mono text-zinc-200">
								{formatKz(lead.estimatedValue)}
							</td>

							<!-- Actions -->
							<td class="px-4 py-3 text-right whitespace-nowrap">
								<button
									type="button"
									onclick={() => crmStore.selectLead(lead)}
									class="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer text-xs"
								>
									Ver Ficha
								</button>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="7" class="px-4 py-12 text-center text-zinc-400">
								<p class="text-sm">Nenhuma empresa encontrada com os filtros selecionados.</p>
								<button
									type="button"
									onclick={resetFilters}
									class="mt-2 text-xs font-semibold text-zinc-300 hover:underline cursor-pointer"
								>
									Limpar filtros
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Comprehensive Pagination Footer -->
		{#if totalFiltered > 0}
			<div class="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-zinc-950 border-t border-zinc-800 text-xs">
				<!-- Left: Range Info & Items Per Page -->
				<div class="flex flex-wrap items-center gap-3 text-zinc-400">
					<div>
						A mostrar <strong class="text-zinc-200 font-mono">{startIndex} - {endIndex}</strong> de <strong class="text-zinc-200 font-mono">{totalFiltered}</strong> contas
					</div>

					<div class="flex items-center gap-1.5 border-l border-zinc-800 pl-3">
						<label for="items-per-page" class="text-zinc-400 text-xs whitespace-nowrap">Por página:</label>
						<select
							id="items-per-page"
							bind:value={itemsPerPage}
							onchange={() => currentPage = 1}
							class="rounded-md bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs font-mono text-zinc-200 focus:border-zinc-600 focus:outline-none cursor-pointer"
						>
							<option value={10}>10</option>
							<option value={20}>20</option>
							<option value={50}>50</option>
							<option value={100}>100</option>
							<option value={500}>Todas ({totalFiltered})</option>
						</select>
					</div>
				</div>

				<!-- Right: Navigation Buttons, Page Pills, and Quick Jump -->
				<div class="flex items-center gap-1.5">
					<!-- First Page (<<) -->
					<button
						type="button"
						title="Primeira página (1)"
						disabled={currentPage === 1}
						onclick={() => goToPage(1)}
						class="flex items-center justify-center w-7 h-7 rounded border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
					>
						<Icon name="chevrons-left" class="w-3.5 h-3.5" />
					</button>

					<!-- Prev Page (<) -->
					<button
						type="button"
						title="Página anterior"
						disabled={currentPage === 1}
						onclick={() => goToPage(currentPage - 1)}
						class="flex items-center justify-center w-7 h-7 rounded border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
					>
						<Icon name="chevron-left" class="w-3.5 h-3.5" />
					</button>

					<!-- Numbered Page Pills (Desktop/Tablet) -->
					<div class="hidden sm:flex items-center gap-1">
						{#each paginationRange as p}
							{#if p === '...'}
								<span class="px-1 text-zinc-600 select-none">...</span>
							{:else}
								<button
									type="button"
									onclick={() => goToPage(p as number)}
									class="min-w-[28px] h-7 px-1.5 flex items-center justify-center rounded text-xs font-mono transition-colors cursor-pointer {currentPage === p ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm' : 'bg-zinc-900 border border-zinc-800/80 text-zinc-300 hover:bg-zinc-800 hover:text-white'}"
								>
									{p}
								</button>
							{/if}
						{/each}
					</div>

					<!-- Mobile Page Indicator -->
					<span class="sm:hidden text-xs font-mono text-zinc-300 px-1">
						{currentPage} / {totalPages}
					</span>

					<!-- Next Page (>) -->
					<button
						type="button"
						title="Página seguinte"
						disabled={currentPage === totalPages}
						onclick={() => goToPage(currentPage + 1)}
						class="flex items-center justify-center w-7 h-7 rounded border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
					>
						<Icon name="chevron-right" class="w-3.5 h-3.5" />
					</button>

					<!-- Last Page (>>) -->
					<button
						type="button"
						title="Última página ({totalPages})"
						disabled={currentPage === totalPages}
						onclick={() => goToPage(totalPages)}
						class="flex items-center justify-center w-7 h-7 rounded border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
					>
						<Icon name="chevrons-right" class="w-3.5 h-3.5" />
					</button>

					<!-- Direct Jump Input (Desktop) -->
					{#if totalPages > 3}
						<form onsubmit={handleJumpSubmit} class="hidden md:flex items-center gap-1 pl-2 border-l border-zinc-800">
							<label for="jump-page" class="text-zinc-500 text-[11px]">Ir para:</label>
							<input
								id="jump-page"
								type="number"
								min="1"
								max={totalPages}
								placeholder={String(currentPage)}
								bind:value={jumpInput}
								class="w-11 rounded bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 text-center text-xs font-mono text-zinc-200 focus:border-zinc-600 focus:outline-none"
							/>
						</form>
					{/if}
				</div>
			</div>
		{/if}
	</div>

</div>
