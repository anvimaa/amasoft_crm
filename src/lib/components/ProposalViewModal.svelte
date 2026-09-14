<script lang="ts">
	import { proposalsStore } from '../stores/proposals.svelte';
	import { companyStore } from '../stores/company.svelte';
	import { toast } from '../stores/toast.svelte';
	import Icon from './Icon.svelte';
	import { formatKz } from '../utils/format';
	import { generateWhatsAppLink } from '../utils/whatsapp';
	import type { ProposalStatus } from '../types/crm';

	import { generateProposalPDF } from '../utils/pdf-generator';

	let p = $derived(proposalsStore.viewingProposal);
	let comp = $derived(companyStore.company);
	let isGeneratingPDF = $state(false);

	const STATUS_LABELS: Record<ProposalStatus, { label: string; bg: string; text: string; border: string }> = {
		draft: { label: 'Rascunho', bg: 'bg-zinc-800', text: 'text-zinc-300', border: 'border-zinc-700' },
		sent: { label: 'Enviada', bg: 'bg-sky-950/60', text: 'text-sky-300', border: 'border-sky-800' },
		accepted: { label: 'Aceite / Fechada', bg: 'bg-emerald-950/60', text: 'text-emerald-300', border: 'border-emerald-800' },
		rejected: { label: 'Recusada', bg: 'bg-rose-950/60', text: 'text-rose-300', border: 'border-rose-800' }
	};

	function handleStatusChange(e: Event) {
		if (!p) return;
		const newStatus = (e.target as HTMLSelectElement).value as ProposalStatus;
		proposalsStore.updateStatus(p.id, newStatus);
		toast.success('Estado Atualizado', `Proposta marcada como "${STATUS_LABELS[newStatus].label}".`);
	}

	function handleDownloadPDF() {
		if (!p) return;
		try {
			isGeneratingPDF = true;
			generateProposalPDF(p, comp, true);
			toast.success('PDF Gerado', `Ficheiro "Proposta_${p.code}.pdf" descarregado com sucesso.`);
		} catch (e) {
			console.error('Erro ao gerar PDF:', e);
			toast.error('Erro no PDF', 'Ocorreu uma falha ao gerar o documento PDF.');
		} finally {
			isGeneratingPDF = false;
		}
	}

	function handlePrint() {
		window.print();
	}

	function getWhatsAppSummary(): string {
		if (!p) return '';
		const itemsList = p.items.map((it) => `• ${it.description} (${formatKz(it.total)})`).join('\n');
		return `*Proposta Comercial — ${comp.name}*\nRef: *${p.code}*\nPara: *${p.leadTitle}*\n\nEstimada equipa,\nSegue o resumo da nossa proposta de serviços:\n\n${itemsList}\n\n*Total da Proposta:* *${formatKz(p.total)}*\n*Condições:* ${p.paymentTerms}\n*Validade:* Até ${p.validUntil}\n\nFicamos à disposição para quaisquer esclarecimentos.\n\nAtenciosamente,\n*${comp.name}*\n${comp.phone || ''}`;
	}

	function copyWhatsAppSummary() {
		const text = getWhatsAppSummary();
		navigator.clipboard.writeText(text);
		toast.success('Resumo Copiado', 'Texto formatado para WhatsApp copiado para a área de transferência.');
	}

	function openWhatsAppDirect() {
		if (!p) return;
		if (!p.leadPhone) {
			toast.error('Telefone Indisponível', 'A empresa destinatária não possui número de telefone registado.');
			return;
		}
		const text = getWhatsAppSummary();
		const link = generateWhatsAppLink(p.leadPhone, text);
		if (link) {
			window.open(link, '_blank');
			proposalsStore.updateStatus(p.id, 'sent');
			toast.success('WhatsApp Aberto', 'Conversa iniciada com o resumo da proposta.');
		}
	}
</script>

