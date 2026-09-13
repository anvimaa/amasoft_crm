<script lang="ts">
	import { crmStore } from '../stores/crm.svelte';
	import Icon from './Icon.svelte';
	import PriorityBadge from './PriorityBadge.svelte';
	import type { ClientLead, LeadStatus } from '../types/crm';
	import { generateWhatsAppLink, WHATSAPP_TEMPLATES } from '../utils/whatsapp';
	import { toast } from '../stores/toast.svelte';

	function formatKz(value: number): string {
		return new Intl.NumberFormat('pt-AO', {
			maximumFractionDigits: 0
		}).format(value) + ' Kz';
	}

	const columns: { id: LeadStatus; title: string; dot: string }[] = [
		{ id: 'lead', title: 'Novos Leads', dot: 'bg-blue-400' },
		{ id: 'contacted', title: 'Em Contacto', dot: 'bg-amber-400' },
		{ id: 'meeting', title: 'Qualificação', dot: 'bg-indigo-400' },
		{ id: 'proposal', title: 'Proposta Enviada', dot: 'bg-sky-400' },
		{ id: 'won', title: 'Fechados', dot: 'bg-emerald-400' },
		{ id: 'lost', title: 'Desqualificados', dot: 'bg-zinc-500' }
	];

	let draggedLeadId = $state<string | null>(null);

	function handleDragStart(e: DragEvent, leadId: string) {
		draggedLeadId = leadId;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', leadId);
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'move';
		}
	}

	function handleDrop(e: DragEvent, targetStatus: LeadStatus) {
		e.preventDefault();
		const leadId = draggedLeadId || e.dataTransfer?.getData('text/plain');
		if (leadId) {
			crmStore.updateStatus(leadId, targetStatus);
		}
		draggedLeadId = null;
	}

	function openWhatsApp(lead: ClientLead, e: MouseEvent) {
		e.stopPropagation();
		const defaultTemplate = WHATSAPP_TEMPLATES[0];
		const text = defaultTemplate.getText(lead.title, lead.categoryName, lead.city || 'Angola');
		const url = generateWhatsAppLink(lead.phone, text);
		if (url) {
			window.open(url, '_blank');
			crmStore.addNote(lead.id, `Contacto via WhatsApp realizado com base no modelo "${defaultTemplate.title}".`, 'whatsapp');
		} else {
			toast.error('Contacto Indisponível', `A empresa "${lead.title}" não possui número de telefone.`);
		}
	}
</script>

<div class="space-y-4 pb-12">
	<!-- Control Bar -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/40 p-3.5 rounded-xl border border-zinc-800">
		<div class="flex items-center gap-3">
			<div class="relative flex-1 sm:w-80">
				<Icon name="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
				<input
					type="text"
					bind:value={crmStore.filters.search}
					placeholder="Filtrar contas no pipeline..."
					class="w-full rounded-md bg-zinc-950 border border-zinc-800 pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
				/>
			</div>

			<!-- City Quick Filter -->
			<select
				bind:value={crmStore.filters.city}
				class="rounded-md bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-300 focus:border-zinc-600 focus:outline-none"
			>
				<option value="all">Todas as Regiões</option>
				{#each crmStore.availableCities as city}
					<option value={city}>{city}</option>
				{/each}
			</select>
		</div>

		<div class="text-xs text-zinc-400 font-mono">
			Total em Pipeline: <span class="text-zinc-200 font-semibold">{formatKz(crmStore.stats.totalPipelineValue)}</span>
		</div>
	</div>

	<!-- Kanban Columns Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start">
		{#each columns as col}
			{@const colLeads = crmStore.filteredLeads.filter(l => l.status === col.id)}
			{@const colValue = colLeads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0)}

			<div
				class="flex flex-col rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-2.5 min-h-[520px]"
				ondragover={handleDragOver}
				ondrop={(e) => handleDrop(e, col.id)}
				role="region"
				aria-label={col.title}
			>
				<!-- Column Header -->
				<div class="flex items-center justify-between pb-2.5 border-b border-zinc-800/60 mb-2">
					<div class="flex items-center gap-1.5">
						<span class="w-2 h-2 rounded-full {col.dot}"></span>
						<h3 class="text-xs font-semibold text-zinc-200 tracking-tight">{col.title}</h3>
					</div>
					<span class="rounded bg-zinc-800 px-1.5 py-0.2 text-[10px] font-mono text-zinc-400 border border-zinc-700/40">
						{colLeads.length}
					</span>
				</div>

				<!-- Column Value Header -->
				<div class="text-[10px] text-zinc-500 mb-2 font-mono">
					{formatKz(colValue)}
				</div>

				<!-- Cards List -->
				<div class="space-y-2 flex-1 overflow-y-auto max-h-[calc(100vh-270px)] pr-0.5">
					{#each colLeads as lead (lead.id)}
						<div
							draggable="true"
							ondragstart={(e) => handleDragStart(e, lead.id)}
							onclick={() => crmStore.selectLead(lead)}
							role="button"
							tabindex="0"
							onkeydown={(e) => e.key === 'Enter' && crmStore.selectLead(lead)}
							class="group relative text-left rounded-lg border border-zinc-800 bg-zinc-900/90 p-3 shadow-sm hover:border-zinc-700 hover:bg-zinc-900 transition-all cursor-pointer select-none"
						>
							<!-- Title & Priority -->
							<div class="flex items-start justify-between gap-1.5 mb-1.5">
								<h4 class="text-xs font-semibold text-zinc-100 group-hover:text-white transition-colors line-clamp-2 leading-snug">
									{lead.title}
								</h4>
								<PriorityBadge priority={lead.priority} size="sm" />
							</div>

							<!-- Sector & City -->
							<div class="text-[11px] text-zinc-400 space-y-0.5 mb-2.5">
								<p class="truncate text-zinc-300">{lead.categoryName}</p>
								<p class="flex items-center gap-1 text-[10px] text-zinc-500">
									<Icon name="location" class="w-3 h-3 text-zinc-500" />
									{lead.city || 'Angola'}
								</p>
							</div>

							<!-- Metadata Badges -->
							<div class="flex flex-wrap items-center gap-1 mb-2.5">
								{#if !lead.website}
									<span class="rounded bg-zinc-800/90 px-1.5 py-0.2 text-[9px] text-zinc-400 border border-zinc-700/60">
										Sem Website
									</span>
								{/if}

								<span class="rounded bg-zinc-800 px-1.5 py-0.2 text-[9px] font-mono text-zinc-300">
									{formatKz(lead.estimatedValue)}
								</span>
							</div>

							<!-- Card Footer -->
							<div class="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-500">
								<span>{lead.notes.length} {lead.notes.length === 1 ? 'registo' : 'registos'}</span>

								{#if lead.phone}
									<button
										type="button"
										onclick={(e) => openWhatsApp(lead, e)}
										title="Contacto via WhatsApp"
										class="flex items-center gap-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-2 py-0.5 border border-zinc-700/60 transition-colors cursor-pointer"
									>
										<Icon name="whatsapp" class="w-3 h-3 text-emerald-400" />
										<span>WhatsApp</span>
									</button>
								{/if}
							</div>
						</div>
					{:else}
						<div class="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800/80 p-5 text-center text-[11px] text-zinc-500">
							<span>Vazio</span>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>
