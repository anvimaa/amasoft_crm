<script lang="ts">
	import { crmStore } from '../stores/crm.svelte';
	import Icon from './Icon.svelte';
	import StatusBadge from './StatusBadge.svelte';
	import PriorityBadge from './PriorityBadge.svelte';
	import type { ClientLead } from '../types/crm';

	let selectedCity = $state<string>('all');
	let mapSearch = $state<string>('');

	let filteredCityLeads = $derived.by(() => {
		let list = crmStore.leads;
		if (selectedCity !== 'all') {
			list = list.filter(l => (l.city || '').toLowerCase() === selectedCity.toLowerCase());
		}
		if (mapSearch.trim()) {
			const q = mapSearch.toLowerCase().trim();
			list = list.filter(l => 
				l.title.toLowerCase().includes(q) ||
				l.categoryName.toLowerCase().includes(q) ||
				(l.address && l.address.toLowerCase().includes(q))
			);
		}
		return list;
	});

	function openGoogleMaps(lead: ClientLead) {
		let url = '';
		if (lead.location?.lat && lead.location?.lng) {
			url = `https://www.google.com/maps/search/?api=1&query=${lead.location.lat},${lead.location.lng}`;
		} else if (lead.address) {
			url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.address)}`;
		}
		if (url) {
			window.open(url, '_blank');
		}
	}
</script>

<div class="space-y-6 pb-12">
	
	<!-- Map Header -->
	<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
		<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
			<div>
				<h2 class="text-base font-semibold text-zinc-100">Distribuição Territorial em Angola</h2>
				<p class="text-xs text-zinc-400">Visualização geográfica e rotas para visitas comerciais</p>
			</div>

			<!-- Search -->
			<div class="flex items-center gap-2">
				<div class="relative w-full sm:w-64">
					<Icon name="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
					<input
						type="text"
						bind:value={mapSearch}
						placeholder="Buscar nesta região..."
						class="w-full rounded-md bg-zinc-950 border border-zinc-800 pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
					/>
				</div>
			</div>
		</div>

		<!-- Regional Pills -->
		<div class="flex flex-wrap gap-1.5 pt-3.5 mt-3.5 border-t border-zinc-800/60">
			<button
				type="button"
				onclick={() => selectedCity = 'all'}
				class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer {selectedCity === 'all' ? 'bg-zinc-200 text-zinc-950' : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'}"
			>
				Todas as Regiões ({crmStore.leads.length})
			</button>
			{#each crmStore.stats.topCities as c}
				<button
					type="button"
					onclick={() => selectedCity = c.city}
					class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer {selectedCity === c.city ? 'bg-zinc-200 text-zinc-950' : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'}"
				>
					{c.city} ({c.count})
				</button>
			{/each}
		</div>
	</div>

	<!-- Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
		
		<!-- Left: Hubs List -->
		<div class="lg:col-span-1 space-y-3">
			<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
				<h3 class="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
					Polos Comerciais
				</h3>
				
				<div class="space-y-1.5">
					{#each crmStore.stats.topCities as cityData}
						<button
							type="button"
							onclick={() => selectedCity = cityData.city}
							class="w-full flex items-center justify-between p-2.5 rounded-lg border border-zinc-800/60 bg-zinc-950/40 hover:bg-zinc-800/40 transition-colors text-left cursor-pointer {selectedCity === cityData.city ? 'border-zinc-500 bg-zinc-900' : ''}"
						>
							<div>
								<div class="text-xs font-semibold text-zinc-200">{cityData.city}</div>
								<div class="text-[10px] text-zinc-500 mt-0.5">
									{crmStore.leads.filter(l => l.city === cityData.city && !l.website).length} sem website
								</div>
							</div>
							
							<span class="rounded bg-zinc-800 px-2 py-0.5 text-xs font-mono text-zinc-300">
								{cityData.count}
							</span>
						</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- Right: Cards Grid -->
		<div class="lg:col-span-2 space-y-3">
			<div class="flex items-center justify-between">
				<h3 class="text-xs font-semibold text-zinc-300">
					Contas Mapeadas {selectedCity !== 'all' ? `em ${selectedCity}` : 'em Angola'} ({filteredCityLeads.length})
				</h3>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[700px] overflow-y-auto pr-1">
				{#each filteredCityLeads as lead (lead.id)}
					<div class="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 hover:border-zinc-700 transition-colors">
						<div class="space-y-2">
							<div class="flex items-start justify-between gap-2">
								<h4 class="text-xs font-semibold text-zinc-100 line-clamp-1">{lead.title}</h4>
								<PriorityBadge priority={lead.priority} size="sm" />
							</div>

							<p class="text-[11px] text-zinc-400">{lead.categoryName}</p>

							{#if lead.address}
								<p class="text-[11px] text-zinc-400 flex items-start gap-1.5 line-clamp-2">
									<Icon name="location" class="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
									<span>{lead.address}</span>
								</p>
							{/if}

							{#if lead.location?.lat && lead.location?.lng}
								<div class="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 bg-zinc-950 px-2 py-1 rounded border border-zinc-800/60">
									<span>GPS: {lead.location.lat.toFixed(4)}, {lead.location.lng.toFixed(4)}</span>
								</div>
							{/if}
						</div>

						<div class="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
							<StatusBadge status={lead.status} size="sm" />

							<div class="flex items-center gap-1.5">
								<button
									type="button"
									onclick={() => openGoogleMaps(lead)}
									class="flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer border border-zinc-700/60"
									title="Abrir no Google Maps"
								>
									<Icon name="external" class="w-3 h-3" />
									<span>Maps</span>
								</button>

								<button
									type="button"
									onclick={() => crmStore.selectLead(lead)}
									class="rounded bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-950 hover:bg-white transition-colors cursor-pointer"
								>
									Ficha
								</button>
							</div>
						</div>
					</div>
				{:else}
					<div class="col-span-2 rounded-xl border border-dashed border-zinc-800 p-8 text-center text-xs text-zinc-500">
						Nenhuma empresa encontrada nesta região.
					</div>
				{/each}
			</div>
		</div>

	</div>

</div>
