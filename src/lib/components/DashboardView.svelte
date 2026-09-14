<script lang="ts">
	import { goto } from '$app/navigation';
	import { crmStore } from '../stores/crm.svelte';
	import Icon from './Icon.svelte';
	import StatusBadge from './StatusBadge.svelte';
	import PriorityBadge from './PriorityBadge.svelte';
	import FunnelChart from './charts/FunnelChart.svelte';
	import DoughnutChart from './charts/DoughnutChart.svelte';
	import BarChart from './charts/BarChart.svelte';
	import { formatKz } from '../utils/format';
	import type { LeadStatus } from '../types/crm';

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
		crmStore.filters.businessLine = 'all';
		goto('/table');
	}

	function filterByBusiness(line: 'has_saas' | 'has_factflexi' | 'has_project' | 'has_contract') {
		crmStore.filters.search = '';
		crmStore.filters.businessLine = line;
		crmStore.filters.hasWebsite = 'all';
		crmStore.filters.priority = 'all';
		crmStore.filters.status = 'all';
		crmStore.filters.city = 'all';
		goto('/table');
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
					<span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Diagnóstico de Base & Portfólio</span>
				</div>
				<h1 class="text-base sm:text-lg font-semibold text-zinc-100">
					{crmStore.stats.missingWebsiteCount} empresas sem website registado ({((crmStore.stats.missingWebsiteCount / (crmStore.stats.totalLeads || 1)) * 100).toFixed(0)}% da base)
				</h1>
				<p class="text-xs text-zinc-400">
					Segmento prioritário para prospeção de desenvolvimento web, plataformas de catálogo, SaaS Fact Flexi e assistência técnica.
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

	<!-- SECTION: RECURRING REVENUE & MULTI-BUSINESS LINES (MRR/ARR) -->
	<div class="space-y-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<span class="rounded bg-sky-950/70 border border-sky-800/80 p-1 text-sky-400">
					<Icon name="money" class="w-3.5 h-3.5" />
				</span>
				<h2 class="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
					Receita Recorrente & Linhas de Negócio
				</h2>
			</div>
			<span class="text-[11px] text-zinc-500 font-mono">
				ARR Projetado: <strong class="text-sky-300">{formatKz(crmStore.stats.totalARR)}</strong>
			</span>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<!-- MRR Total -->
			<div class="rounded-xl border border-sky-900/40 bg-sky-950/20 p-4 relative overflow-hidden">
				<div class="flex items-center justify-between">
					<span class="text-xs font-medium text-sky-300">MRR Recorrente Total</span>
					<Icon name="money" class="w-4 h-4 text-sky-400" />
				</div>
				<div class="mt-2.5 flex items-baseline gap-2">
					<span class="text-2xl font-semibold tracking-tight text-white font-mono">
						{formatKz(crmStore.stats.totalMRR)}
					</span>
					<span class="text-[10px] text-sky-400 font-medium">/ mês</span>
				</div>
				<div class="mt-2 text-[11px] text-zinc-400 flex items-center justify-between">
					<span>SaaS: <strong class="text-sky-200 font-mono">{formatKz(crmStore.stats.saasMRR)}</strong></span>
					<span>Suporte: <strong class="text-amber-300 font-mono">{formatKz(crmStore.stats.supportMRR)}</strong></span>
				</div>
			</div>

			<!-- SaaS Subscriptions (Fact Flexi / CRM) -->
			<button
				type="button"
				onclick={() => filterByBusiness('has_saas')}
				class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-left hover:border-sky-800/80 hover:bg-zinc-900/70 transition-all cursor-pointer"
			>
				<div class="flex items-center justify-between">
					<span class="text-xs font-medium text-zinc-400">Subscrições SaaS Ativas</span>
					<Icon name="tag" class="w-4 h-4 text-sky-400" />
				</div>
				<div class="mt-2.5 flex items-baseline gap-2">
					<span class="text-2xl font-semibold tracking-tight text-zinc-100 font-mono">
						{crmStore.stats.activeSubscriptionsCount}
					</span>
					<span class="text-xs text-zinc-500">licenças</span>
				</div>
				<div class="mt-2 text-[11px] text-zinc-400 flex items-center justify-between">
					<span>Fact Flexi & Apps</span>
					{#if crmStore.stats.expiringSoonSubscriptionsCount > 0}
						<span class="text-amber-400 font-medium">
							{crmStore.stats.expiringSoonSubscriptionsCount} a expirar em 30d
						</span>
					{:else}
						<span class="text-emerald-400 font-medium">Em dia</span>
					{/if}
				</div>
			</button>

			<!-- Projects Web/App in Progress -->
			<button
				type="button"
				onclick={() => filterByBusiness('has_project')}
				class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-left hover:border-indigo-800/80 hover:bg-zinc-900/70 transition-all cursor-pointer"
			>
				<div class="flex items-center justify-between">
					<span class="text-xs font-medium text-zinc-400">Projetos Web/App em Curso</span>
					<Icon name="globe" class="w-4 h-4 text-indigo-400" />
				</div>
				<div class="mt-2.5 flex items-baseline gap-2">
					<span class="text-2xl font-semibold tracking-tight text-zinc-100 font-mono">
						{crmStore.stats.activeProjectsCount}
					</span>
					<span class="text-xs text-zinc-500">em produção</span>
				</div>
				<div class="mt-2 text-[11px] text-zinc-400 flex items-center justify-between">
					<span>Valor em carteira:</span>
					<strong class="text-indigo-300 font-mono">{formatKz(crmStore.stats.activeProjectsValue)}</strong>
				</div>
			</button>

			<!-- Support Contracts / Retainers -->
			<button
				type="button"
				onclick={() => filterByBusiness('has_contract')}
				class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-left hover:border-amber-800/80 hover:bg-zinc-900/70 transition-all cursor-pointer"
			>
				<div class="flex items-center justify-between">
					<span class="text-xs font-medium text-zinc-400">Contratos de Assistência</span>
					<Icon name="clock" class="w-4 h-4 text-amber-400" />
				</div>
				<div class="mt-2.5 flex items-baseline gap-2">
					<span class="text-2xl font-semibold tracking-tight text-zinc-100 font-mono">
						{crmStore.stats.activeSupportContractsCount}
					</span>
					<span class="text-xs text-zinc-500">avenças</span>
				</div>
				<div class="mt-2 text-[11px] text-zinc-400 flex items-center justify-between">
					<span>Helpdesk TI & Fiscal</span>
					<strong class="text-amber-300 font-mono">{formatKz(crmStore.stats.supportMRR)}/mês</strong>
				</div>
			</button>
		</div>
	</div>

	<!-- 4 Standard Pipeline Metrics Cards -->
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
					onclick={() => goto('/pipeline')}
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
					onclick={() => goto('/map')}
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

	<!-- Multi-Business Line Portfolio: Active Projects & Upcoming SaaS Renewals -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		
		<!-- Widget 1: Projetos Web & Apps em Desenvolvimento -->
		<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
			<div class="flex items-center justify-between">
				<div>
					<div class="flex items-center gap-2">
						<span class="rounded bg-indigo-950/70 border border-indigo-800/80 p-1 text-indigo-400">
							<Icon name="globe" class="w-3.5 h-3.5" />
						</span>
						<h3 class="text-sm font-semibold text-zinc-100">Projetos Web & App em Desenvolvimento</h3>
					</div>
					<p class="text-xs text-zinc-400 mt-0.5">
						{crmStore.stats.activeProjectsCount} projetos ativos • <strong class="text-indigo-300 font-mono">{formatKz(crmStore.stats.activeProjectsValue)}</strong> em produção
					</p>
				</div>
				<button
					type="button"
					onclick={() => filterByBusiness('has_project')}
					class="text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer"
				>
					Ver Todos
					<Icon name="chevron-right" class="w-3.5 h-3.5 text-zinc-400" />
				</button>
			</div>

			{#if crmStore.stats.activeProjectsList.length === 0}
				<div class="rounded-lg border border-dashed border-zinc-800/80 p-6 text-center text-xs text-zinc-500">
					Nenhum projeto web/app em desenvolvimento ativo no momento.
				</div>
			{:else}
				<div class="space-y-2.5">
					{#each crmStore.stats.activeProjectsList.slice(0, 4) as item (item.project.id)}
						<button
							type="button"
							onclick={() => crmStore.selectLead(item.lead)}
							class="w-full text-left p-3 rounded-lg border border-zinc-800 bg-zinc-950/40 hover:border-indigo-800/70 hover:bg-zinc-900/50 transition-all cursor-pointer space-y-2"
						>
							<div class="flex items-start justify-between gap-2">
								<div>
									<h4 class="text-xs font-semibold text-white">{item.project.name}</h4>
									<p class="text-[11px] text-zinc-400">Cliente: <strong class="text-zinc-200">{item.lead.title}</strong></p>
								</div>
								<div class="text-right">
									<span class="text-xs font-mono font-bold text-emerald-400">{formatKz(item.project.estimatedValue)}</span>
								</div>
							</div>

							<!-- Progress Bar -->
							<div class="space-y-1">
								<div class="flex items-center justify-between text-[10px] text-zinc-400">
									<span class="capitalize">{item.project.stage.replace('_', ' ')}</span>
									<span class="font-mono font-semibold text-zinc-300">{item.project.progress}%</span>
								</div>
								<div class="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
									<div class="h-full bg-indigo-500 rounded-full transition-all duration-300" style="width: {item.project.progress}%"></div>
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Widget 2: Renovações de Licenças SaaS & Retainers -->
		<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
			<div class="flex items-center justify-between">
				<div>
					<div class="flex items-center gap-2">
						<span class="rounded bg-sky-950/70 border border-sky-800/80 p-1 text-sky-400">
							<Icon name="tag" class="w-3.5 h-3.5" />
						</span>
						<h3 class="text-sm font-semibold text-zinc-100">Renovações SaaS Prioritárias</h3>
					</div>
					<p class="text-xs text-zinc-400 mt-0.5">
						Licenças e assinaturas com vencimento nos próximos 30 dias
					</p>
				</div>
				<button
					type="button"
					onclick={() => filterByBusiness('has_saas')}
					class="text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer"
				>
					Ver Todas
					<Icon name="chevron-right" class="w-3.5 h-3.5 text-zinc-400" />
				</button>
			</div>

			{#if crmStore.stats.expiringSubscriptionsList.length === 0}
				<div class="rounded-lg border border-dashed border-zinc-800/80 p-6 text-center text-xs text-zinc-500">
					Nenhuma licença SaaS a expirar nos próximos 30 dias. Todas em dia!
				</div>
			{:else}
				<div class="space-y-2.5">
					{#each crmStore.stats.expiringSubscriptionsList.slice(0, 4) as item (item.subscription.id)}
						<button
							type="button"
							onclick={() => crmStore.selectLead(item.lead)}
							class="w-full text-left p-3 rounded-lg border {item.daysUntil < 0 ? 'border-rose-900/60 bg-rose-950/20' : item.daysUntil <= 7 ? 'border-amber-900/60 bg-amber-950/20' : 'border-zinc-800 bg-zinc-950/40'} hover:border-sky-800/70 transition-all cursor-pointer"
						>
							<div class="flex items-start justify-between gap-2">
								<div>
									<div class="flex items-center gap-2">
										<h4 class="text-xs font-semibold text-white">{item.subscription.productName}</h4>
										<span class="rounded bg-sky-950 border border-sky-800/80 px-1.5 py-0.2 text-[10px] text-sky-300 font-medium">
											{item.subscription.planName}
										</span>
									</div>
									<p class="text-[11px] text-zinc-400 mt-0.5">
										Cliente: <strong class="text-zinc-200">{item.lead.title}</strong>
									</p>
								</div>
								<div class="text-right">
									<div class="text-xs font-mono font-bold text-emerald-400">{formatKz(item.subscription.priceKz)}</div>
									<span class="text-[10px] {item.daysUntil < 0 ? 'text-rose-400 font-bold' : item.daysUntil <= 7 ? 'text-amber-400 font-semibold' : 'text-zinc-400'}">
										{item.daysUntil < 0 ? `Expirada há ${Math.abs(item.daysUntil)}d` : item.daysUntil === 0 ? 'Expira Hoje' : `Em ${item.daysUntil} dias`}
									</span>
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
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
					onclick={() => goto('/agenda')}
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
