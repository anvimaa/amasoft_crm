<script lang="ts">
	import { companyStore } from '../stores/company.svelte';
	import Icon from './Icon.svelte';
	import { toast } from '../stores/toast.svelte';

	let name = $state<string>('');
	let nif = $state<string>('');
	let sector = $state<string>('');
	let website = $state<string>('');
	let email = $state<string>('');
	let phone = $state<string>('');
	let address = $state<string>('');
	let city = $state<string>('');
	let slogan = $state<string>('');
	let bankName = $state<string>('');
	let bankIban = $state<string>('');
	let bankAccountHolder = $state<string>('');
	let bankSwift = $state<string>('');

	let nameError = $state<string>('');
	let emailError = $state<string>('');

	$effect(() => {
		if (companyStore.isCompanyModalOpen) {
			const c = companyStore.company;
			name = c.name;
			nif = c.nif;
			sector = c.sector;
			website = c.website;
			email = c.email;
			phone = c.phone;
			address = c.address;
			city = c.city;
			slogan = c.slogan || '';
			bankName = c.bankName || '';
			bankIban = c.bankIban || '';
			bankAccountHolder = c.bankAccountHolder || '';
			bankSwift = c.bankSwift || '';
			nameError = '';
			emailError = '';
		}
	});

	function isValidEmail(v: string): boolean {
		return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
	}

	function handleSave() {
		nameError = '';
		emailError = '';

		if (!name.trim()) {
			nameError = 'Nome da empresa é obrigatório.';
			return;
		}
		if (email.trim() && !isValidEmail(email)) {
			emailError = 'Email inválido.';
			return;
		}

		companyStore.updateCompany({
			name: name.trim(),
			nif: nif.trim(),
			sector: sector.trim(),
			website: website.trim(),
			email: email.trim(),
			phone: phone.trim(),
			address: address.trim(),
			city: city.trim(),
			slogan: slogan.trim(),
			bankName: bankName.trim() || undefined,
			bankIban: bankIban.trim() || undefined,
			bankAccountHolder: bankAccountHolder.trim() || undefined,
			bankSwift: bankSwift.trim() || undefined
		});

		toast.success('Empresa atualizada', 'Dados cadastrais e bancários guardados.');
		companyStore.isCompanyModalOpen = false;
	}
</script>

