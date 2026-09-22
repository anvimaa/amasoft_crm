<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { crmStore } from '#lib/stores/crm.svelte.ts';
	import { authStore } from '#lib/stores/auth.svelte.ts';
	import Sidebar from "#lib/components/Sidebar.svelte";
	import Header from "#lib/components/Header.svelte";
	import LeadDrawer from "#lib/components/LeadDrawer.svelte";
	import AddLeadModal from "#lib/components/AddLeadModal.svelte";
	import PurgeNoPhoneModal from "#lib/components/PurgeNoPhoneModal.svelte";
	import ResetConfirmModal from "#lib/components/ResetConfirmModal.svelte";
	import ImportLeadsModal from "#lib/components/ImportLeadsModal.svelte";
	import CompanySettingsModal from "#lib/components/CompanySettingsModal.svelte";
	import TeamManagementModal from "#lib/components/TeamManagementModal.svelte";
	import ProposalEditorModal from "#lib/components/ProposalEditorModal.svelte";
	import ProposalViewModal from "#lib/components/ProposalViewModal.svelte";
	import TemplateEditorModal from "#lib/components/TemplateEditorModal.svelte";

	let { children } = $props();
	let isMobileSidebarOpen = $state<boolean>(false);
	let isCheckingAuth = $state<boolean>(true);

	onMount(async () => {
		const isAuth = await authStore.checkAuth();
		if (!isAuth) {
			await goto("/login");
		} else {
			isCheckingAuth = false;
		}
	});
</script>

{#if isCheckingAuth}
	<div
		class="flex h-screen w-full items-center justify-center bg-[#090a0f] text-zinc-100"
	>
		<div class="flex flex-col items-center gap-3">
			<div
				class="h-7 w-7 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"
			></div>
			<p class="text-xs text-zinc-400 font-mono">
				A verificar sessão segura...
			</p>
		</div>
	</div>
{:else}
	<div
		class="flex h-screen w-full bg-[#090a0f] text-zinc-100 overflow-hidden"
	>
		<Sidebar
			isMobileOpen={isMobileSidebarOpen}
			onCloseMobile={() => (isMobileSidebarOpen = false)}
		/>

		<div class="flex flex-1 flex-col overflow-hidden min-w-0">
			<Header
				onToggleMobile={() =>
					(isMobileSidebarOpen = !isMobileSidebarOpen)}
			/>

			<main class="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-6">
				{#if !crmStore.isLoaded}
					<div class="flex h-96 items-center justify-center">
						<div class="flex flex-col items-center gap-3">
							<div
								class="h-6 w-6 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent"
							></div>
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
		<ProposalEditorModal />
		<ProposalViewModal />
		<TemplateEditorModal />
		<ResetConfirmModal
			isOpen={crmStore.isResetModalOpen}
			onClose={() => (crmStore.isResetModalOpen = false)}
		/>
	</div>
{/if}
