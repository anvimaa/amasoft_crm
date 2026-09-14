<script lang="ts">
	import { proposalsStore } from '../stores/proposals.svelte';
	import { crmStore } from '../stores/crm.svelte';
	import { companyStore } from '../stores/company.svelte';
	import { toast } from '../stores/toast.svelte';
	import Icon from './Icon.svelte';
	import { formatKz } from '../utils/format';
	import type { CommercialProposal, ProposalItem, ProposalStatus } from '../types/crm';

	let selectedLeadId = $state<string>('');
	let leadTitle = $state<string>('');
	let leadCategory = $state<string>('');
	let leadCity = $state<string>('');
	let leadAddress = $state<string>('');
	let leadNif = $state<string>('');
	let leadContact = $state<string>('');
	let leadPhone = $state<string>('');
	let leadEmail = $state<string>('');

	let code = $state<string>('');
	let status = $state<ProposalStatus>('draft');
	let issueDate = $state<string>('');
	let validUntil = $state<string>('');

	let items = $state<ProposalItem[]>([]);
	let taxPercent = $state<number>(0); // 0% (Isento) ou 14% (IVA)

	let paymentTerms = $state<string>('50% na adjudicação + 50% na entrega e homologação');
	let deliveryTerms = $state<string>('10 a 15 dias úteis após validação dos requisitos');
	let bankDetails = $state<string>('Banco BAI: AO06 0040 0000 1234 5678 9012 3 (Amasoft Technologies)');
	let notes = $state<string>('Proposta sujeita aos termos e condições gerais de prestação de serviços tecnológicos.');

	// Helper to calculate totals
	let financialTotals = $derived(proposalsStore.calculateTotals(items, taxPercent));

	function getFormattedDate(daysOffset = 0): string {
		const d = new Date();
		d.setDate(d.getDate() + daysOffset);
		return d.toISOString().split('T')[0];
	}

	$effect(() => {
		if (proposalsStore.isEditorModalOpen) {
			if (proposalsStore.editingProposal) {
				const p = proposalsStore.editingProposal;
				selectedLeadId = p.leadId;
				leadTitle = p.leadTitle;
				leadCategory = p.leadCategory || '';
				leadCity = p.leadCity || '';
				leadAddress = p.leadAddress || '';
				leadNif = p.leadNif || '';
				leadContact = p.leadContact || '';
				leadPhone = p.leadPhone || '';
				leadEmail = p.leadEmail || '';

				code = p.code;
				status = p.status;
				issueDate = p.issueDate;
				validUntil = p.validUntil;
				items = JSON.parse(JSON.stringify(p.items));
				taxPercent = p.taxPercent || 0;
				paymentTerms = p.paymentTerms || '';
				deliveryTerms = p.deliveryTerms || '';
				bankDetails = p.bankDetails || '';
				notes = p.notes || '';
			} else {
				// New proposal
				const target = proposalsStore.targetLead;
				if (target) {
					selectedLeadId = target.id;
					leadTitle = target.title;
					leadCategory = target.categoryName;
					leadCity = target.city || 'Luanda';
					leadAddress = target.address || target.street || '';
					leadNif = '';
					leadContact = target.decisionMaker || '';
					leadPhone = target.phone || '';
					leadEmail = target.email || '';
				} else {
					selectedLeadId = '';
					leadTitle = '';
					leadCategory = '';
					leadCity = 'Luanda';
					leadAddress = '';
					leadNif = '';
					leadContact = '';
					leadPhone = '';
					leadEmail = '';
				}

				code = proposalsStore.generateNextCode();
				status = 'draft';
				issueDate = getFormattedDate(0);
				validUntil = getFormattedDate(15);
				const c = companyStore.company;
				const bankNameStr = c.bankName || 'Banco BAI';
				const ibanStr = c.bankIban || 'AO06 0040 0000 1234 5678 9012 3';
				const holderStr = c.bankAccountHolder || c.name;
				bankDetails = `${bankNameStr}: ${ibanStr}\nTitular: ${holderStr}`;
				notes = 'Proposta sujeita aos termos e condições gerais de prestação de serviços tecnológicos.';

				items = [
					{
						id: `item-${Date.now()}-1`,
						description: 'Desenvolvimento de Website Corporativo Institucional & SEO',
						quantity: 1,
						unitPrice: 850000,
						discountPercent: 0,
						total: 850000
					}
				];
			}
		}
	});

	function handleLeadSelect(e: Event) {
		const leadId = (e.target as HTMLSelectElement).value;
		selectedLeadId = leadId;
		const lead = crmStore.leads.find((l) => l.id === leadId);
		if (lead) {
			leadTitle = lead.title;
			leadCategory = lead.categoryName;
			leadCity = lead.city || 'Luanda';
			leadAddress = lead.address || lead.street || '';
			leadContact = lead.decisionMaker || '';
			leadPhone = lead.phone || '';
			leadEmail = lead.email || '';
		}
	}

	function addItem() {
		items = [
			...items,
			{
				id: `item-${Date.now()}-${items.length + 1}`,
				description: '',
				quantity: 1,
				unitPrice: 0,
				discountPercent: 0,
				total: 0
			}
		];
	}

	function removeItem(index: number) {
		if (items.length <= 1) {
			toast.info('Item Obrigatório', 'A proposta deve conter pelo menos um item cotado.');
			return;
		}
		items = items.filter((_, i) => i !== index);
	}

	function updateItemLine(index: number, partial: Partial<ProposalItem>) {
		items = items.map((item, i) => {
			if (i === index) {
				const updated = { ...item, ...partial };
				const gross = (updated.quantity || 1) * (updated.unitPrice || 0);
				const discount = gross * ((updated.discountPercent || 0) / 100);
				updated.total = Math.max(0, gross - discount);
				return updated;
			}
			return item;
		});
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (!leadTitle.trim()) {
			toast.error('Cliente Obrigatório', 'Selecione ou insira o nome da empresa destinatária.');
			return;
		}

		if (items.length === 0 || items.some((it) => !it.description.trim() || it.unitPrice <= 0)) {
			toast.error('Itens Inválidos', 'Preencha a descrição e valor unitário de todos os itens da proposta.');
			return;
		}

		const proposalPayload = {
			code: code.trim(),
			leadId: selectedLeadId,
			leadTitle: leadTitle.trim(),
			leadCategory: leadCategory.trim(),
			leadCity: leadCity.trim(),
			leadAddress: leadAddress.trim(),
			leadNif: leadNif.trim(),
			leadContact: leadContact.trim(),
			leadPhone: leadPhone.trim(),
			leadEmail: leadEmail.trim(),
			status,
			issueDate,
			validUntil,
			items,
			subtotal: financialTotals.subtotal,
			taxPercent,
			taxAmount: financialTotals.taxAmount,
			total: financialTotals.total,
			paymentTerms: paymentTerms.trim(),
			deliveryTerms: deliveryTerms.trim(),
			bankDetails: bankDetails.trim(),
			notes: notes.trim()
		};

		if (proposalsStore.editingProposal) {
			proposalsStore.updateProposal(proposalsStore.editingProposal.id, proposalPayload);
			toast.success('Proposta Atualizada', `A proposta ${code} foi atualizada com sucesso.`);
		} else {
			const created = proposalsStore.createProposal(proposalPayload);
			toast.success('Proposta Criada', `Proposta ${created.code} emitida no valor de ${formatKz(created.total)}.`);
		}

		proposalsStore.closeEditor();
	}
