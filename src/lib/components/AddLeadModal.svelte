<script lang="ts">
	import { crmStore } from '../stores/crm.svelte';
	import { companyStore } from '../stores/company.svelte';
	import Icon from './Icon.svelte';
	import type { LeadPriority, LeadStatus } from '../types/crm';

	let title = $state('');
	let categoryName = $state('Prestação de Serviços');
	let city = $state('Luanda');
	let phone = $state('');
	let website = $state('');
	let address = $state('');
	let status = $state<LeadStatus>('lead');
	let priority = $state<LeadPriority>('cold');
	let estimatedValue = $state<number>(0);

	let isExpandedOptional = $state<boolean>(false);
	let decisionMaker = $state('');
	let email = $state('');
	let assignedTo = $state('');
	let emailError = $state('');
	let nextFollowUp = $state('');

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (!title.trim()) return;

		if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
			emailError = 'Email inválido';
			return;
		}
		emailError = '';

		crmStore.addLead({
			title: title.trim(),
			categoryName: categoryName.trim(),
			categories: [categoryName.trim()],
			city: city.trim(),
			phone: phone.trim() || null,
			phoneUnformatted: phone.replace(/[^0-9]/g, '') || null,
			website: website.trim() || null,
			address: address.trim() || null,
			neighborhood: null,
			street: address.trim() || null,
			postalCode: null,
			state: null,
			countryCode: 'AO',
			location: null,
			plusCode: null,
			status,
			priority,
			estimatedValue: Number(estimatedValue) || 0,
			tags: [categoryName, city, !website ? 'Sem Website' : 'Com Website'],
			lastContactDate: null,
			nextFollowUpDate: nextFollowUp || null,
			decisionMaker: decisionMaker.trim() || undefined,
			email: email.trim() || undefined,
			assignedTo: assignedTo.trim() || undefined
		});

		// Reset & Close
		title = '';
		phone = '';
		website = '';
		address = '';
		estimatedValue = 0;
		decisionMaker = '';
		email = '';
		assignedTo = '';
		nextFollowUp = '';
		isExpandedOptional = false;
		crmStore.isAddModalOpen = false;
	}
</script>