{#if companyStore.isCompanyModalOpen}
	<div class="fixed inset-0 z-[80] flex items-center justify-center p-4">
		<!-- Static Backdrop (does not close on click) -->
		<div
			class="absolute inset-0 bg-black/70 backdrop-blur-sm"
			aria-hidden="true"
		></div>

		<!-- Modal -->
		<div class="relative w-full max-w-xl rounded-xl border border-zinc-800 bg-[#0c0d12] shadow-2xl overflow-hidden">
			<!-- Header -->
			<div class="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
				<div class="flex items-center gap-3">
					<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700">
						<Icon name="building" class="w-4 h-4 text-zinc-300" />
					</div>
					<div>
						<h2 class="text-sm font-semibold text-zinc-100">Dados da Empresa</h2>
						<p class="text-[11px] text-zinc-400">Informação que aparece nos templates WhatsApp</p>
					</div>
				</div>
				<button
					type="button"
					onclick={() => companyStore.isCompanyModalOpen = false}
					class="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white cursor-pointer"
				>
					<Icon name="close" class="w-4 h-4" />
				</button>
			</div>

			<!-- Form -->
			<div class="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
				<!-- Nome + NIF -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div>
						<label for="company-name" class="block text-[11px] font-medium text-zinc-400 mb-1">Nome da Empresa *</label>
						<input
							id="company-name"
							type="text"
							bind:value={name}
							class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
							placeholder="Ex: Amasoft Technologies"
						/>
						{#if nameError}
							<p class="mt-1 text-[11px] text-rose-400">{nameError}</p>
						{/if}
					</div>
					<div>
						<label for="company-nif" class="block text-[11px] font-medium text-zinc-400 mb-1">NIF</label>
						<input
							id="company-nif"
							type="text"
							bind:value={nif}
							class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
							placeholder="Número de identificação fiscal"
						/>
					</div>
				</div>

				<!-- Setor + Cidade -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div>
						<label for="company-sector" class="block text-[11px] font-medium text-zinc-400 mb-1">Setor de Atividade</label>
						<input
							id="company-sector"
							type="text"
							bind:value={sector}
							class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
							placeholder="Ex: Tecnologia & Software"
						/>
					</div>
					<div>
						<label for="company-city" class="block text-[11px] font-medium text-zinc-400 mb-1">Cidade</label>
						<input
							id="company-city"
							type="text"
							bind:value={city}
							class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
							placeholder="Ex: Luanda"
						/>
					</div>
				</div>

				<!-- Email + Telefone -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div>
						<label for="company-email" class="block text-[11px] font-medium text-zinc-400 mb-1">Email</label>
						<input
							id="company-email"
							type="email"
							bind:value={email}
							class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
							placeholder="comercial@empresa.co.ao"
						/>
						{#if emailError}
							<p class="mt-1 text-[11px] text-rose-400">{emailError}</p>
						{/if}
					</div>
					<div>
						<label for="company-phone" class="block text-[11px] font-medium text-zinc-400 mb-1">Telefone</label>
						<input
							id="company-phone"
							type="tel"
							bind:value={phone}
							class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
							placeholder="+244 923 456 789"
						/>
					</div>
				</div>

				<!-- Website -->
				<div>
					<label for="company-website" class="block text-[11px] font-medium text-zinc-400 mb-1">Website</label>
					<input
						id="company-website"
						type="url"
						bind:value={website}
						class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
						placeholder="https://empresa.co.ao"
					/>
				</div>

				<!-- Morada -->
				<div>
					<label for="company-address" class="block text-[11px] font-medium text-zinc-400 mb-1">Morada</label>
					<input
						id="company-address"
						type="text"
						bind:value={address}
						class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
						placeholder="Rua, bairro, cidade"
					/>
				</div>

				<!-- Slogan -->
				<div>
					<label for="company-slogan" class="block text-[11px] font-medium text-zinc-400 mb-1">Slogan / Assinatura</label>
					<input
						id="company-slogan"
						type="text"
						bind:value={slogan}
						class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
						placeholder="Aparece no final das mensagens WhatsApp"
					/>
					<p class="mt-1 text-[10px] text-zinc-500">Aparece como assinatura nos templates de prospecção</p>
				</div>

				<!-- Coordenadas Bancárias -->
				<div class="pt-2 border-t border-zinc-800/80 space-y-3">
					<div class="flex items-center gap-2">
						<Icon name="money" class="w-3.5 h-3.5 text-emerald-400" />
						<span class="text-xs font-semibold text-zinc-200">Coordenadas Bancárias (para Propostas & PDF)</span>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div>
							<label for="company-bank-name" class="block text-[11px] font-medium text-zinc-400 mb-1">Nome do Banco</label>
							<input
								id="company-bank-name"
								type="text"
								bind:value={bankName}
								class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
								placeholder="Ex: Banco BAI, BFA, Standard Bank"
							/>
						</div>
						<div>
							<label for="company-bank-swift" class="block text-[11px] font-medium text-zinc-400 mb-1">Código SWIFT / BIC</label>
							<input
								id="company-bank-swift"
								type="text"
								bind:value={bankSwift}
								class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none font-mono"
								placeholder="Ex: BAIAOALU"
							/>
						</div>
					</div>

					<div>
						<label for="company-bank-iban" class="block text-[11px] font-medium text-zinc-400 mb-1">IBAN Oficial (Angola AO06)</label>
						<input
							id="company-bank-iban"
							type="text"
							bind:value={bankIban}
							class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none font-mono"
							placeholder="AO06 0040 0000 1234 5678 9012 3"
						/>
					</div>

					<div>
						<label for="company-bank-holder" class="block text-[11px] font-medium text-zinc-400 mb-1">Titular da Conta Bancária</label>
						<input
							id="company-bank-holder"
							type="text"
							bind:value={bankAccountHolder}
							class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
							placeholder="Nome da razão social ou titular"
						/>
					</div>
				</div>
			</div>

			<!-- Footer -->
			<div class="flex justify-end gap-2 px-5 py-3 border-t border-zinc-800 bg-zinc-950/40">
				<button
					type="button"
					onclick={() => companyStore.isCompanyModalOpen = false}
					class="rounded-md border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 cursor-pointer"
				>
					Cancelar
				</button>
				<button
					type="button"
					onclick={handleSave}
					class="rounded-md bg-zinc-100 px-4 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-white cursor-pointer"
				>
					Guardar
				</button>
			</div>
		</div>
	</div>
{/if}