</script>

{#if proposalsStore.isEditorModalOpen}
	<!-- Static Backdrop (does not close on click) -->
	<div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm w-full h-full" aria-hidden="true"></div>

	<!-- Modal Wrapper -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
		<div
			class="pointer-events-auto relative w-full max-w-4xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col"
		>
			<!-- Header -->
			<div class="flex items-start justify-between border-b border-zinc-800 pb-4">
				<div class="flex items-center gap-3">
					<div class="rounded-xl bg-zinc-800 p-2.5 text-zinc-100 border border-zinc-700/60">
						<Icon name="file-text" class="w-5 h-5" />
					</div>
					<div>
						<div class="flex items-center gap-2">
							<h3 class="text-base font-semibold text-white tracking-tight">
								{proposalsStore.editingProposal ? `Editar Proposta: ${code}` : 'Nova Proposta Comercial'}
							</h3>
							<span class="rounded bg-zinc-900 px-2 py-0.5 text-xs font-mono text-zinc-300 border border-zinc-800">
								{code}
							</span>
						</div>
						<p class="text-xs text-zinc-400 mt-0.5">
							Emita orçamentos comerciais detalhados em Kwanzas (Kz) prontos para envio e impressão
						</p>
					</div>
				</div>

				<button
					type="button"
					onclick={() => proposalsStore.closeEditor()}
					class="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
					aria-label="Fechar modal"
				>
					<Icon name="close" class="w-4 h-4" />
				</button>
			</div>

			<!-- Form Body -->
			<form onsubmit={handleSubmit} class="space-y-4 overflow-y-auto pr-1 text-xs">
				<!-- Section 1: Client & General Info -->
				<div class="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 space-y-3">
					<h4 class="text-xs font-semibold text-zinc-200">1. Dados do Cliente & Validade</h4>

					<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
						<!-- Lead Selector / Title -->
						<div class="sm:col-span-2 space-y-1">
							<label for="prop-lead" class="block text-[11px] font-medium text-zinc-300">
								Empresa Destinatária *
							</label>
							{#if crmStore.leads.length > 0}
								<select
									id="prop-lead"
									value={selectedLeadId}
									onchange={handleLeadSelect}
									class="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-zinc-100 focus:border-zinc-600 focus:outline-none cursor-pointer"
								>
									<option value="">-- Selecionar da Base de Leads --</option>
									{#each crmStore.leads as lead}
										<option value={lead.id}>{lead.title} ({lead.city || 'Angola'})</option>
									{/each}
								</select>
							{:else}
								<input
									id="prop-lead"
									type="text"
									required
									bind:value={leadTitle}
									placeholder="Nome da Empresa..."
									class="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-zinc-100 focus:border-zinc-600 focus:outline-none"
								/>
							{/if}
						</div>

						<!-- Status -->
						<div class="space-y-1">
							<label for="prop-status" class="block text-[11px] font-medium text-zinc-300">
								Estágio da Proposta
							</label>
							<select
								id="prop-status"
								bind:value={status}
								class="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-zinc-200 focus:border-zinc-600 focus:outline-none cursor-pointer"
							>
								<option value="draft">Rascunho</option>
								<option value="sent">Enviada ao Cliente</option>
								<option value="accepted">Aceite (Fechada)</option>
								<option value="rejected">Recusada</option>
							</select>
						</div>

						<!-- Issue Date -->
						<div class="space-y-1">
							<label for="prop-issue" class="block text-[11px] font-medium text-zinc-300">
								Data de Emissão
							</label>
							<input
								id="prop-issue"
								type="date"
								bind:value={issueDate}
								class="w-full rounded-md bg-zinc-900 border border-zinc-800 px-2.5 py-2 text-zinc-100 font-mono focus:border-zinc-600 focus:outline-none"
							/>
						</div>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
						<!-- Validity -->
						<div class="space-y-1">
							<label for="prop-valid" class="block text-[11px] font-medium text-zinc-300">
								Válida Até
							</label>
							<input
								id="prop-valid"
								type="date"
								bind:value={validUntil}
								class="w-full rounded-md bg-zinc-900 border border-zinc-800 px-2.5 py-2 text-zinc-100 font-mono focus:border-zinc-600 focus:outline-none"
							/>
						</div>

						<!-- Contact Person -->
						<div class="space-y-1">
							<label for="prop-contact" class="block text-[11px] font-medium text-zinc-300">
								Pessoa de Contacto / Decisor
							</label>
							<input
								id="prop-contact"
								type="text"
								bind:value={leadContact}
								placeholder="Ex: Dr. Afonso Dias"
								class="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
							/>
						</div>

						<!-- Phone -->
						<div class="space-y-1">
							<label for="prop-phone" class="block text-[11px] font-medium text-zinc-300">
								Telefone (+244)
							</label>
							<input
								id="prop-phone"
								type="text"
								bind:value={leadPhone}
								placeholder="+244 923 000 000"
								class="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-zinc-100 font-mono placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
							/>
						</div>

						<!-- City / Province -->
						<div class="space-y-1">
							<label for="prop-city" class="block text-[11px] font-medium text-zinc-300">
								Província / Cidade
							</label>
							<input
								id="prop-city"
								type="text"
								bind:value={leadCity}
								placeholder="Ex: Luanda"
								class="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
							/>
						</div>
					</div>
				</div>

				<!-- Section 2: Line Items -->
				<div class="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 space-y-3">
					<div class="flex items-center justify-between">
						<h4 class="text-xs font-semibold text-zinc-200">2. Serviços & Itens Cotados</h4>
						<button
							type="button"
							onclick={addItem}
							class="flex items-center gap-1 rounded bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-200 border border-zinc-700/60 transition-colors cursor-pointer"
						>
							<Icon name="plus" class="w-3 h-3" />
							<span>Adicionar Item</span>
						</button>
					</div>

					<div class="rounded-lg border border-zinc-800 bg-zinc-950 overflow-x-auto">
						<table class="w-full text-left text-xs">
							<thead class="bg-zinc-900/80 text-[10px] text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
								<tr>
									<th class="px-3 py-2 w-1/2">Descrição do Serviço / Solução *</th>
									<th class="px-2 py-2 w-16 text-center">Qtd</th>
									<th class="px-2 py-2 w-28 text-right">Preço Unit. (Kz) *</th>
									<th class="px-2 py-2 w-20 text-center">Desc. %</th>
									<th class="px-3 py-2 w-32 text-right">Total Linha (Kz)</th>
									<th class="px-2 py-2 w-10 text-center"></th>
								</tr>
							</thead>
							<tbody class="divide-y divide-zinc-800/60 font-mono">
								{#each items as item, idx}
									<tr class="hover:bg-zinc-900/40">
										<!-- Description -->
										<td class="px-3 py-2">
											<input
												type="text"
												required
												value={item.description}
												oninput={(e) => updateItemLine(idx, { description: (e.target as HTMLInputElement).value })}
												placeholder="Ex: Website Institucional com Painel de Gestão"
												class="w-full rounded bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-xs font-sans text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
											/>
										</td>

										<!-- Quantity -->
										<td class="px-2 py-2 text-center">
											<input
												type="number"
												min="1"
												value={item.quantity}
												oninput={(e) => updateItemLine(idx, { quantity: Number((e.target as HTMLInputElement).value) || 1 })}
												class="w-14 rounded bg-zinc-900 border border-zinc-800 px-1.5 py-1 text-center text-xs text-zinc-100 focus:border-zinc-600 focus:outline-none"
											/>
										</td>

										<!-- Unit Price -->
										<td class="px-2 py-2 text-right">
											<input
												type="number"
												min="0"
												value={item.unitPrice}
												oninput={(e) => updateItemLine(idx, { unitPrice: Number((e.target as HTMLInputElement).value) || 0 })}
												class="w-28 rounded bg-zinc-900 border border-zinc-800 px-2 py-1 text-right text-xs text-zinc-100 focus:border-zinc-600 focus:outline-none"
											/>
										</td>

										<!-- Discount % -->
										<td class="px-2 py-2 text-center">
											<input
												type="number"
												min="0"
												max="100"
												value={item.discountPercent}
												oninput={(e) => updateItemLine(idx, { discountPercent: Number((e.target as HTMLInputElement).value) || 0 })}
												class="w-16 rounded bg-zinc-900 border border-zinc-800 px-1.5 py-1 text-center text-xs text-zinc-100 focus:border-zinc-600 focus:outline-none"
											/>
										</td>

										<!-- Line Total -->
										<td class="px-3 py-2 text-right text-zinc-200 font-semibold font-mono text-xs">
											{formatKz(item.total)}
										</td>

										<!-- Delete Button -->
										<td class="px-2 py-2 text-center">
											<button
												type="button"
												onclick={() => removeItem(idx)}
												class="rounded p-1 text-zinc-500 hover:bg-rose-950/40 hover:text-rose-400 transition-colors cursor-pointer"
												title="Remover linha"
											>
												<Icon name="trash" class="w-3.5 h-3.5" />
											</button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>

					<!-- Financial Totals Summary Box -->
					<div class="flex flex-col sm:flex-row items-end justify-between gap-4 pt-2">
						<div class="flex items-center gap-2 text-xs">
							<label for="prop-tax" class="text-zinc-400">Regime de Imposto:</label>
							<select
								id="prop-tax"
								bind:value={taxPercent}
								class="rounded bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-zinc-200 focus:outline-none cursor-pointer"
							>
								<option value={0}>Isento M04 - Regime de Exclusão (0%)</option>
								<option value={14}>IVA Geral Angola (14%)</option>
								<option value={5}>Regime Simplificado (5%)</option>
							</select>
						</div>

						<div class="w-full sm:w-64 space-y-1.5 rounded-lg bg-zinc-950 border border-zinc-800 p-3 font-mono text-xs">
							<div class="flex justify-between text-zinc-400">
								<span>Subtotal:</span>
								<span class="text-zinc-200">{formatKz(financialTotals.subtotal)}</span>
							</div>

							{#if taxPercent > 0}
								<div class="flex justify-between text-zinc-400">
									<span>Imposto ({taxPercent}%):</span>
									<span class="text-zinc-200">{formatKz(financialTotals.taxAmount)}</span>
								</div>
							{/if}

							<div class="flex justify-between text-sm font-bold text-emerald-400 border-t border-zinc-800 pt-1.5">
								<span>Total Geral:</span>
								<span>{formatKz(financialTotals.total)}</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Section 3: Commercial Terms -->
				<div class="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 space-y-3">
					<h4 class="text-xs font-semibold text-zinc-200">3. Condições Comerciais & Pagamento</h4>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
						<div class="space-y-1">
							<label for="prop-pay" class="block text-[11px] font-medium text-zinc-300">
								Condições de Pagamento
							</label>
							<input
								id="prop-pay"
								type="text"
								bind:value={paymentTerms}
								class="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-zinc-100 focus:border-zinc-600 focus:outline-none"
							/>
						</div>

						<div class="space-y-1">
							<label for="prop-del" class="block text-[11px] font-medium text-zinc-300">
								Prazo de Entrega / Implementação
							</label>
							<input
								id="prop-del"
								type="text"
								bind:value={deliveryTerms}
								class="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-zinc-100 focus:border-zinc-600 focus:outline-none"
							/>
						</div>
					</div>

					<div class="space-y-1">
						<label for="prop-bank" class="block text-[11px] font-medium text-zinc-300">
							Dados Bancários para Adjudicação (IBAN)
						</label>
						<input
							id="prop-bank"
							type="text"
							bind:value={bankDetails}
							class="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-zinc-100 font-mono focus:border-zinc-600 focus:outline-none"
						/>
					</div>
				</div>

				<!-- Footer Actions -->
				<div class="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-800">
					<button
						type="button"
						onclick={() => proposalsStore.closeEditor()}
						class="rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 cursor-pointer transition-colors"
					>
						Cancelar
					</button>

					<button
						type="submit"
						class="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-white cursor-pointer transition-colors shadow-sm"
					>
						<Icon name="check" class="w-3.5 h-3.5" />
						<span>{proposalsStore.editingProposal ? 'Salvar Proposta' : 'Emitir Proposta'}</span>
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
