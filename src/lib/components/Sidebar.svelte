<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { crmStore } from "../stores/crm.svelte";
	import { companyStore } from "../stores/company.svelte";
	import { saasStore } from "../stores/saas.svelte";
	import { authStore } from "../stores/auth.svelte";
	import { toast } from "../stores/toast.svelte";
	import { formatKz } from "../utils/format";
	import Icon from "./Icon.svelte";

	interface Props {
		isMobileOpen: boolean;
		onCloseMobile: () => void;
	}

	let { isMobileOpen, onCloseMobile }: Props = $props();
	let restoreFileInput = $state<HTMLInputElement | null>(null);
	let isRestoring = $state<boolean>(false);

	const VIEW_ROUTES: Record<string, string> = {
		dashboard: "/dashboard",
		kanban: "/pipeline",
		table: "/table",
		saas: "/saas",
		propostas: "/propostas",
		templates: "/templates",
		talao: "/talao",
		map: "/map",
		agenda: "/agenda",
	};

	function navigateTo(view: string) {
		const target = VIEW_ROUTES[view] || "/dashboard";
		goto(target).catch(() => {
			window.location.href = target;
		});
		onCloseMobile();
	}

	function filterSmartView(type: "hot" | "no-website" | "won") {
		crmStore.filters.search = "";
		crmStore.filters.city = "all";
		crmStore.filters.category = "all";

		if (type === "hot") {
			crmStore.filters.priority = "hot";
			crmStore.filters.hasWebsite = "all";
			crmStore.filters.status = "all";
		} else if (type === "no-website") {
			crmStore.filters.hasWebsite = "no";
			crmStore.filters.priority = "all";
			crmStore.filters.status = "all";
		} else if (type === "won") {
			crmStore.filters.status = "won";
			crmStore.filters.priority = "all";
			crmStore.filters.hasWebsite = "all";
		}
		goto("/table");
		onCloseMobile();
	}

	async function handleRestoreBackup(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		input.value = "";

		isRestoring = true;
		try {
			const result = await crmStore.restoreFromBackup(file);
			if (result.success) {
				toast.success("Backup Restaurado", result.message);
			} else {
				toast.error("Erro ao Restaurar", result.message);
			}
		} catch {
			toast.error("Erro ao Restaurar", "Ocorreu um erro inesperado.");
		} finally {
			isRestoring = false;
		}
	}
</script>

