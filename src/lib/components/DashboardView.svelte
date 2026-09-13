<script lang="ts">
	import { crmStore } from '../stores/crm.svelte';
	import Icon from './Icon.svelte';
	import StatusBadge from './StatusBadge.svelte';
	import PriorityBadge from './PriorityBadge.svelte';
	import FunnelChart from './charts/FunnelChart.svelte';
	import DoughnutChart from './charts/DoughnutChart.svelte';
	import BarChart from './charts/BarChart.svelte';
	import type { LeadStatus } from '../types/crm';

	function formatKz(value: number): string {
		return new Intl.NumberFormat('pt-AO', {
			maximumFractionDigits: 0
		}).format(value) + ' Kz';
	}

	function daysSince(isoString: string | null): number {
		if (!isoString) return 999;
		const t = new Date(isoString).getTime();
		if (isNaN(t)) return 999;
		return Math.round((Date.now() - t) / 86400000);
	}

	const stageLabels: Record<LeadStatus, string> = {
		lead: 'Novo Lead',
		contacted: 'Em Contacto',
		meeting: 'Qualificacao',
		proposal: 'Proposta',
		won: 'Fechado',
		lost: 'Desqualificado'
	};

	const stageColors: Record<LeadStatus, string> = {
		lead: 'rgb(161, 161, 170)',
		contacted: 'rgb(251, 191, 36)',
		meeting: 'rgb(129, 140, 248)',
		proposal: 'rgb(56, 189, 248)',
		won: 'rgb(52, 211, 153)',
		lost: 'rgb(82, 82, 91)'
	};

	const priorityColors: Record<string, string> = {
		hot: 'rgb(244, 63, 94)',
		warm: 'rgb(245, 158, 11)',
		cold: 'rgb(113, 113, 122)'
	};

	const cityBarColors = [
		'rgb(52, 211, 153)',
		'rgb(56, 189, 248)',
		'rgb(129, 140, 248)',
		'rgb(251, 191, 36)',
		'rgb(244, 63, 94)',
		'rgb(161, 161, 170)',
		'rgb(248, 113, 113)',
		'rgb(167, 139, 250)'
	];

	const categoryColors = [
		'rgb(52, 211, 153)',
		'rgb(56, 189, 248)',
		'rgb(129, 140, 248)',
		'rgb(251, 191, 36)',
		'rgb(244, 63, 94)',
		'rgb(167, 139, 250)',
		'rgb(248, 113, 113)',
		'rgb(161, 161, 170)'
	];

	let funnelLabels = $derived(
		(['lead', 'contacted', 'meeting', 'proposal', 'won', 'lost'] as LeadStatus[]).map(k => stageLabels[k])
	);
	let funnelData = $derived(
		(['lead', 'contacted', 'meeting', 'proposal', 'won', 'lost'] as LeadStatus[]).map(k => crmStore.stats.byStatus[k])
	);
	let funnelColors = $derived(
		(['lead', 'contacted', 'meeting', 'proposal', 'won', 'lost'] as LeadStatus[]).map(k => stageColors[k])
	);

	let priorityLabels = $derived(['Alta', 'Media', 'Baixa']);
	let priorityData = $derived([crmStore.stats.byPriority.hot, crmStore.stats.byPriority.warm, crmStore.stats.byPriority.cold]);
	let priorityColorsArr = $derived(['rgb(244, 63, 94)', 'rgb(245, 158, 11)', 'rgb(113, 113, 122)']);

	let cityLabels = $derived(crmStore.stats.topCities.slice(0, 8).map(c => c.city));
	let cityData = $derived(crmStore.stats.topCities.slice(0, 8).map(c => c.count));

	let categoryLabels = $derived(crmStore.stats.topCategories.slice(0, 8).map(c => c.category));
	let categoryData = $derived(crmStore.stats.topCategories.slice(0, 8).map(c => c.count));

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

	function handleFunnelClick(index: number) {
		const statuses: LeadStatus[] = ['lead', 'contacted', 'meeting', 'proposal', 'won', 'lost'];
		filterByPreset('status', statuses[index]);
	}

	function handleCityClick(index: number) {
		filterByPreset('city', crmStore.stats.topCities[index]?.city);
	}
