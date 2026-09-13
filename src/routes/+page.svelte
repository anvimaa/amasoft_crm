<script lang="ts">
	import { crmStore } from '#lib/stores/crm.svelte.ts';
	import Sidebar from '#lib/components/Sidebar.svelte';
	import Header from '#lib/components/Header.svelte';
	import DashboardView from '#lib/components/DashboardView.svelte';
	import KanbanView from '#lib/components/KanbanView.svelte';
	import TableView from '#lib/components/TableView.svelte';
	import MapView from '#lib/components/MapView.svelte';
	import AgendaView from '#lib/components/AgendaView.svelte';
	import LeadDrawer from '#lib/components/LeadDrawer.svelte';
	import AddLeadModal from '#lib/components/AddLeadModal.svelte';
	import PurgeNoPhoneModal from '#lib/components/PurgeNoPhoneModal.svelte';
	import ResetConfirmModal from '#lib/components/ResetConfirmModal.svelte';
	import ImportLeadsModal from '#lib/components/ImportLeadsModal.svelte';
	import CompanySettingsModal from '#lib/components/CompanySettingsModal.svelte';
	import TeamManagementModal from '#lib/components/TeamManagementModal.svelte';
	import ToastContainer from '#lib/components/ToastContainer.svelte';

	let isMobileSidebarOpen = $state<boolean>(false);
</script>

<svelte:head>
	<title>Amasoft CRM — Gestão Comercial & Pipeline de Vendas em Angola</title>
</svelte:head>

<div class="flex h-screen w-full bg-[#090a0f] text-zinc-100 overflow-hidden">
	<!-- Left Sidebar -->
	<Sidebar
		isMobileOpen={isMobileSidebarOpen}
		onCloseMobile={() => isMobileSidebarOpen = false}
	/>

	<!-- Main App Content Area -->
	<div class="flex flex-1 flex-col overflow-hidden min-w-0">
		<!-- Top Minimalist Header -->
		<Header onToggleMobile={() => isMobileSidebarOpen = !isMobileSidebarOpen} />

		<!-- Scrollable Main View Container -->
		<main class="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-6">
			{#if !crmStore.isLoaded}
				<div class="flex h-96 items-center justify-center">
					<div class="flex flex-col items-center gap-3">
						<div class="h-6 w-6 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent"></div>
						<p class="text-xs text-zinc-400">
							A carregar base de clientes Amasoft...
						</p>
					</div>
				</div>
			{:else if crmStore.activeView === 'dashboard'}
				<DashboardView />
			{:else if crmStore.activeView === 'kanban'}
				<KanbanView />
			{:else if crmStore.activeView === 'table'}
				<TableView />
			{:else if crmStore.activeView === 'map'}
				<MapView />
			{:else if crmStore.activeView === 'agenda'}
				<AgendaView />
			{/if}
		</main>
	</div>

	<!-- Slide-over Drawer & Modal Overlays -->
	<LeadDrawer />
	<AddLeadModal />
	<PurgeNoPhoneModal />
	<ImportLeadsModal />
	<CompanySettingsModal />
	<TeamManagementModal />
	<ResetConfirmModal
		isOpen={crmStore.isResetModalOpen}
		onClose={() => crmStore.isResetModalOpen = false}
	/>

	<!-- Toast Notifications -->
	<ToastContainer />
</div>
