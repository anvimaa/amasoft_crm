<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import { crmStore } from '#lib/stores/crm.svelte.ts';
	import Sidebar from '#lib/components/Sidebar.svelte';
	import Header from '#lib/components/Header.svelte';
	import LeadDrawer from '#lib/components/LeadDrawer.svelte';
	import AddLeadModal from '#lib/components/AddLeadModal.svelte';
	import PurgeNoPhoneModal from '#lib/components/PurgeNoPhoneModal.svelte';
	import ResetConfirmModal from '#lib/components/ResetConfirmModal.svelte';
	import ImportLeadsModal from '#lib/components/ImportLeadsModal.svelte';
	import CompanySettingsModal from '#lib/components/CompanySettingsModal.svelte';
	import TeamManagementModal from '#lib/components/TeamManagementModal.svelte';
	import ToastContainer from '#lib/components/ToastContainer.svelte';

	let { children } = $props();
	let isMobileSidebarOpen = $state<boolean>(false);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex h-screen w-full bg-[#090a0f] text-zinc-100 overflow-hidden">
	<Sidebar
		isMobileOpen={isMobileSidebarOpen}
		onCloseMobile={() => isMobileSidebarOpen = false}
	/>

	<div class="flex flex-1 flex-col overflow-hidden min-w-0">
		<Header onToggleMobile={() => isMobileSidebarOpen = !isMobileSidebarOpen} />

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
			{:else}
				{@render children()}
			{/if}
		</main>
	</div>

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
	<ToastContainer />
</div>
