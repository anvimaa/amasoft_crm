<script lang="ts">
	import { proposalsStore } from '../stores/proposals.svelte';
	import { crmStore } from '../stores/crm.svelte';
	import { companyStore } from '../stores/company.svelte';
	import { toast } from '../stores/toast.svelte';
	import Icon from './Icon.svelte';
	import { formatKz } from '../utils/format';
	import { generateProposalPDF } from '../utils/pdf-generator';
	import type { CommercialProposal, ProposalStatus } from '../types/crm';

	const STATUS_TABS: { id: ProposalStatus | 'all'; label: string }[] = [
		{ id: 'all', label: 'Todas' },
		{ id: 'draft', label: 'Rascunhos' },
		{ id: 'sent', label: 'Enviadas' },
		{ id: 'accepted', label: 'Aceites' },
		{ id: 'rejected', label: 'Recusadas' }
	];

	const STATUS_CONFIG: Record<ProposalStatus, { label: string; bg: string; text: string; border: string }> = {
		draft: { label: 'Rascunho', bg: 'bg-zinc-800/80', text: 'text-zinc-300', border: 'border-zinc-700' },
		sent: { label: 'Enviada', bg: 'bg-sky-950/60', text: 'text-sky-300', border: 'border-sky-800' },
		accepted: { label: 'Aceite', bg: 'bg-emerald-950/60', text: 'text-emerald-300', border: 'border-emerald-800' },
		rejected: { label: 'Recusada', bg: 'bg-rose-950/60', text: 'text-rose-300', border: 'border-rose-800' }
	};

	function handleDownloadPDF(p: CommercialProposal) {
		try {
			generateProposalPDF(p, companyStore.company, true);
			toast.success('PDF Gerado', `Ficheiro "Proposta_${p.code}.pdf" descarregado.`);
		} catch (e) {
			console.error('Erro ao gerar PDF:', e);
			toast.error('Erro no PDF', 'Ocorreu um erro ao gerar o documento.');
		}
	}

	let deletingProposal = $state<CommercialProposal | null>(null);

	function handleDelete(p: CommercialProposal) {
		deletingProposal = p;
	}

	function confirmDeleteProposal() {
		if (!deletingProposal) return;
		proposalsStore.deleteProposal(deletingProposal.id);
		toast.info('Proposta Removida', `A proposta ${deletingProposal.code} foi excluída com sucesso.`);
		deletingProposal = null;
	}
</script>

