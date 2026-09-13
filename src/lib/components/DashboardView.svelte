<script lang="ts">
	import { crmStore } from '../stores/crm.svelte';
	import Icon from './Icon.svelte';
	import StatusBadge from './StatusBadge.svelte';
	import PriorityBadge from './PriorityBadge.svelte';
	import type { LeadStatus } from '../types/crm';

	function formatKz(value: number): string {
		return new Intl.NumberFormat('pt-AO', {
			maximumFractionDigits: 0
		}).format(value) + ' Kz';
	}

	const stageOrder: { key: LeadStatus; label: string; color: string }[] = [
		{ key: 'lead', label: 'Novo Lead', color: 'bg-zinc-400' },
		{ key: 'contacted', label: 'Em Contacto', color: 'bg-amber-400' },
		{ key: 'meeting', label: 'Qualificação', color: 'bg-indigo-400' },
		{ key: 'proposal', label: 'Proposta Enviada', color: 'bg-sky-400' },
		{ key: 'won', label: 'Fechado', color: 'bg-emerald-400' },
		{ key: 'lost', label: 'Desqualificado', color: 'bg-zinc-600' }
	];

	function filterByPreset(type: 'no-website' | 'hot' | 'city' | 'status', value?: string) {
		crmStore.filters.search = '';
		if (type === 'no-website') {
			crmStore.filters.hasWebsite = 'no';
			crmStore.filters.priority = 'all';
			crmStore.filters.status = 'all';
			crmStore.filters.city = 'all';
		} else if (type === 'hot') {
			crmStore.filters.priority = 'hot';
			crmStore.filters.hasWebsite = 'all';
			crmStore.filters.status = 'all';
			crmStore.filters.city = 'all';
		} else if (type === 'city' && value) {
			crmStore.filters.city = value;
			crmStore.filters.hasWebsite = 'all';
			crmStore.filters.priority = 'all';
			crmStore.filters.status = 'all';
		} else if (type === 'status' && value) {
			crmStore.filters.status = value as LeadStatus;
			crmStore.filters.hasWebsite = 'all';
			crmStore.filters.priority = 'all';
			crmStore.filters.city = 'all';
		}
		crmStore.activeView = 'table';
	}
</script>