<!-- Mobile Overlay Backdrop -->
{#if isMobileOpen}
	<button
		type="button"
		class="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden w-full h-full border-0 cursor-default"
		onclick={onCloseMobile}
		aria-label="Fechar menu lateral"
	></button>
{/if}

<!-- Sidebar Container -->
<aside
	class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-800/80 bg-[#090a0f] transition-transform lg:translate-x-0 {isMobileOpen
		? 'translate-x-0 shadow-2xl'
		: '-translate-x-full lg:static'}"
>
	<!-- Workspace / Brand Header -->
	<div
		class="flex h-16 items-center justify-between px-4 border-b border-zinc-800/80"
	>
		<div class="flex items-center gap-3">
			<div
				class="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 text-white font-semibold text-xs tracking-wider"
			>
				{companyStore.company.name
					.split(" ")
					.map((w) => w[0])
					.join("")
					.slice(0, 2)
					.toUpperCase()}
			</div>
			<div class="flex flex-col">
				<div class="flex items-center gap-1.5">
					<span
						class="text-xs font-semibold text-zinc-100 tracking-tight truncate max-w-30"
						>{companyStore.company.name}</span
					>
					<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"
					></span>
				</div>
				<span class="text-[11px] text-zinc-400"
					>Banco de Dados: .json</span
				>
			</div>
		</div>

		<!-- Mobile Close Button -->
		<button
			type="button"
			onclick={onCloseMobile}
			class="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white lg:hidden cursor-pointer"
		>
			<Icon name="close" class="w-4 h-4" />
		</button>
	</div>

	<!-- Quick Action: Novo Lead -->
	<div class="p-3">
		<button
			type="button"
			onclick={() => {
				crmStore.isAddModalOpen = true;
				onCloseMobile();
			}}
			class="w-full flex items-center justify-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-950 hover:bg-white transition-colors cursor-pointer shadow-sm"
		>
			<Icon name="plus" class="w-3.5 h-3.5 text-zinc-950" />
			<span>Adicionar Empresa</span>
		</button>
	</div>

	<!-- Navigation Section -->
	<div class="flex-1 overflow-y-auto px-3 py-2 space-y-6">
		<!-- Main Navigation -->
		<div class="space-y-1">
			<span
				class="px-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider"
				>Navegação</span
			>

			<button
				type="button"
				onclick={() => navigateTo("dashboard")}
				class="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer {page
					.url.pathname === '/dashboard'
					? 'bg-zinc-800/90 text-white font-semibold'
					: 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}"
			>
				<div class="flex items-center gap-2.5">
					<Icon name="dashboard" class="w-4 h-4 text-zinc-400" />
					<span>Visão Geral</span>
				</div>
			</button>

			<button
				type="button"
				onclick={() => navigateTo("kanban")}
				class="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer {page
					.url.pathname === '/pipeline'
					? 'bg-zinc-800/90 text-white font-semibold'
					: 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}"
			>
				<div class="flex items-center gap-2.5">
					<Icon name="kanban" class="w-4 h-4 text-zinc-400" />
					<span>Pipeline Comercial</span>
				</div>
			</button>

			<button
				type="button"
				onclick={() => navigateTo("table")}
				class="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer {page
					.url.pathname === '/table'
					? 'bg-zinc-800/90 text-white font-semibold'
					: 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}"
			>
				<div class="flex items-center gap-2.5">
					<Icon name="table" class="w-4 h-4 text-zinc-400" />
					<span>Diretório de Empresas</span>
				</div>
				<span
					class="rounded bg-zinc-800 px-1.5 py-0.2 text-[10px] font-mono text-zinc-400 border border-zinc-700/50"
				>
					{crmStore.leads.length}
				</span>
			</button>

			<button
				type="button"
				onclick={() => navigateTo("map")}
				class="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer {page
					.url.pathname === '/map'
					? 'bg-zinc-800/90 text-white font-semibold'
					: 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}"
			>
				<div class="flex items-center gap-2.5">
					<Icon name="map" class="w-4 h-4 text-zinc-400" />
					<span>Cobertura Territorial</span>
				</div>
				<span class="text-[10px] text-zinc-400">Angola</span>
			</button>

			<button
				type="button"
				onclick={() => navigateTo("agenda")}
				class="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer {page
					.url.pathname === '/agenda'
					? 'bg-zinc-800/90 text-white font-semibold'
					: 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}"
			>
				<div class="flex items-center gap-2.5">
					<Icon name="calendar" class="w-4 h-4 text-zinc-400" />
					<span>Agenda</span>
				</div>
				{#if crmStore.followUpCounts.dueNow > 0}
					<span
						class="rounded bg-rose-950/60 px-1.5 py-0.2 text-[10px] font-mono text-rose-300 border border-rose-900/40"
					>
						{crmStore.followUpCounts.dueNow}
					</span>
				{/if}
			</button>

			<button
				type="button"
				onclick={() => navigateTo("propostas")}
				class="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer {page
					.url.pathname === '/propostas'
					? 'bg-zinc-800/90 text-white font-semibold'
					: 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}"
			>
				<div class="flex items-center gap-2.5">
					<Icon name="file-text" class="w-4 h-4 text-zinc-400" />
					<span>Propostas Comerciais</span>
				</div>
			</button>

			<button
				type="button"
				onclick={() => navigateTo("saas")}
				class="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer {page
					.url.pathname === '/saas'
					? 'bg-zinc-800/90 text-white font-semibold'
					: 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}"
			>
				<div class="flex items-center gap-2.5">
					<Icon name="tag" class="w-4 h-4 text-sky-400" />
					<span>Produtos & SaaS</span>
				</div>
				{#if saasStore.stats.activeCount > 0}
					<span
						class="rounded bg-sky-950/60 px-1.5 py-0.2 text-[10px] font-mono text-sky-300 border border-sky-900/40"
					>
						{saasStore.stats.activeCount}
					</span>
				{/if}
			</button>

			<button
				type="button"
				onclick={() => navigateTo("templates")}
				class="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer {page
					.url.pathname === '/templates'
					? 'bg-zinc-800/90 text-white font-semibold'
					: 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}"
			>
				<div class="flex items-center gap-2.5">
					<Icon name="message-square" class="w-4 h-4 text-zinc-400" />
					<span>Modelos de Mensagem</span>
				</div>
			</button>

			<button
				type="button"
				onclick={() => navigateTo("talao")}
				class="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer {page
					.url.pathname.startsWith('/talao') || page.url.pathname === '/recibo-termico' || page.url.pathname === '/gtp-rupe'
					? 'bg-zinc-800/90 text-white font-semibold'
					: 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}"
			>
				<div class="flex items-center gap-2.5">
					<Icon name="printer" class="w-4 h-4 text-emerald-400" />
					<span>Talões & RUPE</span>
				</div>
				<span class="rounded bg-emerald-950/60 px-1.5 py-0.2 text-[10px] font-mono text-emerald-400 border border-emerald-900/40">
					58mm/A4
				</span>
			</button>
		</div>

		<!-- Smart Filters / Quick Segments -->
		<div class="space-y-1">
			<span
				class="px-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider"
				>Filtros Estratégicos</span
			>

			<button
				type="button"
				onclick={() => filterSmartView("no-website")}
				class="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors cursor-pointer"
			>
				<div class="flex items-center gap-2.5 truncate">
					<Icon name="globe" class="w-3.5 h-3.5 text-zinc-500" />
					<span class="truncate">Sem Website</span>
				</div>
				<span
					class="rounded bg-zinc-900 px-1.5 py-0.2 text-[10px] font-mono text-zinc-400"
				>
					{crmStore.stats.missingWebsiteCount}
				</span>
			</button>

			<button
				type="button"
				onclick={() => filterSmartView("hot")}
				class="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors cursor-pointer"
			>
				<div class="flex items-center gap-2.5 truncate">
					<Icon name="fire" class="w-3.5 h-3.5 text-rose-400" />
					<span class="truncate">Prioridade Alta</span>
				</div>
				<span
					class="rounded bg-zinc-900 px-1.5 py-0.2 text-[10px] font-mono text-zinc-400"
				>
					{crmStore.stats.byPriority.hot}
				</span>
			</button>

			<button
				type="button"
				onclick={() => filterSmartView("won")}
				class="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors cursor-pointer"
			>
				<div class="flex items-center gap-2.5 truncate">
					<Icon name="check" class="w-3.5 h-3.5 text-emerald-400" />
					<span class="truncate">Contratos Fechados</span>
				</div>
				<span
					class="rounded bg-zinc-900 px-1.5 py-0.2 text-[10px] font-mono text-emerald-400"
				>
					{crmStore.stats.byStatus.won}
				</span>
			</button>

			{#if crmStore.stats.missingPhoneCount > 0}
				<button
					type="button"
					onclick={() => {
						crmStore.isPurgeModalOpen = true;
						onCloseMobile();
					}}
					class="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer border border-transparent hover:border-rose-900/40"
					title="Rever e excluir empresas sem número de telefone"
				>
					<div class="flex items-center gap-2.5 truncate">
						<Icon name="trash" class="w-3.5 h-3.5 text-rose-400" />
						<span class="truncate">Excluir Sem Telefone</span>
					</div>
					<span
						class="rounded bg-rose-950/40 px-1.5 py-0.2 text-[10px] font-mono text-rose-300 border border-rose-900/40"
					>
						{crmStore.stats.missingPhoneCount}
					</span>
				</button>
			{/if}
		</div>

		<!-- Pipeline Performance Widget in Sidebar -->
		<div
			class="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3 space-y-2"
		>
			<div class="flex items-center justify-between text-[11px]">
				<span class="text-zinc-400">Volume em Pipeline</span>
				<span class="font-mono text-zinc-200 font-semibold"
					>{formatKz(crmStore.stats.totalPipelineValue)}</span
				>
			</div>

			<div class="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
				<div
					class="h-full rounded-full bg-zinc-400 transition-all duration-500"
					style="width: {Math.max(crmStore.stats.conversionRate, 5)}%"
				></div>
			</div>

			<div
				class="flex items-center justify-between text-[10px] text-zinc-400"
			>
				<span
					>Conversão: <strong class="text-zinc-200"
						>{crmStore.stats.conversionRate.toFixed(0)}%</strong
					></span
				>
				<span>{crmStore.stats.byStatus.proposal} propostas</span>
			</div>
		</div>
	</div>

	<!-- Sidebar Footer User / Tools -->
	<div class="border-t border-zinc-800/80 p-3 bg-zinc-950/60 space-y-2">
		<!-- Settings Buttons -->
		<div class="flex items-center gap-1.5">
			<button
				type="button"
				onclick={() => {
					companyStore.isCompanyModalOpen = true;
					onCloseMobile();
				}}
				class="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-[10px] font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors cursor-pointer"
				title="Dados da empresa"
			>
				<Icon name="building" class="w-3 h-3" />
				Empresa
			</button>
			<button
				type="button"
				onclick={() => {
					companyStore.isTeamModalOpen = true;
					onCloseMobile();
				}}
				class="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-[10px] font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors cursor-pointer"
				title="Gerir equipa"
			>
				<Icon name="user" class="w-3 h-3" />
				Equipa
			</button>
		</div>

		<!-- Quick Actions Row -->
		<div class="flex items-center gap-1.5">
			<button
				type="button"
				onclick={() => restoreFileInput?.click()}
				disabled={isRestoring}
				class="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-[10px] font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors cursor-pointer disabled:opacity-40"
				title="Restaurar a partir de backup completo"
			>
				{#if isRestoring}
					<div
						class="w-3 h-3 border-[1.5px] border-zinc-400 border-t-transparent rounded-full animate-spin"
					></div>
				{:else}
					<Icon name="refresh" class="w-3 h-3" />
				{/if}
				Backup
			</button>
			<button
				type="button"
				onclick={() => {
					crmStore.isResetModalOpen = true;
					onCloseMobile();
				}}
				class="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-[10px] font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors cursor-pointer"
				title="Restaurar base de dados original (fábrica)"
			>
				<Icon name="trash" class="w-3 h-3" />
				Fábrica
			</button>
			<input
				type="file"
				accept=".json"
				bind:this={restoreFileInput}
				onchange={handleRestoreBackup}
				class="hidden"
			/>
		</div>

		<!-- User Info + Tools -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div
					class="h-7 w-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-semibold text-zinc-300"
				>
					{companyStore.company.name
						.split(" ")
						.map((w) => w[0])
						.join("")
						.slice(0, 2)
						.toUpperCase()}
				</div>
				<div class="flex flex-col">
					<span
						class="text-xs font-medium text-zinc-200 truncate max-w-25"
						>{companyStore.company.name}</span
					>
					<span class="text-[10px] text-zinc-400"
						>{companyStore.team.filter((m) => m.isActive).length} membro{companyStore.team.filter(
							(m) => m.isActive,
						).length !== 1
							? "s"
							: ""}</span
					>
				</div>
			</div>

			<div class="flex items-center gap-1">
				<button
					type="button"
					onclick={() => {
						crmStore.isImportModalOpen = true;
						onCloseMobile();
					}}
					title="Importar ficheiro de empresas (.json)"
					class="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
				>
					<Icon name="upload" class="w-3.5 h-3.5" />
				</button>
				<button
					type="button"
					onclick={() => crmStore.exportOriginalFormat()}
					title="Exportar no formato original de clientes.json"
					class="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
				>
					<Icon name="download" class="w-3.5 h-3.5" />
				</button>
				<button
					type="button"
					onclick={() => authStore.logout()}
					title="Terminar sessão segura"
					class="rounded p-1.5 text-zinc-400 hover:bg-rose-950/60 hover:text-rose-400 transition-colors cursor-pointer"
				>
					<Icon name="log-out" class="w-3.5 h-3.5" />
				</button>
			</div>
		</div>
	</div>
</aside>