<div class="space-y-6 pb-12">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<div class="flex items-center gap-2">
				<h1 class="text-xl font-bold tracking-tight text-white">Propostas Comerciais & Orçamentos</h1>
				<span class="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-mono text-zinc-300 border border-zinc-700/60">
					{proposalsStore.proposals.length} propostas
				</span>
			</div>
			<p class="text-xs text-zinc-400 mt-1">
				Emita, acompanhe e exporte propostas formais em PDF com valores cotados em Kwanzas (Kz).
			</p>
		</div>

		<button
			type="button"
			onclick={() => proposalsStore.openNewProposal()}
			class="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3.5 py-2 text-xs font-semibold text-zinc-950 hover:bg-white transition-colors cursor-pointer shadow-sm"
		>
			<Icon name="plus" class="w-3.5 h-3.5" />
			<span>Nova Proposta Comercial</span>
		</button>
	</div>

	<!-- KPI Summary Cards -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
		<!-- Total Value -->
		<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3.5 space-y-1">
			<span class="text-[11px] font-medium text-zinc-400">Total Cotado em Propostas</span>
			<p class="text-lg font-bold font-mono text-zinc-100">
				{formatKz(proposalsStore.stats.totalValue)}
			</p>
			<p class="text-[10px] text-zinc-500 font-mono">
				{proposalsStore.stats.totalCount} {proposalsStore.stats.totalCount === 1 ? 'proposta emitida' : 'propostas emitidas'}
			</p>
		</div>

		<!-- Accepted Value -->
		<div class="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-3.5 space-y-1">
			<span class="text-[11px] font-medium text-emerald-400">Propostas Aceites (Fechadas)</span>
			<p class="text-lg font-bold font-mono text-emerald-300">
				{formatKz(proposalsStore.stats.acceptedValue)}
			</p>
			<p class="text-[10px] text-emerald-400/80 font-mono">
				{proposalsStore.stats.acceptedCount} contratos adjudicados
			</p>
		</div>

		<!-- Pending / Sent Value -->
		<div class="rounded-xl border border-sky-900/40 bg-sky-950/20 p-3.5 space-y-1">
			<span class="text-[11px] font-medium text-sky-400">Em Negociação / Enviadas</span>
			<p class="text-lg font-bold font-mono text-sky-300">
				{formatKz(proposalsStore.stats.pendingValue)}
			</p>
			<p class="text-[10px] text-sky-400/80 font-mono">
				{proposalsStore.stats.sentCount} em avaliação pelo cliente
			</p>
		</div>

		<!-- Conversion Rate -->
		<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3.5 space-y-1">
			<span class="text-[11px] font-medium text-zinc-400">Taxa de Aceitação</span>
			<p class="text-lg font-bold font-mono text-zinc-100">
				{proposalsStore.stats.conversionRate.toFixed(1)}%
			</p>
			<p class="text-[10px] text-zinc-500 font-mono">
				{proposalsStore.stats.draftCount} rascunhos em preparação
			</p>
		</div>
	</div>

	<!-- Controls & Search -->
	<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3.5 space-y-3">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
			<!-- Search Bar -->
			<div class="relative flex-1">
				<Icon name="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
				<input
					type="text"
					bind:value={proposalsStore.search}
					placeholder="Pesquisar por código (PROP-...), nome do cliente, cidade..."
					class="w-full rounded-md bg-zinc-950 border border-zinc-800 pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
				/>
			</div>

			<!-- Status Filter Tabs -->
			<div class="flex items-center gap-1 overflow-x-auto text-xs">
				{#each STATUS_TABS as tab}
					<button
						type="button"
						onclick={() => proposalsStore.statusFilter = tab.id}
						class="px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer text-xs {proposalsStore.statusFilter === tab.id ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'}"
					>
						{tab.label}
					</button>
				{/each}
			</div>
		</div>
	</div>

	<!-- Proposals Data Table -->
	{#if proposalsStore.filteredProposals.length > 0}
		<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full text-left text-xs text-zinc-300">
					<thead class="bg-zinc-950 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
						<tr>
							<th class="px-4 py-3">Código</th>
							<th class="px-4 py-3">Cliente & Setor</th>
							<th class="px-4 py-3">Serviços Cotados</th>
							<th class="px-4 py-3">Datas</th>
							<th class="px-4 py-3">Valor Total (Kz)</th>
							<th class="px-4 py-3">Estado</th>
							<th class="px-4 py-3 text-right">Ações</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-zinc-800/70">
						{#each proposalsStore.filteredProposals as proposal (proposal.id)}
							{@const st = STATUS_CONFIG[proposal.status]}
							<tr
								onclick={() => proposalsStore.openViewProposal(proposal)}
								class="hover:bg-zinc-800/30 transition-colors cursor-pointer group"
							>
								<!-- Code -->
								<td class="px-4 py-3 whitespace-nowrap">
									<div class="font-mono font-semibold text-zinc-100 group-hover:text-white flex items-center gap-1.5">
										<Icon name="file-text" class="w-3.5 h-3.5 text-zinc-500" />
										<span>{proposal.code}</span>
									</div>
								</td>

								<!-- Client & Sector -->
								<td class="px-4 py-3 max-w-xs">
									<div class="font-semibold text-zinc-100 group-hover:text-white line-clamp-1">
										{proposal.leadTitle}
									</div>
									<div class="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
										{proposal.leadCity || 'Angola'} {#if proposal.leadCategory}• {proposal.leadCategory}{/if}
									</div>
								</td>

								<!-- Items Summary -->
								<td class="px-4 py-3 max-w-xs">
									<div class="text-[11px] text-zinc-300 line-clamp-1">
										{proposal.items[0]?.description || 'Serviço'}
									</div>
									{#if proposal.items.length > 1}
										<div class="text-[10px] text-zinc-500 mt-0.5">
											+ {proposal.items.length - 1} outros {proposal.items.length - 1 === 1 ? 'item' : 'itens'}
										</div>
									{/if}
								</td>

								<!-- Dates -->
								<td class="px-4 py-3 whitespace-nowrap text-[11px] font-mono text-zinc-400">
									<div>Emitida: <span class="text-zinc-200">{proposal.issueDate}</span></div>
									<div class="text-[10px] text-zinc-500">Validade: {proposal.validUntil}</div>
								</td>

								<!-- Total Value -->
								<td class="px-4 py-3 whitespace-nowrap font-mono font-bold text-sm text-zinc-100">
									{formatKz(proposal.total)}
								</td>

								<!-- Status Badge -->
								<td class="px-4 py-3 whitespace-nowrap">
									<span class="inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider {st.bg} {st.text} border {st.border}">
										{st.label}
									</span>
								</td>

								<!-- Actions -->
								<td class="px-4 py-3 text-right whitespace-nowrap" onclick={(e) => e.stopPropagation()}>
									<div class="flex items-center justify-end gap-1">
										<!-- View A4 Document -->
										<button
											type="button"
											onclick={() => proposalsStore.openViewProposal(proposal)}
											class="rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer"
											title="Ver documento A4 e detalhes"
										>
											<Icon name="eye" class="w-3.5 h-3.5 inline mr-1" />
											<span>Ver</span>
										</button>

										<!-- Direct PDF Download -->
										<button
											type="button"
											onclick={() => handleDownloadPDF(proposal)}
											class="rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-100 hover:bg-zinc-100 hover:text-zinc-950 transition-colors cursor-pointer"
											title="Descarregar ficheiro PDF diretamente"
										>
											<Icon name="download" class="w-3.5 h-3.5 inline mr-1" />
											<span>PDF</span>
										</button>

										<!-- Edit Proposal -->
										<button
											type="button"
											onclick={() => proposalsStore.openEditProposal(proposal)}
											class="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
											title="Editar proposta"
										>
											<Icon name="edit" class="w-3.5 h-3.5" />
										</button>

										<!-- Delete Proposal -->
										<button
											type="button"
											onclick={() => handleDelete(proposal)}
											class="rounded p-1 text-zinc-400 hover:bg-rose-950/60 hover:text-rose-300 transition-colors cursor-pointer"
											title="Excluir proposta"
										>
											<Icon name="trash" class="w-3.5 h-3.5" />
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{:else}
		<div class="rounded-2xl border border-zinc-800 bg-zinc-950 p-12 text-center space-y-3">
			<div class="inline-flex rounded-full bg-zinc-900 p-3 text-zinc-400 border border-zinc-800">
				<Icon name="file-text" class="w-6 h-6" />
			</div>
			<div class="space-y-1">
				<h3 class="text-sm font-semibold text-zinc-200">Nenhuma proposta encontrada</h3>
				<p class="text-xs text-zinc-500 max-w-sm mx-auto">
					Comece por emitir a sua primeira proposta comercial associada a uma empresa do CRM.
				</p>
			</div>
			<button
				type="button"
				onclick={() => proposalsStore.openNewProposal()}
				class="rounded-lg bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-white cursor-pointer shadow-sm"
			>
				Nova Proposta Comercial
			</button>
		</div>
	{/if}
</div>

{#if deletingProposal}
	<!-- Static Backdrop (does not close on click) -->
	<div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm w-full h-full" aria-hidden="true"></div>

	<!-- Modal Wrapper -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
		<div
			class="pointer-events-auto relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4"
		>
			<div class="flex items-start gap-3">
				<div class="rounded-xl bg-rose-950/40 p-2.5 text-rose-400 border border-rose-900/40 shrink-0">
					<Icon name="trash" class="w-5 h-5" />
				</div>
				<div class="space-y-1.5 flex-1 min-w-0">
					<h3 class="text-base font-semibold text-white">Eliminar Proposta Comercial?</h3>
					<p class="text-xs text-zinc-400 leading-relaxed">
						Esta ação é irreversível. Tem a certeza de que deseja eliminar permanentemente a proposta <strong class="text-zinc-200">{deletingProposal.code}</strong>?
					</p>

					<div class="mt-2 rounded-lg bg-zinc-900/70 border border-zinc-800/80 p-3 space-y-1 text-xs">
						<div class="flex items-center justify-between text-zinc-300">
							<span class="text-zinc-400">Cliente:</span>
							<span class="font-semibold text-white">{deletingProposal.leadTitle}</span>
						</div>
						<div class="flex items-center justify-between text-zinc-300">
							<span class="text-zinc-400">Total Cotado:</span>
							<span class="font-mono font-bold text-emerald-400">{formatKz(deletingProposal.total)}</span>
						</div>
						<div class="flex items-center justify-between text-zinc-400 text-[11px]">
							<span>Emitida em:</span>
							<span class="font-mono">{deletingProposal.issueDate}</span>
						</div>
					</div>
				</div>
			</div>

			<div class="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
				<button
					type="button"
					onclick={() => deletingProposal = null}
					class="rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 cursor-pointer"
				>
					Cancelar
				</button>
				<button
					type="button"
					onclick={confirmDeleteProposal}
					class="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 cursor-pointer shadow-sm"
				>
					<Icon name="trash" class="w-3.5 h-3.5" />
					<span>Eliminar Proposta</span>
				</button>
			</div>
		</div>
	</div>
{/if}