<div class="space-y-6 pb-12">
	
	<!-- Top Strategic Context Card -->
	<div class="rounded-xl bg-zinc-900/60 border border-zinc-800 p-5">
		<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
			<div class="space-y-1">
				<div class="flex items-center gap-2">
					<span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Diagnóstico de Base</span>
				</div>
				<h1 class="text-base sm:text-lg font-semibold text-zinc-100">
					{crmStore.stats.missingWebsiteCount} empresas sem website registrado ({((crmStore.stats.missingWebsiteCount / crmStore.stats.totalLeads) * 100).toFixed(0)}% da base)
				</h1>
				<p class="text-xs text-zinc-400">
					Segmento prioritário para prospecção de desenvolvimento web, plataformas de catálogo e software de faturação e gestão.
				</p>
			</div>
			
			<div class="flex flex-wrap items-center gap-2.5">
				{#if crmStore.stats.missingPhoneCount > 0}
					<button
						type="button"
						onclick={() => crmStore.isPurgeModalOpen = true}
						class="flex items-center gap-1.5 rounded-lg border border-rose-900/50 bg-rose-950/20 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-900/40 hover:text-rose-200 transition-colors cursor-pointer"
						title="Rever e remover empresas sem telefone do CRM"
					>
						<Icon name="trash" class="w-3.5 h-3.5" />
						<span>Excluir Sem Contacto ({crmStore.stats.missingPhoneCount})</span>
					</button>
				{/if}

				<button
					type="button"
					onclick={() => filterByPreset('no-website')}
					class="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer"
				>
					<Icon name="globe" class="w-3.5 h-3.5 text-zinc-400" />
					<span>Sem Website ({crmStore.stats.missingWebsiteCount})</span>
				</button>
				<button
					type="button"
					onclick={() => filterByPreset('hot')}
					class="flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-950 hover:bg-white transition-colors cursor-pointer"
				>
					<Icon name="fire" class="w-3.5 h-3.5 text-zinc-900" />
					<span>Prioridade Alta ({crmStore.stats.byPriority.hot})</span>
				</button>
			</div>
		</div>
	</div>

	<!-- 4 Key Metrics Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		
		<!-- Metric 1: Total Leads -->
		<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
			<div class="flex items-center justify-between">
				<span class="text-xs font-medium text-zinc-400">Total de Contas Mapeadas</span>
				<Icon name="building" class="w-4 h-4 text-zinc-500" />
			</div>
			<div class="mt-2.5 flex items-baseline gap-2">
				<span class="text-2xl font-semibold tracking-tight text-zinc-100 font-mono">{crmStore.stats.totalLeads}</span>
				<span class="text-xs text-zinc-500">empresas</span>
			</div>
			<div class="mt-2 text-[11px] text-zinc-400">
				<strong class="text-zinc-200 font-mono">{crmStore.stats.withPhoneCount}</strong> com contacto telefónico verificado
			</div>
		</div>

		<!-- Metric 2: Pipeline Value -->
		<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
			<div class="flex items-center justify-between">
				<span class="text-xs font-medium text-zinc-400">Volume Total em Pipeline</span>
				<Icon name="money" class="w-4 h-4 text-zinc-500" />
			</div>
			<div class="mt-2.5 flex items-baseline gap-2">
				<span class="text-2xl font-semibold tracking-tight text-zinc-100 font-mono">
					{formatKz(crmStore.stats.totalPipelineValue)}
				</span>
			</div>
			<div class="mt-2 text-[11px] text-zinc-400">
				<span>Receita fechada:</span>
				<strong class="text-emerald-400 font-mono ml-1">{formatKz(crmStore.stats.wonPipelineValue)}</strong>
			</div>
		</div>

		<!-- Metric 3: Conversion Rate -->
		<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
			<div class="flex items-center justify-between">
				<span class="text-xs font-medium text-zinc-400">Taxa de Conversão</span>
				<Icon name="chart" class="w-4 h-4 text-zinc-500" />
			</div>
			<div class="mt-2.5 flex items-baseline gap-2">
				<span class="text-2xl font-semibold tracking-tight text-zinc-100 font-mono">
					{crmStore.stats.conversionRate.toFixed(1)}%
				</span>
				<span class="text-xs text-zinc-400">({crmStore.stats.byStatus.won} fechados)</span>
			</div>
			<div class="mt-2 text-[11px] text-zinc-400">
				<span class="text-zinc-300 font-mono">{crmStore.stats.byStatus.proposal}</span> propostas sob análise comercial
			</div>
		</div>

		<!-- Metric 4: High Priority Leads -->
		<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
			<div class="flex items-center justify-between">
				<span class="text-xs font-medium text-zinc-400">Contas de Alta Prioridade</span>
				<Icon name="fire" class="w-4 h-4 text-zinc-500" />
			</div>
			<div class="mt-2.5 flex items-baseline gap-2">
				<span class="text-2xl font-semibold tracking-tight text-zinc-100 font-mono">
					{crmStore.stats.byPriority.hot}
				</span>
				<span class="text-xs text-zinc-500">leads</span>
			</div>
			<div class="mt-2 text-[11px] text-zinc-400 flex items-center gap-1.5">
				<span>{crmStore.stats.byPriority.warm} média prioridade,</span>
				<span>{crmStore.stats.byPriority.cold} baixa</span>
			</div>
		</div>

	</div>

	<!-- Pipeline Funnel -->
	<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
		<div class="flex items-center justify-between mb-4">
			<div>
				<h2 class="text-sm font-semibold text-zinc-100">Distribuição por Estágio Comercial</h2>
				<p class="text-xs text-zinc-400">Visão consolidada das etapas do funil</p>
			</div>
			<button
				type="button"
				onclick={() => crmStore.activeView = 'kanban'}
				class="text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer"
			>
				Ver Pipeline
				<Icon name="chevron-right" class="w-3.5 h-3.5 text-zinc-400" />
			</button>
		</div>

		<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
			{#each stageOrder as stage}
				{@const count = crmStore.stats.byStatus[stage.key]}
				{@const pct = ((count / crmStore.stats.totalLeads) * 100).toFixed(0)}
				
				<button
					type="button"
					onclick={() => filterByPreset('status', stage.key)}
					class="group flex flex-col text-left rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all cursor-pointer"
				>
					<div class="flex items-center justify-between w-full mb-2">
						<span class="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200 truncate">{stage.label}</span>
						<span class="text-xs font-semibold text-zinc-100 font-mono ml-1">{count}</span>
					</div>
					
					<!-- Progress Bar -->
					<div class="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden mb-1.5">
						<div class="h-full rounded-full {stage.color} transition-all duration-300" style="width: {Math.max(Number(pct), 4)}%"></div>
					</div>

					<div class="text-[10px] text-zinc-500 font-mono">
						{pct}%
					</div>
				</button>
			{/each}
		</div>
	</div>

	<!-- Two Column Breakdown -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		
		<!-- Left: Cities -->
		<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
			<div class="flex items-center justify-between mb-4">
				<div>
					<h3 class="text-sm font-semibold text-zinc-100">Distribuição Regional</h3>
					<p class="text-xs text-zinc-400">Concentração de empresas por província / cidade</p>
				</div>
				<button
					type="button"
					onclick={() => crmStore.activeView = 'map'}
					class="text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer"
				>
					Mapa
					<Icon name="chevron-right" class="w-3.5 h-3.5 text-zinc-400" />
				</button>
			</div>

			<div class="space-y-2.5">
				{#each crmStore.stats.topCities as item}
					{@const pct = ((item.count / crmStore.stats.totalLeads) * 100).toFixed(0)}
					<button
						type="button"
						onclick={() => filterByPreset('city', item.city)}
						class="w-full text-left group flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800/50 transition-colors cursor-pointer"
					>
						<div class="flex items-center gap-2 min-w-[120px]">
							<Icon name="location" class="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300" />
							<span class="text-xs text-zinc-300 group-hover:text-white font-medium">{item.city}</span>
						</div>

						<div class="flex-1 mx-4">
							<div class="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
								<div class="h-full rounded-full bg-zinc-400" style="width: {pct}%"></div>
							</div>
						</div>

						<div class="text-right min-w-[60px] font-mono">
							<span class="text-xs font-semibold text-zinc-200">{item.count}</span>
							<span class="text-[10px] text-zinc-500 ml-1">({pct}%)</span>
						</div>
					</button>
				{/each}
			</div>
		</div>

		<!-- Right: Categories -->
		<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
			<div class="flex items-center justify-between mb-4">
				<div>
					<h3 class="text-sm font-semibold text-zinc-100">Setores de Atividade</h3>
					<p class="text-xs text-zinc-400">Classificação por segmento comercial</p>
				</div>
			</div>

			<div class="space-y-2.5">
				{#each crmStore.stats.topCategories as item}
					{@const pct = ((item.count / crmStore.stats.totalLeads) * 100).toFixed(0)}
					<div class="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800/30 transition-colors">
						<div class="flex items-center gap-2 min-w-[160px] truncate">
							<Icon name="tag" class="w-3.5 h-3.5 text-zinc-500" />
							<span class="text-xs text-zinc-300 truncate" title={item.category}>{item.category}</span>
						</div>

						<div class="flex-1 mx-4">
							<div class="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
								<div class="h-full rounded-full bg-zinc-400" style="width: {pct}%"></div>
							</div>
						</div>

						<div class="text-right min-w-[60px] font-mono">
							<span class="text-xs font-semibold text-zinc-200">{item.count}</span>
							<span class="text-[10px] text-zinc-500 ml-1">({pct}%)</span>
						</div>
					</div>
				{/each}
			</div>
		</div>

	</div>

	<!-- High Priority Accounts Table Snippet -->
	<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
		<div class="flex items-center justify-between mb-4">
			<div>
				<h3 class="text-sm font-semibold text-zinc-100">Contas Prioritárias para Abordagem</h3>
				<p class="text-xs text-zinc-400">Empresas com contacto verificado e ausência de presença digital</p>
			</div>
			<button
				type="button"
				onclick={() => filterByPreset('hot')}
				class="text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer"
			>
				Ver Todas ({crmStore.stats.byPriority.hot})
				<Icon name="arrow-right" class="w-3.5 h-3.5 text-zinc-400" />
			</button>
		</div>

		<div class="divide-y divide-zinc-800/80">
			{#each crmStore.leads.filter(l => l.priority === 'hot' && l.phone).slice(0, 5) as lead}
				<div class="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-800/20 px-2 rounded-lg transition-colors">
					<div class="space-y-1">
						<div class="flex items-center gap-2">
							<span class="text-xs font-semibold text-zinc-100">{lead.title}</span>
							<PriorityBadge priority={lead.priority} size="sm" />
							{#if !lead.website}
								<span class="rounded bg-zinc-800 px-1.5 py-0.2 text-[10px] text-zinc-400 border border-zinc-700/60">
									Sem Site
								</span>
							{/if}
						</div>
						<div class="text-[11px] text-zinc-400 flex items-center gap-2">
							<span>{lead.categoryName}</span>
							<span>•</span>
							<span>{lead.city || 'Angola'}</span>
							{#if lead.phone}
								<span>•</span>
								<span class="font-mono text-zinc-300">{lead.phone}</span>
							{/if}
						</div>
					</div>

					<div class="flex items-center gap-3">
						<span class="text-xs font-mono text-zinc-300">{formatKz(lead.estimatedValue)}</span>
						<StatusBadge status={lead.status} size="sm" />
						<button
							type="button"
							onclick={() => crmStore.selectLead(lead)}
							class="rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer"
						>
							Detalhes
						</button>
					</div>
				</div>
			{/each}
		</div>
	</div>

</div>