</script>

<div class="space-y-6 pb-12">
	
	<!-- Top Strategic Context Card -->
	<div class="rounded-xl bg-zinc-900/60 border border-zinc-800 p-5">
		<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
			<div class="space-y-1">
				<div class="flex items-center gap-2">
					<span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Diagnostico de Base</span>
				</div>
				<h1 class="text-base sm:text-lg font-semibold text-zinc-100">
					{crmStore.stats.missingWebsiteCount} empresas sem website registrado ({((crmStore.stats.missingWebsiteCount / crmStore.stats.totalLeads) * 100).toFixed(0)}% da base)
				</h1>
				<p class="text-xs text-zinc-400">
					Segmento prioritario para prospeccao de desenvolvimento web, plataformas de catalogo e software de facturacao e gestao.
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
				<strong class="text-zinc-200 font-mono">{crmStore.stats.withPhoneCount}</strong> com contacto telefonico verificado
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
				<span class="text-xs font-medium text-zinc-400">Taxa de Conversao</span>
				<Icon name="chart" class="w-4 h-4 text-zinc-500" />
			</div>
			<div class="mt-2.5 flex items-baseline gap-2">
				<span class="text-2xl font-semibold tracking-tight text-zinc-100 font-mono">
					{crmStore.stats.conversionRate.toFixed(1)}%
				</span>
				<span class="text-xs text-zinc-400">({crmStore.stats.byStatus.won} fechados)</span>
			</div>
			<div class="mt-2 text-[11px] text-zinc-400">
				<span class="text-zinc-300 font-mono">{crmStore.stats.byStatus.proposal}</span> propostas sob analise comercial
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
				<span>{crmStore.stats.byPriority.warm} media prioridade,</span>
				<span>{crmStore.stats.byPriority.cold} baixa</span>
			</div>
		</div>

	</div>

	<!-- Charts Row 1: Pipeline Funnel + Priority Distribution -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Funnel Chart (2/3 width) -->
		<div class="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
			<div class="flex items-center justify-between mb-4">
				<div>
					<h2 class="text-sm font-semibold text-zinc-100">Funil Comercial</h2>
					<p class="text-xs text-zinc-400">Distribuicao por estagio do pipeline</p>
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
			<FunnelChart
				labels={funnelLabels}
				data={funnelData}
				colors={funnelColors}
				height={260}
				onClick={handleFunnelClick}
			/>
			<!-- Legend -->
			<div class="flex flex-wrap gap-3 mt-3 pt-3 border-t border-zinc-800/60">
				{#each funnelLabels as label, i (label)}
					<div class="flex items-center gap-1.5">
						<span class="w-2.5 h-2.5 rounded-sm" style="background-color: {funnelColors[i]}"></span>
						<span class="text-[10px] text-zinc-400">{label}: <strong class="text-zinc-300 font-mono">{funnelData[i]}</strong></span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Priority Doughnut (1/3 width) -->
		<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
			<div class="mb-4">
				<h3 class="text-sm font-semibold text-zinc-100">Por Prioridade</h3>
				<p class="text-xs text-zinc-400">Distribuicao de leads</p>
			</div>
			<DoughnutChart
				labels={priorityLabels}
				data={priorityData}
				colors={priorityColorsArr}
				height={200}
			/>
			<!-- Legend -->
			<div class="space-y-2 mt-3 pt-3 border-t border-zinc-800/60">
				{#each priorityLabels as label, i (label)}
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<span class="w-2.5 h-2.5 rounded-sm" style="background-color: {priorityColorsArr[i]}"></span>
							<span class="text-xs text-zinc-300">{label}</span>
						</div>
						<span class="text-xs font-mono font-semibold text-zinc-200">{priorityData[i]}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Charts Row 2: Top Cities + Top Categories -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Top Cities Bar Chart -->
		<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
			<div class="flex items-center justify-between mb-4">
				<div>
					<h3 class="text-sm font-semibold text-zinc-100">Top Cidades / Provincias</h3>
					<p class="text-xs text-zinc-400">Concentracao de empresas por regiao</p>
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
			<BarChart
				labels={cityLabels}
				data={cityData}
				colors={cityBarColors.slice(0, cityLabels.length)}
				height={240}
				onClick={handleCityClick}
			/>
		</div>

		<!-- Top Categories Doughnut -->
		<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
			<div class="mb-4">
				<h3 class="text-sm font-semibold text-zinc-100">Setores de Atividade</h3>
				<p class="text-xs text-zinc-400">Classificacao por segmento comercial</p>
			</div>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<DoughnutChart
					labels={categoryLabels}
					data={categoryData}
					colors={categoryColors.slice(0, categoryLabels.length)}
					height={200}
					cutout="62%"
				/>
				<div class="space-y-2">
					{#each categoryLabels as label, i (label)}
						<div class="flex items-center justify-between py-1">
							<div class="flex items-center gap-2 min-w-0">
								<span class="w-2.5 h-2.5 rounded-sm flex-shrink-0" style="background-color: {categoryColors[i]}"></span>
								<span class="text-xs text-zinc-300 truncate" title={label}>{label}</span>
							</div>
							<div class="flex items-center gap-2 flex-shrink-0">
								<span class="text-xs font-mono font-semibold text-zinc-200">{categoryData[i]}</span>
								<span class="text-[10px] text-zinc-500">({((categoryData[i] / crmStore.stats.totalLeads) * 100).toFixed(0)}%)</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<!-- Agenda & Stale Leads Widgets -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Agenda do Dia -->
		<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
			<div class="flex items-center justify-between mb-4">
				<div>
					<h3 class="text-sm font-semibold text-zinc-100">A Minha Agenda</h3>
					<p class="text-xs text-zinc-400">
						{crmStore.followUpCounts.dueNow} acompanhamentos pendentes
					</p>
				</div>
				<button
					type="button"
					onclick={() => crmStore.activeView = 'agenda'}
					class="text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer"
				>
					Ver Agenda
					<Icon name="chevron-right" class="w-3.5 h-3.5 text-zinc-400" />
				</button>
			</div>

			{#if crmStore.followUpGroups.overdue.length > 0}
				<div class="space-y-2 mb-3">
					<span class="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">Atrasados ({crmStore.followUpGroups.overdue.length})</span>
					{#each crmStore.followUpGroups.overdue.slice(0, 3) as lead (lead.id)}
						<button
							type="button"
							onclick={() => crmStore.selectLead(lead)}
							class="w-full text-left py-2 px-3 rounded-lg border border-rose-900/30 bg-rose-950/10 hover:bg-rose-900/20 transition-colors cursor-pointer"
						>
							<div class="flex items-center justify-between gap-2">
								<div class="flex items-center gap-2 min-w-0">
									<span class="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0"></span>
									<span class="text-xs font-semibold text-zinc-100 truncate">{lead.title}</span>
								</div>
								<StatusBadge status={lead.status} size="sm" />
							</div>
							<div class="text-[10px] text-zinc-500 mt-1 ml-3.5">
								{daysSince(lead.lastContactDate) < 999 ? `Contactado ha ${daysSince(lead.lastContactDate)}d` : 'Sem contacto registado'}
							</div>
						</button>
					{/each}
					{#if crmStore.followUpGroups.overdue.length > 3}
						<p class="text-[10px] text-zinc-500 text-center">+{crmStore.followUpGroups.overdue.length - 3} outros</p>
					{/if}
				</div>
			{/if}

			{#if crmStore.followUpGroups.today.length > 0}
				<div class="space-y-2">
					<span class="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">Hoje ({crmStore.followUpGroups.today.length})</span>
					{#each crmStore.followUpGroups.today.slice(0, 3) as lead (lead.id)}
						<button
							type="button"
							onclick={() => crmStore.selectLead(lead)}
							class="w-full text-left py-2 px-3 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/50 transition-colors cursor-pointer"
						>
							<div class="flex items-center justify-between gap-2">
								<div class="flex items-center gap-2 min-w-0">
									<span class="w-1.5 h-1.5 rounded-full bg-zinc-100 flex-shrink-0"></span>
									<span class="text-xs font-semibold text-zinc-100 truncate">{lead.title}</span>
								</div>
								<StatusBadge status={lead.status} size="sm" />
							</div>
						</button>
					{/each}
				</div>
			{/if}

			{#if crmStore.followUpCounts.dueNow === 0}
				<p class="text-xs text-zinc-500 py-3 text-center">Nenhum acompanhamento pendente para hoje.</p>
			{/if}
		</div>

		<!-- Leads A Arrefecer -->
		<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
			<div class="flex items-center justify-between mb-4">
				<div>
					<h3 class="text-sm font-semibold text-zinc-100">Oportunidades a Arrefecer</h3>
					<p class="text-xs text-zinc-400">
						{crmStore.staleLeads.length} leads sem contacto recente (>14d)
					</p>
				</div>
			</div>

			{#if crmStore.staleLeads.length === 0}
				<p class="text-xs text-zinc-500 py-3 text-center">Todos os leads foram contactados recentemente.</p>
			{:else}
				<div class="divide-y divide-zinc-800/80">
					{#each crmStore.staleLeads.slice(0, 5) as lead (lead.id)}
						<div
							class="py-3 flex items-center justify-between gap-3 hover:bg-zinc-800/20 px-2 rounded-lg transition-colors"
							role="button"
							tabindex="0"
							onclick={() => crmStore.selectLead(lead)}
							onkeydown={(e) => e.key === 'Enter' && crmStore.selectLead(lead)}
						>
							<div class="space-y-1 min-w-0">
								<div class="flex items-center gap-2">
									<span class="text-xs font-semibold text-zinc-100 truncate">{lead.title}</span>
									<PriorityBadge priority={lead.priority} size="sm" />
								</div>
								<div class="text-[11px] text-zinc-400">
									{lead.categoryName} · {lead.city || 'Angola'}
									{#if lead.lastContactDate}
										· <span class="text-amber-400">Contactado ha {daysSince(lead.lastContactDate)}d</span>
									{:else}
										· <span class="text-rose-400">Sem contacto</span>
									{/if}
								</div>
							</div>
							<div class="flex items-center gap-2 flex-shrink-0">
								<span class="text-xs font-mono text-zinc-300">{formatKz(lead.estimatedValue)}</span>
								<button
									type="button"
									onclick={(e) => { e.stopPropagation(); crmStore.selectLead(lead); crmStore.scheduleFollowUp(lead.id, new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]); }}
									class="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer"
									title="Agendar follow-up em 3 dias"
								>
									Agendar +3d
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- High Priority Accounts Table Snippet -->
	<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
		<div class="flex items-center justify-between mb-4">
			<div>
				<h3 class="text-sm font-semibold text-zinc-100">Contas Prioritarias para Abordagem</h3>
				<p class="text-xs text-zinc-400">Empresas com contacto verificado e ausencia de presenca digital</p>
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
			{#each crmStore.leads.filter(l => l.priority === 'hot' && l.phone).slice(0, 5) as lead (lead.id)}
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
							<span>·</span>
							<span>{lead.city || 'Angola'}</span>
							{#if lead.phone}
								<span>·</span>
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