{#if crmStore.isAddModalOpen}
	<!-- Static Backdrop (does not close on click) -->
	<div
		class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm w-full h-full"
		aria-hidden="true"
	></div>

	<!-- Modal Wrapper -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
		<div
			class="pointer-events-auto relative w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
		>
			<div class="flex items-center justify-between border-b border-zinc-800 pb-3">
				<div>
					<h3 class="text-sm font-semibold text-zinc-100">Registo de Nova Empresa</h3>
					<p class="text-xs text-zinc-400">Preencha os dados cadastrais para iniciar a prospecção</p>
				</div>
				<button
					type="button"
					onclick={() => crmStore.isAddModalOpen = false}
					class="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
				>
					<Icon name="close" class="w-4 h-4" />
				</button>
			</div>

			<form onsubmit={handleSubmit} class="space-y-3 text-xs">
				<div>
					<label for="new-title" class="block text-[11px] font-medium text-zinc-400 mb-1">Razão Social / Nome Comercial *</label>
					<input
						id="new-title"
						type="text"
						required
						bind:value={title}
						placeholder="Ex: Sonangol E.P., Unitel, Tech Solutions Lda..."
						class="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
					/>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="new-category" class="block text-[11px] font-medium text-zinc-400 mb-1">Setor de Atividade</label>
						<input
							id="new-category"
							type="text"
							bind:value={categoryName}
							placeholder="Ex: Consultoria, Construção..."
							class="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-zinc-100 focus:border-zinc-600 focus:outline-none"
						/>
					</div>

					<div>
						<label for="new-city" class="block text-[11px] font-medium text-zinc-400 mb-1">Cidade / Província</label>
						<input
							id="new-city"
							type="text"
							bind:value={city}
							placeholder="Ex: Luanda, Benguela, Lobito..."
							class="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-zinc-100 focus:border-zinc-600 focus:outline-none"
						/>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="new-phone" class="block text-[11px] font-medium text-zinc-400 mb-1">Telefone (Angola +244)</label>
						<input
							id="new-phone"
							type="text"
							bind:value={phone}
							placeholder="Ex: +244 923 000 000"
							class="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-zinc-100 focus:border-zinc-600 focus:outline-none font-mono"
						/>
					</div>

					<div>
						<label for="new-web" class="block text-[11px] font-medium text-zinc-400 mb-1">Website (se aplicável)</label>
						<input
							id="new-web"
							type="text"
							bind:value={website}
							placeholder="Ex: https://empresa.co.ao"
							class="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-zinc-100 focus:border-zinc-600 focus:outline-none"
						/>
					</div>
				</div>

				<div>
					<label for="new-address" class="block text-[11px] font-medium text-zinc-400 mb-1">Endereço Comercial</label>
					<input
						id="new-address"
						type="text"
						bind:value={address}
						placeholder="Ex: Rua Rainha Ginga, Edifício Kilamba..."
						class="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-zinc-100 focus:border-zinc-600 focus:outline-none"
					/>
				</div>

				<div class="grid grid-cols-3 gap-3">
					<div>
						<label for="new-status" class="block text-[11px] font-medium text-zinc-400 mb-1">Estágio Inicial</label>
						<select
							id="new-status"
							bind:value={status}
							class="w-full rounded-md bg-zinc-900 border border-zinc-800 px-2.5 py-2 text-zinc-200 focus:border-zinc-600 focus:outline-none"
						>
							<option value="lead">Novo Lead</option>
							<option value="contacted">Em Contacto</option>
							<option value="meeting">Qualificação</option>
							<option value="proposal">Proposta</option>
							<option value="won">Fechado</option>
						</select>
					</div>

					<div>
						<label for="new-priority" class="block text-[11px] font-medium text-zinc-400 mb-1">Prioridade</label>
						<select
							id="new-priority"
							bind:value={priority}
							class="w-full rounded-md bg-zinc-900 border border-zinc-800 px-2.5 py-2 text-zinc-200 focus:border-zinc-600 focus:outline-none"
						>
							<option value="hot">Alta</option>
							<option value="warm">Média</option>
							<option value="cold">Baixa</option>
						</select>
					</div>

					<div>
						<label for="new-val" class="block text-[11px] font-medium text-zinc-400 mb-1">Valor Estimado (Kz)</label>
						<input
							id="new-val"
							type="number"
							bind:value={estimatedValue}
							class="w-full rounded-md bg-zinc-900 border border-zinc-800 px-2.5 py-2 text-zinc-100 focus:border-zinc-600 focus:outline-none font-mono"
						/>
					</div>
				</div>

				<!-- Optional fields toggle -->
				<button
					type="button"
					onclick={() => isExpandedOptional = !isExpandedOptional}
					class="w-full flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors cursor-pointer"
				>
					<Icon name="chevron-down" class="w-3.5 h-3.5 {isExpandedOptional ? 'rotate-180' : ''} transition-transform" />
					<span>Dados comerciais (opcional)</span>
				</button>

				{#if isExpandedOptional}
					<div class="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/20 p-3">
						<div class="grid grid-cols-2 gap-3">
							<div>
								<label for="new-decision" class="block text-[11px] font-medium text-zinc-400 mb-1">Decisor</label>
								<input
									id="new-decision"
									type="text"
									bind:value={decisionMaker}
									placeholder="Nome do decisor..."
									class="w-full rounded-md bg-zinc-900 border border-zinc-800 px-2.5 py-2 text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
								/>
							</div>
							<div>
								<label for="new-email" class="block text-[11px] font-medium text-zinc-400 mb-1">Email</label>
								<input
									id="new-email"
									type="email"
									bind:value={email}
									placeholder="Ex: contacto@empresa.co.ao"
									class="w-full rounded-md bg-zinc-900 border border-zinc-800 px-2.5 py-2 text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
								/>
								{#if emailError}
									<p class="mt-1 text-[11px] text-rose-400">{emailError}</p>
								{/if}
							</div>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div>
								<label for="new-assigned" class="block text-[11px] font-medium text-zinc-400 mb-1">Responsável</label>
								<select
									id="new-assigned"
									bind:value={assignedTo}
									class="w-full rounded-md bg-zinc-900 border border-zinc-800 px-2.5 py-2 text-zinc-200 focus:border-zinc-600 focus:outline-none"
								>
									<option value="">Sem responsável</option>
									{#each companyStore.activeMembers as member (member.id)}
										<option value={member.name}>{member.name}</option>
									{/each}
									{#each crmStore.availableAssignees as a (a)}
										{#if !companyStore.getMemberByName(a)}
											<option value={a}>{a}</option>
										{/if}
									{/each}
								</select>
							</div>
							<div>
								<label for="new-followup" class="block text-[11px] font-medium text-zinc-400 mb-1">Próximo acompanhamento</label>
								<input
									id="new-followup"
									type="date"
									bind:value={nextFollowUp}
									class="w-full rounded-md bg-zinc-900 border border-zinc-800 px-2.5 py-2 text-zinc-200 focus:border-zinc-600 focus:outline-none"
								/>
							</div>
						</div>
					</div>
				{/if}

				<div class="flex justify-end gap-2 pt-3 border-t border-zinc-800">
					<button
						type="button"
						onclick={() => crmStore.isAddModalOpen = false}
						class="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-zinc-300 hover:bg-zinc-800 cursor-pointer"
					>
						Cancelar
					</button>
					<button
						type="submit"
						class="rounded-md bg-zinc-100 px-3.5 py-1.5 font-semibold text-zinc-950 hover:bg-white cursor-pointer shadow-sm"
					>
						Criar Registo
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
