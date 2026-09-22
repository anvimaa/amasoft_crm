<script lang="ts">
	import { saasStore, type IssuedLicenseRecord } from '../stores/saas.svelte';
	import { crmStore } from '../stores/crm.svelte';
	import { companyStore } from '../stores/company.svelte';
	import { toast } from '../stores/toast.svelte';
	import { formatKz } from '../utils/format';
	import { generateWhatsAppLink } from '../utils/whatsapp';
	import Icon from './Icon.svelte';
	import type { BillingCycle, SaaSProductCatalogItem, SaaSProductPlan } from '../types/crm';

	// Local form state for Product Editor
	let formProductName = $state<string>('');
	let formProductCategory = $state<string>('Faturação Eletrónica & Gestão');
	let formProductDescription = $state<string>('');
	let formProductIcon = $state<string>('tag');

	// Local form state for Plan Editor
	let formPlanName = $state<string>('');
	let formPlanPriceMonthly = $state<number>(25000);
	let formPlanPriceAnnual = $state<number>(250000);
	let formPlanFeaturesText = $state<string>('');

	// Effect to sync Product modal form with editingProduct
	$effect(() => {
		if (saasStore.isProductModalOpen) {
			if (saasStore.editingProduct) {
				formProductName = saasStore.editingProduct.name;
				formProductCategory = saasStore.editingProduct.category;
				formProductDescription = saasStore.editingProduct.description || '';
				formProductIcon = saasStore.editingProduct.icon || 'tag';
			} else {
				formProductName = '';
				formProductCategory = 'Software de Gestão Empresarial';
				formProductDescription = '';
				formProductIcon = 'tag';
			}
		}
	});

	// Effect to sync Plan modal form with editingPlan
	$effect(() => {
		if (saasStore.isPlanModalOpen) {
			if (saasStore.editingPlan) {
				formPlanName = saasStore.editingPlan.name;
				formPlanPriceMonthly = saasStore.editingPlan.priceMonthlyKz;
				formPlanPriceAnnual = saasStore.editingPlan.priceAnnualKz;
				formPlanFeaturesText = (saasStore.editingPlan.features || []).join('\n');
			} else {
				formPlanName = '';
				formPlanPriceMonthly = 25000;
				formPlanPriceAnnual = 250000;
				formPlanFeaturesText = '';
			}
		}
	});

	function handleSaveProduct() {
		if (!formProductName.trim()) {
			toast.error('Campo Obrigatório', 'Indique o nome do software SaaS.');
			return;
		}

		saasStore.saveProduct({
			name: formProductName.trim(),
			category: formProductCategory.trim() || 'Software Corporativo',
			description: formProductDescription.trim(),
			icon: formProductIcon
		});
	}

	function handleSavePlan() {
		if (!saasStore.targetProductIdForPlan) return;
		if (!formPlanName.trim()) {
			toast.error('Campo Obrigatório', 'Indique o nome do plano de subscrição.');
			return;
		}

		const features = formPlanFeaturesText
			.split('\n')
			.map(f => f.trim())
			.filter(f => f.length > 0);

		saasStore.savePlan(saasStore.targetProductIdForPlan, {
			name: formPlanName.trim(),
			priceMonthlyKz: Number(formPlanPriceMonthly) || 0,
			priceAnnualKz: Number(formPlanPriceAnnual) || 0,
			features
		});
	}

	function sendLicenseNotice(rec: IssuedLicenseRecord) {
		const lead = rec.lead;
		const sub = rec.subscription;
		if (!lead.phone) {
			toast.error('Sem Contacto', `A empresa "${lead.title}" não possui telefone registado.`);
			return;
		}

		const comp = companyStore.company;
		const cycleLabels: Record<BillingCycle, string> = {
			monthly: 'Mensal',
			quarterly: 'Trimestral',
			semiannual: 'Semestral',
			annual: 'Anual',
			lifetime: 'Vitalício'
		};

		const bankSection = comp.bankIban
			? `\n*Coordenadas Bancárias:*\n• *Banco:* ${comp.bankName || 'BAI'}\n• *IBAN:* ${comp.bankIban}\n• *Titular:* ${comp.bankAccountHolder || comp.name}`
			: '';

		const message = `*Aviso de Renovação de Licença — ${comp.name}*\n\nEstimada equipa da *${lead.title}*,\n\nEsperamos que se encontrem bem.\n\nInformamos que a subscrição do vosso software *${sub.productName}* (*${sub.planName}*) tem renovação agendada para o dia *${sub.renewalDate}*.\n\n*Detalhes da Subscrição:*\n• *Software:* ${sub.productName}\n• *Plano:* ${sub.planName}\n• *Ciclo:* ${cycleLabels[sub.billingCycle] || sub.billingCycle}\n• *Valor de Renovação:* *${formatKz(sub.priceKz)}*${sub.licenseKey ? `\n• *Chave / Ref:* \`${sub.licenseKey}\`` : ''}${bankSection}\n\nApós o envio do comprovativo, procederemos à extensão imediata da licença no sistema.\n\nCom os melhores cumprimentos,\n*${comp.name}*\n${comp.phone || ''}`;

		const link = generateWhatsAppLink(lead.phone, message);
		if (link) {
			window.open(link, '_blank');
			toast.success('WhatsApp de Renovação', 'Mensagem formatada aberta no WhatsApp.');
		}
	}
</script>

<div class="space-y-6 pb-12">
	
	<!-- Top Header & Action Banner -->
	<div class="rounded-xl bg-zinc-900/60 border border-zinc-800 p-5">
		<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
			<div class="space-y-1">
				<div class="flex items-center gap-2">
					<span class="rounded bg-sky-950 border border-sky-800/80 p-1 text-sky-400">
						<Icon name="tag" class="w-4 h-4" />
					</span>
					<span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Gestão de SaaS & Subscrições</span>
				</div>
				<h1 class="text-base sm:text-lg font-semibold text-zinc-100">
					Catálogo de Softwares & Controlo Global de Licenças
				</h1>
				<p class="text-xs text-zinc-400">
					Administre os softwares próprios da empresa (Fact Flexi, Amasoft CRM), crie planos em Kwanzas e acompanhe todas as instâncias ativas.
				</p>
			</div>

			<div class="flex items-center gap-2.5">
				<button
					type="button"
					onclick={() => saasStore.openNewProduct()}
					class="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3.5 py-2 text-xs font-semibold text-zinc-950 hover:bg-white transition-colors cursor-pointer shadow-sm"
				>
					<Icon name="plus" class="w-3.5 h-3.5" />
					<span>Adicionar Novo SaaS</span>
				</button>
			</div>
		</div>
	</div>

	<!-- 4 Key SaaS Metrics Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		
		<!-- Metric 1: MRR Total SaaS -->
		<div class="rounded-xl border border-sky-900/50 bg-sky-950/20 p-4">
			<div class="flex items-center justify-between">
				<span class="text-xs font-medium text-sky-300">MRR Recorrente SaaS</span>
				<Icon name="money" class="w-4 h-4 text-sky-400" />
			</div>
			<div class="mt-2.5 flex items-baseline gap-2">
				<span class="text-2xl font-semibold tracking-tight text-white font-mono">
					{formatKz(saasStore.stats.totalSaaSMRR)}
				</span>
				<span class="text-xs text-sky-400 font-medium">/ mês</span>
			</div>
			<div class="mt-2 text-[11px] text-zinc-400">
				<span>ARR Projetado:</span>
				<strong class="text-sky-200 font-mono ml-1">{formatKz(saasStore.stats.totalSaaSARR)}</strong>
			</div>
		</div>

		<!-- Metric 2: Active Licenses -->
		<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
			<div class="flex items-center justify-between">
				<span class="text-xs font-medium text-zinc-400">Licenças Ativas</span>
				<Icon name="check" class="w-4 h-4 text-emerald-400" />
			</div>
			<div class="mt-2.5 flex items-baseline gap-2">
				<span class="text-2xl font-semibold tracking-tight text-zinc-100 font-mono">
					{saasStore.stats.activeCount}
				</span>
				<span class="text-xs text-zinc-500">de {saasStore.stats.totalLicenses} emitidas</span>
			</div>
			<div class="mt-2 text-[11px] text-zinc-400">
				<span>{saasStore.stats.expiringSoonCount} a renovar nos próximos 30 dias</span>
			</div>
		</div>

		<!-- Metric 3: Software Products in Catalog -->
		<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
			<div class="flex items-center justify-between">
				<span class="text-xs font-medium text-zinc-400">Softwares no Catálogo</span>
				<Icon name="tag" class="w-4 h-4 text-zinc-500" />
			</div>
			<div class="mt-2.5 flex items-baseline gap-2">
				<span class="text-2xl font-semibold tracking-tight text-zinc-100 font-mono">
					{saasStore.stats.totalProducts}
				</span>
				<span class="text-xs text-zinc-500">produtos</span>
			</div>
			<div class="mt-2 text-[11px] text-zinc-400">
				<span>{saasStore.stats.totalPlans} planos oficiais configurados</span>
			</div>
		</div>

		<!-- Metric 4: Expired / Overdue Licenses -->
		<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
			<div class="flex items-center justify-between">
				<span class="text-xs font-medium text-zinc-400">Licenças Vencidas</span>
				<Icon name="clock" class="w-4 h-4 {saasStore.stats.expiredCount > 0 ? 'text-rose-400' : 'text-zinc-500'}" />
			</div>
			<div class="mt-2.5 flex items-baseline gap-2">
				<span class="text-2xl font-semibold tracking-tight {saasStore.stats.expiredCount > 0 ? 'text-rose-400' : 'text-zinc-100'} font-mono">
					{saasStore.stats.expiredCount}
				</span>
				<span class="text-xs text-zinc-500">para regularização</span>
			</div>
			<div class="mt-2 text-[11px] text-zinc-400">
				<span>{saasStore.stats.expiredCount > 0 ? 'Requer contacto de cobrança' : 'Todas as contas em dia'}</span>
			</div>
		</div>

	</div>

	<!-- Main Navigation Tabs -->
	<div class="flex border-b border-zinc-800 bg-zinc-900/20 px-2 rounded-lg">
		<button
			type="button"
			onclick={() => saasStore.activeTab = 'catalog'}
			class="flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-medium transition-colors cursor-pointer {saasStore.activeTab === 'catalog' ? 'border-sky-400 text-sky-300 font-semibold' : 'border-transparent text-zinc-400 hover:text-zinc-200'}"
		>
			<Icon name="tag" class="w-4 h-4" />
			<span>Catálogo de Softwares & Planos ({saasStore.catalog.length})</span>
		</button>
		<button
			type="button"
			onclick={() => saasStore.activeTab = 'licenses'}
			class="flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-medium transition-colors cursor-pointer {saasStore.activeTab === 'licenses' ? 'border-sky-400 text-sky-300 font-semibold' : 'border-transparent text-zinc-400 hover:text-zinc-200'}"
		>
			<Icon name="file-text" class="w-4 h-4" />
			<span>Todas as Licenças Emitidas ({saasStore.allIssuedLicenses.length})</span>
		</button>
	</div>

	<!-- TAB 1: SAAS PRODUCTS CATALOG -->
	{#if saasStore.activeTab === 'catalog'}
		<div class="space-y-6">
			
			{#each saasStore.catalog as product (product.id)}
				<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-5">
					<!-- Product Header -->
					<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
						<div class="flex items-start gap-3">
							<div class="rounded-xl bg-sky-950/60 p-2.5 text-sky-400 border border-sky-800/60 shrink-0">
								<Icon name={(product.icon || 'tag') as any} class="w-5 h-5" />
							</div>
							<div class="space-y-1">
								<div class="flex items-center gap-2 flex-wrap">
									<h2 class="text-base font-semibold text-white">{product.name}</h2>
									<span class="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-300 border border-zinc-700">
										{product.category}
									</span>
								</div>
								<p class="text-xs text-zinc-400 max-w-2xl">
									{product.description}
								</p>
							</div>
						</div>

						<div class="flex items-center gap-2 shrink-0">
							<button
								type="button"
								onclick={() => saasStore.openNewPlan(product.id)}
								class="flex items-center gap-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 hover:text-white transition-colors cursor-pointer"
							>
								<Icon name="plus" class="w-3.5 h-3.5" />
								<span>Novo Plano</span>
							</button>

							<button
								type="button"
								onclick={() => saasStore.openEditProduct(product)}
								title="Editar Informações do Software"
								class="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
							>
								<Icon name="edit" class="w-4 h-4" />
							</button>

							{#if saasStore.catalog.length > 1}
								<button
									type="button"
									onclick={() => saasStore.openDeleteProduct(product)}
									title="Remover Software do Catálogo"
									class="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-950/60 hover:text-rose-400 transition-colors cursor-pointer"
								>
									<Icon name="trash" class="w-4 h-4" />
								</button>
							{/if}
						</div>
					</div>

					<!-- Plans Grid -->
					<div>
						<div class="flex items-center justify-between mb-3">
							<span class="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
								Planos Oficiais & Tabela de Preços ({product.defaultPlans?.length || 0})
							</span>
						</div>

						{#if !product.defaultPlans || product.defaultPlans.length === 0}
							<div class="rounded-lg border border-dashed border-zinc-800 p-6 text-center text-xs text-zinc-500">
								Nenhum plano configurado para este software. Clique em "Novo Plano" para adicionar.
							</div>
						{:else}
							<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{#each product.defaultPlans as plan, pIdx (plan.name + pIdx)}
									<div class="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3.5 hover:border-zinc-700 transition-colors flex flex-col justify-between">
										<div class="space-y-2">
											<div class="flex items-start justify-between gap-2">
												<h3 class="text-sm font-semibold text-zinc-100">{plan.name}</h3>
												<div class="flex items-center gap-1">
													<button
														type="button"
														onclick={() => saasStore.openEditPlan(product.id, pIdx, plan)}
														title="Editar Plano"
														class="rounded p-1 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
													>
														<Icon name="edit" class="w-3.5 h-3.5" />
													</button>
													<button
														type="button"
														onclick={() => saasStore.openDeletePlan(product.id, pIdx, plan.name)}
														title="Eliminar Plano"
														class="rounded p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
													>
														<Icon name="trash" class="w-3.5 h-3.5" />
													</button>
												</div>
											</div>

											<!-- Prices in Kz -->
											<div class="rounded-lg bg-zinc-900/80 border border-zinc-800/80 p-2.5 space-y-1">
												<div class="flex items-baseline justify-between">
													<span class="text-[11px] text-zinc-400">Mensal:</span>
													<span class="font-mono text-xs font-bold text-emerald-400">
														{formatKz(plan.priceMonthlyKz)} <span class="text-[10px] text-zinc-500 font-normal">/ mês</span>
													</span>
												</div>
												<div class="flex items-baseline justify-between pt-1 border-t border-zinc-800/60">
													<span class="text-[11px] text-zinc-400">Anual:</span>
													<span class="font-mono text-xs font-bold text-sky-400">
														{formatKz(plan.priceAnnualKz)} <span class="text-[10px] text-zinc-500 font-normal">/ ano</span>
													</span>
												</div>
											</div>

											<!-- Features List -->
											{#if plan.features && plan.features.length > 0}
												<div class="space-y-1.5 pt-1">
													<span class="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Recursos Incluídos:</span>
													<ul class="space-y-1 text-xs text-zinc-300">
														{#each plan.features as feat}
															<li class="flex items-center gap-1.5">
																<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
																<span class="text-[11px] text-zinc-300">{feat}</span>
															</li>
														{/each}
													</ul>
												</div>
											{/if}
										</div>

										<div class="pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-500 flex justify-between">
											<span>Tabela oficial</span>
											<span class="font-mono text-zinc-400">Moeda Kz (AOA)</span>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{/each}

		</div>
	{/if}

	<!-- TAB 2: ALL ISSUED CLIENT LICENSES -->
	{#if saasStore.activeTab === 'licenses'}
		<div class="space-y-4">
			
			<!-- Filter & Search Bar -->
			<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
				<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
					<!-- Search -->
					<div>
						<label for="lic-search" class="block text-[10px] font-medium text-zinc-400 mb-1">Pesquisar Licença ou Cliente</label>
						<div class="relative">
							<Icon name="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
							<input
								id="lic-search"
								type="text"
								bind:value={saasStore.search}
								placeholder="Nome do cliente, software, chave..."
								class="w-full rounded-lg bg-zinc-950 border border-zinc-800 pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
							/>
						</div>
					</div>

					<!-- Filter Product -->
					<div>
						<label for="lic-prod" class="block text-[10px] font-medium text-zinc-400 mb-1">Filtrar por Software</label>
						<select
							id="lic-prod"
							bind:value={saasStore.licenseProductFilter}
							class="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-300 focus:border-zinc-600 focus:outline-none"
						>
							<option value="all">Todos os Softwares</option>
							{#each saasStore.catalog as prod}
								<option value={prod.name}>{prod.name}</option>
							{/each}
						</select>
					</div>

					<!-- Filter Status -->
					<div>
						<label for="lic-status" class="block text-[10px] font-medium text-zinc-400 mb-1">Estado da Licença</label>
						<select
							id="lic-status"
							bind:value={saasStore.licenseStatusFilter}
							class="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-300 focus:border-zinc-600 focus:outline-none"
						>
							<option value="all">Todos os Estados</option>
							<option value="active">Ativa (Vigente)</option>
							<option value="expiring">A Expirar nos Próximos 30d</option>
							<option value="expired">Expirada / Vencida</option>
							<option value="trial">Em Período de Teste (Trial)</option>
						</select>
					</div>
				</div>
			</div>

			<!-- Licenses Table Container -->
			<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
				<div class="overflow-x-auto">
					<table class="w-full text-left text-xs text-zinc-300">
						<thead class="bg-zinc-950 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
							<tr>
								<th scope="col" class="px-4 py-3">Cliente / Empresa</th>
								<th scope="col" class="px-4 py-3">Software & Plano</th>
								<th scope="col" class="px-4 py-3">Chave / Instância</th>
								<th scope="col" class="px-4 py-3">Valor Recorrente</th>
								<th scope="col" class="px-4 py-3">Renovação / Validade</th>
								<th scope="col" class="px-4 py-3">Estado</th>
								<th scope="col" class="px-4 py-3 text-right">Ações</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-zinc-800/70">
							{#if saasStore.filteredLicenses.length === 0}
								<tr>
									<td colspan="7" class="px-4 py-10 text-center text-zinc-500">
										Nenhuma licença de software encontrada para os filtros selecionados.
									</td>
								</tr>
							{:else}
								{#each saasStore.filteredLicenses as rec (rec.subscription.id)}
									<tr class="hover:bg-zinc-800/30 transition-colors">
										<!-- Lead / Company -->
										<td class="px-4 py-3">
											<button
												type="button"
												onclick={() => crmStore.selectLead(rec.lead)}
												class="font-semibold text-zinc-100 hover:text-sky-400 transition-colors cursor-pointer text-left line-clamp-1"
											>
												{rec.lead.title}
											</button>
											<div class="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
												<span>{rec.lead.city || 'Angola'}</span>
												{#if rec.lead.phone}
													<span>•</span>
													<span class="font-mono text-zinc-300">{rec.lead.phone}</span>
												{/if}
											</div>
										</td>

										<!-- Software & Plan -->
										<td class="px-4 py-3 whitespace-nowrap">
											<div class="font-medium text-white">{rec.subscription.productName}</div>
											<span class="inline-block rounded bg-sky-950 border border-sky-800/80 px-1.5 py-0.2 text-[10px] text-sky-300 font-semibold mt-0.5">
												{rec.subscription.planName}
											</span>
										</td>

										<!-- Key / URL -->
										<td class="px-4 py-3">
											{#if rec.subscription.licenseKey}
												<div class="font-mono text-[10px] text-zinc-300 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 inline-block max-w-[140px] truncate">
													{rec.subscription.licenseKey}
												</div>
											{/if}
											{#if rec.subscription.instanceUrl}
												<div class="text-[10px] text-sky-400 truncate max-w-[140px]">
													{rec.subscription.instanceUrl}
												</div>
											{/if}
											{#if !rec.subscription.licenseKey && !rec.subscription.instanceUrl}
												<span class="text-[11px] text-zinc-500">—</span>
											{/if}
										</td>

										<!-- Price in Kz -->
										<td class="px-4 py-3 whitespace-nowrap font-mono text-emerald-400 font-bold">
											{formatKz(rec.subscription.priceKz)}
											<span class="text-[10px] text-zinc-500 font-normal font-sans">/ {rec.subscription.billingCycle}</span>
										</td>

										<!-- Renewal countdown -->
										<td class="px-4 py-3 whitespace-nowrap">
											<div class="text-xs text-zinc-200">{rec.subscription.renewalDate}</div>
											<div class="text-[10px] {rec.daysUntil < 0 ? 'text-rose-400 font-bold' : rec.daysUntil <= 7 ? 'text-amber-400 font-semibold' : 'text-zinc-400'}">
												{rec.daysUntil < 0 ? `Vencida há ${Math.abs(rec.daysUntil)}d` : rec.daysUntil === 0 ? 'Vence Hoje' : `Em ${rec.daysUntil} dias`}
											</div>
										</td>

										<!-- Status Badge -->
										<td class="px-4 py-3 whitespace-nowrap">
											<span class="rounded px-2 py-0.5 text-[10px] font-semibold border {rec.isOverdue ? 'bg-rose-950/70 text-rose-300 border-rose-800' : rec.isExpiringSoon ? 'bg-amber-950/70 text-amber-300 border-amber-800' : 'bg-emerald-950/70 text-emerald-300 border-emerald-800'}">
												{rec.isOverdue ? 'Expirada' : rec.isExpiringSoon ? 'A Expirar' : 'Ativa'}
											</span>
										</td>

										<!-- Actions -->
										<td class="px-4 py-3 text-right whitespace-nowrap">
											<div class="flex items-center justify-end gap-1.5">
												<button
													type="button"
													onclick={() => sendLicenseNotice(rec)}
													title="Enviar Notificação / Cobrança WhatsApp"
													class="rounded-lg p-1.5 bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900/60 transition-colors cursor-pointer"
												>
													<Icon name="whatsapp" class="w-3.5 h-3.5" />
												</button>
												<button
													type="button"
													onclick={() => crmStore.selectLead(rec.lead)}
													class="rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer"
												>
													Ficha
												</button>
											</div>
										</td>
									</tr>
								{/each}
							{/if}
						</tbody>
					</table>
				</div>
			</div>

		</div>
	{/if}

</div>

<!-- MODAL: PRODUCT EDITOR (ADD / EDIT SAAS) -->
{#if saasStore.isProductModalOpen}
	<!-- Static Backdrop -->
	<div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm w-full h-full" aria-hidden="true"></div>

	<!-- Modal Dialog -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pointer-events-none">
		<div
			class="pointer-events-auto relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-zinc-800 pb-3">
				<div class="flex items-center gap-2">
					<div class="rounded-lg bg-sky-950/60 p-2 text-sky-400 border border-sky-800/60">
						<Icon name="tag" class="w-4 h-4" />
					</div>
					<div>
						<h3 class="text-sm font-semibold text-white">
							{saasStore.editingProduct ? 'Editar Software SaaS' : 'Cadastrar Novo Software SaaS'}
						</h3>
						<p class="text-[11px] text-zinc-400">
							Configure o produto no catálogo corporativo da empresa
						</p>
					</div>
				</div>
				<button
					type="button"
					onclick={() => saasStore.isProductModalOpen = false}
					class="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
				>
					<Icon name="close" class="w-4 h-4" />
				</button>
			</div>

			<!-- Body -->
			<div class="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
				<!-- Name -->
				<div class="space-y-1">
					<label for="prod-name" class="block text-[11px] font-medium text-zinc-300">Nome Comercial do Software *</label>
					<input
						id="prod-name"
						type="text"
						bind:value={formProductName}
						placeholder="Ex: Fact Flexi, FlexiPOS, Amasoft RH..."
						class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
					/>
				</div>

				<!-- Category & Icon -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div class="space-y-1">
						<label for="prod-cat" class="block text-[11px] font-medium text-zinc-300">Categoria do Produto</label>
						<input
							id="prod-cat"
							type="text"
							bind:value={formProductCategory}
							placeholder="Ex: Faturação Eletrónica AGT, CRM, Gestão..."
							class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
						/>
					</div>

					<div class="space-y-1">
						<label for="prod-icon" class="block text-[11px] font-medium text-zinc-300">Ícone Visual</label>
						<select
							id="prod-icon"
							bind:value={formProductIcon}
							class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white focus:border-zinc-600 focus:outline-none"
						>
							<option value="tag">Etiqueta / Produto (Tag)</option>
							<option value="globe">Web / Global (Globe)</option>
							<option value="money">Finanças / Faturação (Money)</option>
							<option value="sparkles">Inovação / IA (Sparkles)</option>
							<option value="star">Destaque (Star)</option>
							<option value="clock">Tempo / Suporte (Clock)</option>
							<option value="building">Empresarial (Building)</option>
						</select>
					</div>
				</div>

				<!-- Description -->
				<div class="space-y-1">
					<label for="prod-desc" class="block text-[11px] font-medium text-zinc-300">Descrição Comercial & Posicionamento</label>
					<textarea
						id="prod-desc"
						bind:value={formProductDescription}
						rows="3"
						placeholder="Ex: Software de faturação e gestão de stocks certificado pela AGT com módulos de vendas e caixa..."
						class="w-full rounded-lg bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none resize-none"
					></textarea>
				</div>
			</div>

			<!-- Footer -->
			<div class="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
				<button
					type="button"
					onclick={() => saasStore.isProductModalOpen = false}
					class="rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 cursor-pointer"
				>
					Cancelar
				</button>
				<button
					type="button"
					onclick={handleSaveProduct}
					class="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-white cursor-pointer shadow-sm"
				>
					<Icon name="check" class="w-3.5 h-3.5" />
					<span>{saasStore.editingProduct ? 'Salvar Alterações' : 'Criar Software'}</span>
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- MODAL: PLAN EDITOR (ADD / EDIT PLAN) -->
{#if saasStore.isPlanModalOpen}
	<!-- Static Backdrop -->
	<div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm w-full h-full" aria-hidden="true"></div>

	<!-- Modal Dialog -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pointer-events-none">
		<div
			class="pointer-events-auto relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-zinc-800 pb-3">
				<div class="flex items-center gap-2">
					<div class="rounded-lg bg-sky-950/60 p-2 text-sky-400 border border-sky-800/60">
						<Icon name="file-text" class="w-4 h-4" />
					</div>
					<div>
						<h3 class="text-sm font-semibold text-white">
							{saasStore.editingPlanIndex !== null ? 'Editar Plano de Subscrição' : 'Novo Plano Oficial'}
						</h3>
						<p class="text-[11px] text-zinc-400">
							Tabela de preços oficiais em Kwanzas para este plano
						</p>
					</div>
				</div>
				<button
					type="button"
					onclick={() => saasStore.isPlanModalOpen = false}
					class="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
				>
					<Icon name="close" class="w-4 h-4" />
				</button>
			</div>

			<!-- Body -->
			<div class="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
				<!-- Name -->
				<div class="space-y-1">
					<label for="plan-name" class="block text-[11px] font-medium text-zinc-300">Nome do Plano *</label>
					<input
						id="plan-name"
						type="text"
						bind:value={formPlanName}
						placeholder="Ex: Plano Básico Mono-Posto, Plano Profissional..."
						class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
					/>
				</div>

				<!-- Prices in Kz -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div class="space-y-1">
						<label for="plan-monthly" class="block text-[11px] font-medium text-zinc-300">Preço Mensal Oficial (Kz)</label>
						<input
							id="plan-monthly"
							type="number"
							bind:value={formPlanPriceMonthly}
							class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-emerald-400 font-mono font-bold focus:border-zinc-600 focus:outline-none"
						/>
					</div>

					<div class="space-y-1">
						<label for="plan-annual" class="block text-[11px] font-medium text-zinc-300">Preço Anual Oficial (Kz)</label>
						<input
							id="plan-annual"
							type="number"
							bind:value={formPlanPriceAnnual}
							class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-sky-400 font-mono font-bold focus:border-zinc-600 focus:outline-none"
						/>
					</div>
				</div>

				<!-- Features list (multiline) -->
				<div class="space-y-1">
					<label for="plan-feat" class="block text-[11px] font-medium text-zinc-300">Funcionalidades Incluídas (1 por linha)</label>
					<textarea
						id="plan-feat"
						bind:value={formPlanFeaturesText}
						rows="4"
						placeholder="Ex:&#10;1 Posto de Trabalho&#10;Faturação Ilimitada&#10;Certificação AGT&#10;Suporte Standard"
						class="w-full rounded-lg bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none resize-none font-mono"
					></textarea>
				</div>
			</div>

			<!-- Footer -->
			<div class="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
				<button
					type="button"
					onclick={() => saasStore.isPlanModalOpen = false}
					class="rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 cursor-pointer"
				>
					Cancelar
				</button>
				<button
					type="button"
					onclick={handleSavePlan}
					class="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-white cursor-pointer shadow-sm"
				>
					<Icon name="check" class="w-3.5 h-3.5" />
					<span>{saasStore.editingPlanIndex !== null ? 'Salvar Plano' : 'Adicionar Plano'}</span>
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- MODAL: DELETE PRODUCT CONFIRMATION -->
{#if saasStore.deletingProduct}
	<!-- Static Backdrop -->
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
					<h3 class="text-base font-semibold text-white">Remover Software do Catálogo?</h3>
					<p class="text-xs text-zinc-400 leading-relaxed">
						Esta ação removerá o produto <strong class="text-zinc-200">"{saasStore.deletingProduct.name}"</strong> do catálogo oficial de SaaS da empresa.
					</p>
				</div>
			</div>

			<div class="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
				<button
					type="button"
					onclick={() => saasStore.deletingProduct = null}
					class="rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 cursor-pointer"
				>
					Cancelar
				</button>
				<button
					type="button"
					onclick={() => saasStore.confirmDeleteProduct()}
					class="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 cursor-pointer shadow-sm"
				>
					<Icon name="trash" class="w-3.5 h-3.5" />
					<span>Remover Software</span>
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- MODAL: DELETE PLAN CONFIRMATION -->
{#if saasStore.deletingPlan}
	<!-- Static Backdrop -->
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
					<h3 class="text-base font-semibold text-white">Eliminar Plano de Subscrição?</h3>
					<p class="text-xs text-zinc-400 leading-relaxed">
						Tem a certeza que deseja eliminar o plano <strong class="text-zinc-200">"{saasStore.deletingPlan.planName}"</strong>?
					</p>
				</div>
			</div>

			<div class="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
				<button
					type="button"
					onclick={() => saasStore.deletingPlan = null}
					class="rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 cursor-pointer"
				>
					Cancelar
				</button>
				<button
					type="button"
					onclick={() => saasStore.confirmDeletePlan()}
					class="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 cursor-pointer shadow-sm"
				>
					<Icon name="trash" class="w-3.5 h-3.5" />
					<span>Eliminar Plano</span>
				</button>
			</div>
		</div>
	</div>
{/if}