{#if proposalsStore.isViewModalOpen && p}
	<!-- Static Backdrop (screen mode) -->
	<div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm w-full h-full print:hidden" aria-hidden="true"></div>

	<!-- Modal Wrapper -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 pointer-events-none print:p-0 print:static print:block">
		<div
			class="pointer-events-auto relative w-full max-w-4xl rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6 shadow-2xl space-y-4 max-h-[96vh] flex flex-col print:border-0 print:bg-white print:text-black print:p-0 print:max-h-none print:shadow-none"
		>
			<!-- Top Action Bar (hidden when printing) -->
			<div class="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3 print:hidden">
				<div class="flex items-center gap-2">
					<div class="rounded-lg bg-zinc-800 p-2 text-zinc-100 border border-zinc-700/60">
						<Icon name="file-text" class="w-4 h-4" />
					</div>
					<div>
						<span class="text-xs font-semibold text-white font-mono">{p.code}</span>
						<span class="text-xs text-zinc-400"> — {p.leadTitle}</span>
					</div>
				</div>

				<div class="flex flex-wrap items-center gap-2">
					<!-- Status Switcher -->
					<select
						value={p.status}
						onchange={handleStatusChange}
						class="rounded-lg bg-zinc-900 border border-zinc-700 px-2.5 py-1.5 text-xs font-medium text-zinc-200 focus:outline-none cursor-pointer"
					>
						<option value="draft">Rascunho</option>
						<option value="sent">Enviada</option>
						<option value="accepted">Aceite (Fechada)</option>
						<option value="rejected">Recusada</option>
					</select>

					<!-- Copy WhatsApp -->
					<button
						type="button"
						onclick={copyWhatsAppSummary}
						class="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
						title="Copiar texto resumido para WhatsApp"
					>
						<Icon name="copy" class="w-3.5 h-3.5" />
						<span class="hidden sm:inline">Copiar WhatsApp</span>
					</button>

					{#if p.leadPhone}
						<button
							type="button"
							onclick={openWhatsAppDirect}
							class="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer"
							title="Enviar proposta via WhatsApp"
						>
							<Icon name="whatsapp" class="w-3.5 h-3.5" />
							<span class="hidden sm:inline">Enviar WhatsApp</span>
						</button>
					{/if}

					<!-- Download PDF Button (jsPDF Native) -->
					<button
						type="button"
						onclick={handleDownloadPDF}
						disabled={isGeneratingPDF}
						class="flex items-center gap-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer shadow-sm disabled:opacity-50"
						title="Gerar e descarregar documento PDF profissional"
					>
						<Icon name="download" class="w-3.5 h-3.5" />
						<span>{isGeneratingPDF ? 'A gerar PDF...' : 'Descarregar PDF'}</span>
					</button>

					<!-- Print Button -->
					<button
						type="button"
						onclick={handlePrint}
						class="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors cursor-pointer"
						title="Imprimir documento via navegador"
					>
						<Icon name="printer" class="w-3.5 h-3.5" />
						<span class="hidden sm:inline">Imprimir</span>
					</button>

					<!-- Close Button -->
					<button
						type="button"
						onclick={() => proposalsStore.closeView()}
						class="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer ml-1"
						aria-label="Fechar"
					>
						<Icon name="close" class="w-4 h-4" />
					</button>
				</div>
			</div>

			<!-- Document A4 Sheet Container -->
			<div class="overflow-y-auto pr-1 flex-1 print:overflow-visible">
				<div
					id="printable-proposal"
					class="rounded-xl border border-zinc-800 bg-zinc-900/90 text-zinc-100 p-6 sm:p-8 space-y-6 shadow-inner print:bg-white print:text-black print:border-0 print:p-0"
				>
					<!-- Document Header -->
					<div class="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-zinc-800 print:border-zinc-300 pb-6">
						<div class="space-y-1">
							<div class="flex items-center gap-2">
								<span class="text-xl font-bold tracking-tight text-white print:text-black">{comp.name}</span>
							</div>
							<p class="text-xs text-zinc-400 print:text-zinc-600 max-w-sm">{comp.slogan}</p>
							<div class="text-[11px] text-zinc-400 print:text-zinc-600 space-y-0.5 pt-1">
								{#if comp.nif}<p>NIF: <span class="font-mono text-zinc-300 print:text-black">{comp.nif}</span></p>{/if}
								<p>{comp.address}</p>
								<p>{comp.email} • {comp.phone}</p>
								{#if comp.website}<p>{comp.website}</p>{/if}
							</div>
						</div>

						<div class="sm:text-right space-y-1">
							<span class="inline-block text-lg font-bold font-mono tracking-tight text-emerald-400 print:text-emerald-700">
								PROPOSTA COMERCIAL
							</span>
							<p class="text-xs font-mono font-semibold text-zinc-200 print:text-black">{p.code}</p>
							
							<div class="text-[11px] text-zinc-400 print:text-zinc-600 pt-2 space-y-0.5">
								<p>Data de Emissão: <strong class="text-zinc-200 print:text-black font-mono">{p.issueDate}</strong></p>
								<p>Validade: <strong class="text-zinc-200 print:text-black font-mono">{p.validUntil}</strong></p>
							</div>

							<div class="pt-1">
								<span
									class="inline-block rounded px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider {STATUS_LABELS[p.status].bg} {STATUS_LABELS[p.status].text} border {STATUS_LABELS[p.status].border} print:border-zinc-400"
								>
									{STATUS_LABELS[p.status].label}
								</span>
							</div>
						</div>
					</div>

					<!-- Destinatário / Client Information -->
					<div class="rounded-lg bg-zinc-950/70 print:bg-zinc-50 border border-zinc-800/80 print:border-zinc-200 p-4">
						<span class="text-[10px] font-semibold text-zinc-400 print:text-zinc-600 uppercase tracking-wider block mb-1">
							Destinatário / Dados do Cliente
						</span>
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
							<div>
								<h4 class="text-sm font-bold text-white print:text-black">{p.leadTitle}</h4>
								{#if p.leadCategory}<p class="text-zinc-400 print:text-zinc-600 text-[11px]">{p.leadCategory}</p>{/if}
								{#if p.leadAddress}<p class="text-zinc-400 print:text-zinc-600 text-[11px]">{p.leadAddress}</p>{/if}
								<p class="text-zinc-400 print:text-zinc-600 text-[11px]">{p.leadCity || 'Angola'}</p>
							</div>

							<div class="space-y-0.5 text-[11px] text-zinc-300 print:text-zinc-700 sm:text-right">
								{#if p.leadContact}<p>A/C: <strong>{p.leadContact}</strong></p>{/if}
								{#if p.leadPhone}<p>Contacto: <span class="font-mono">{p.leadPhone}</span></p>{/if}
								{#if p.leadEmail}<p>Email: {p.leadEmail}</p>{/if}
								{#if p.leadNif}<p>NIF: <span class="font-mono">{p.leadNif}</span></p>{/if}
							</div>
						</div>
					</div>

					<!-- Line Items Table -->
					<div class="space-y-2">
						<span class="text-[10px] font-semibold text-zinc-400 print:text-zinc-600 uppercase tracking-wider block">
							Discriminação de Serviços & Soluções Cotadas
						</span>

						<div class="overflow-x-auto rounded-lg border border-zinc-800 print:border-zinc-300">
							<table class="w-full text-left text-xs">
								<thead class="bg-zinc-950 print:bg-zinc-100 text-[10px] font-semibold text-zinc-400 print:text-zinc-700 uppercase tracking-wider border-b border-zinc-800 print:border-zinc-300">
									<tr>
										<th class="px-3 py-2.5">Descrição do Serviço</th>
										<th class="px-2 py-2.5 text-center w-14">Qtd</th>
										<th class="px-3 py-2.5 text-right w-28">Preço Unit. (Kz)</th>
										<th class="px-2 py-2.5 text-center w-16">Desc.</th>
										<th class="px-3 py-2.5 text-right w-32">Total (Kz)</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-zinc-800/60 print:divide-zinc-200 font-mono text-[11px]">
									{#each p.items as item}
										<tr class="hover:bg-zinc-800/20 print:hover:bg-transparent">
											<td class="px-3 py-2.5 font-sans font-medium text-zinc-100 print:text-black">
												{item.description}
											</td>
											<td class="px-2 py-2.5 text-center text-zinc-300 print:text-zinc-700">
												{item.quantity}
											</td>
											<td class="px-3 py-2.5 text-right text-zinc-300 print:text-zinc-700">
												{formatKz(item.unitPrice)}
											</td>
											<td class="px-2 py-2.5 text-center text-zinc-400 print:text-zinc-600">
												{item.discountPercent > 0 ? `${item.discountPercent}%` : '-'}
											</td>
											<td class="px-3 py-2.5 text-right font-semibold text-zinc-100 print:text-black">
												{formatKz(item.total)}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>

					<!-- Financial Totals Block -->
					<div class="flex justify-end pt-1">
						<div class="w-full sm:w-72 space-y-1.5 rounded-lg bg-zinc-950/80 print:bg-zinc-50 border border-zinc-800 print:border-zinc-300 p-3 font-mono text-xs">
							<div class="flex justify-between text-zinc-400 print:text-zinc-600">
								<span>Subtotal Líquido:</span>
								<span class="text-zinc-200 print:text-black font-semibold">{formatKz(p.subtotal)}</span>
							</div>

							{#if p.taxPercent > 0}
								<div class="flex justify-between text-zinc-400 print:text-zinc-600">
									<span>IVA ({p.taxPercent}%):</span>
									<span class="text-zinc-200 print:text-black">{formatKz(p.taxAmount)}</span>
								</div>
							{:else}
								<div class="flex justify-between text-[10px] text-zinc-500 print:text-zinc-500">
									<span>Imposto:</span>
									<span>Isento de IVA</span>
								</div>
							{/if}

							<div class="flex justify-between text-sm font-bold text-emerald-400 print:text-black border-t border-zinc-800 print:border-zinc-300 pt-1.5">
								<span>Total Geral:</span>
								<span>{formatKz(p.total)}</span>
							</div>
						</div>
					</div>

					<!-- Commercial Terms & Bank Info -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2 border-t border-zinc-800 print:border-zinc-300">
						<div class="space-y-1">
							<span class="text-[10px] font-semibold text-zinc-400 print:text-zinc-600 uppercase tracking-wider block">
								Condições de Fornecimento
							</span>
							<p class="text-zinc-300 print:text-zinc-700 text-[11px]">
								<strong>Pagamento:</strong> {p.paymentTerms}
							</p>
							<p class="text-zinc-300 print:text-zinc-700 text-[11px]">
								<strong>Prazo de Entrega:</strong> {p.deliveryTerms}
							</p>
							{#if p.notes}
								<p class="text-zinc-400 print:text-zinc-500 text-[10px] italic mt-1">
									{p.notes}
								</p>
							{/if}
						</div>

						<div class="space-y-1 sm:text-right">
							<span class="text-[10px] font-semibold text-zinc-400 print:text-zinc-600 uppercase tracking-wider block">
								Coordenadas Bancárias para Adjudicação
							</span>
							<div class="font-mono text-[11px] text-zinc-300 print:text-black whitespace-pre-wrap">
								{p.bankDetails}
							</div>
						</div>
					</div>

					<!-- Signatures Area -->
					<div class="grid grid-cols-2 gap-8 pt-8 border-t border-zinc-800 print:border-zinc-300 text-center text-xs">
						<div class="space-y-4">
							<div class="h-10 border-b border-zinc-700 print:border-zinc-400 w-3/4 mx-auto"></div>
							<p class="text-[11px] font-semibold text-zinc-300 print:text-black">{comp.name}</p>
							<p class="text-[10px] text-zinc-500">Emissor Comercial</p>
						</div>

						<div class="space-y-4">
							<div class="h-10 border-b border-zinc-700 print:border-zinc-400 w-3/4 mx-auto"></div>
							<p class="text-[11px] font-semibold text-zinc-300 print:text-black">{p.leadTitle}</p>
							<p class="text-[10px] text-zinc-500">Conforme / Adjudicação</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
