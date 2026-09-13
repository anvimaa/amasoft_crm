<script lang="ts">
	import { companyStore } from '../stores/company.svelte';
	import Icon from './Icon.svelte';
	import { toast } from '../stores/toast.svelte';
	import type { TeamMember } from '../types/crm';

	const ROLE_OPTIONS = [
		'Administrador',
		'Comercial',
		'Técnico',
		'Diretor',
		'Gerente',
		'Marketing',
		'Suporte',
		'Estagiário'
	];

	const COLOR_OPTIONS = [
		'#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
		'#ec4899', '#14b8a6', '#f97316', '#6366f1', '#06b6d4'
	];

	let editingId = $state<string | null>(null);
	let isAdding = $state<boolean>(false);

	let formName = $state<string>('');
	let formRole = $state<string>('');
	let formEmail = $state<string>('');
	let formPhone = $state<string>('');
	let formColor = $state<string>(COLOR_OPTIONS[0]);
	let formIsActive = $state<boolean>(true);

	let nameError = $state<string>('');
	let emailError = $state<string>('');

	function resetForm() {
		formName = '';
		formRole = ROLE_OPTIONS[1];
		formEmail = '';
		formPhone = '';
		formColor = COLOR_OPTIONS[companyStore.team.length % COLOR_OPTIONS.length];
		formIsActive = true;
		nameError = '';
		emailError = '';
		editingId = null;
		isAdding = false;
	}

	function startAdd() {
		resetForm();
		isAdding = true;
		formRole = ROLE_OPTIONS[1];
	}

	function startEdit(member: TeamMember) {
		editingId = member.id;
		isAdding = false;
		formName = member.name;
		formRole = member.role;
		formEmail = member.email;
		formPhone = member.phone;
		formColor = member.color;
		formIsActive = member.isActive;
		nameError = '';
		emailError = '';
	}

	function isValidEmail(v: string): boolean {
		return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
	}

	function handleSave() {
		nameError = '';
		emailError = '';

		if (!formName.trim()) {
			nameError = 'Nome é obrigatório.';
			return;
		}
		if (formEmail.trim() && !isValidEmail(formEmail)) {
			emailError = 'Email inválido.';
			return;
		}

		if (editingId) {
			companyStore.updateMember(editingId, {
				name: formName.trim(),
				role: formRole,
				email: formEmail.trim(),
				phone: formPhone.trim(),
				color: formColor,
				isActive: formIsActive
			});
			toast.success('Membro atualizado', `${formName.trim()} foi atualizado.`);
		} else {
			companyStore.addMember({
				name: formName.trim(),
				role: formRole,
				email: formEmail.trim(),
				phone: formPhone.trim(),
				isActive: formIsActive
			});
			toast.success('Membro adicionado', `${formName.trim()} foi adicionado à equipa.`);
		}

		resetForm();
	}

	function handleDelete(id: string, memberName: string) {
		companyStore.deleteMember(id);
		toast.success('Membro removido', `${memberName} foi removido da equipa.`);
		if (editingId === id) resetForm();
	}

	function getInitials(name: string): string {
		return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
	}

	function getRoleBadgeColor(role: string): string {
		const lower = role.toLowerCase();
		if (lower.includes('admin')) return 'bg-emerald-900/40 text-emerald-300 border-emerald-800/60';
		if (lower.includes('comercial') || lower.includes('vendas')) return 'bg-blue-900/40 text-blue-300 border-blue-800/60';
		if (lower.includes('técnico') || lower.includes('tecnico')) return 'bg-purple-900/40 text-purple-300 border-purple-800/60';
		if (lower.includes('diretor') || lower.includes('gerente')) return 'bg-amber-900/40 text-amber-300 border-amber-800/60';
		return 'bg-zinc-800/60 text-zinc-300 border-zinc-700/60';
	}
</script>

{#if companyStore.isTeamModalOpen}
	<div class="fixed inset-0 z-[80] flex items-center justify-center p-4">
		<!-- Static Backdrop (does not close on click) -->
		<div
			class="absolute inset-0 bg-black/70 backdrop-blur-sm"
			aria-hidden="true"
		></div>

		<!-- Modal -->
		<div class="relative w-full max-w-2xl rounded-xl border border-zinc-800 bg-[#0c0d12] shadow-2xl overflow-hidden">
			<!-- Header -->
			<div class="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
				<div class="flex items-center gap-3">
					<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700">
						<Icon name="user" class="w-4 h-4 text-zinc-300" />
					</div>
					<div>
						<h2 class="text-sm font-semibold text-zinc-100">Gestão de Equipa</h2>
						<p class="text-[11px] text-zinc-400">{companyStore.team.length} membro{companyStore.team.length !== 1 ? 's' : ''} registado{companyStore.team.length !== 1 ? 's' : ''}</p>
					</div>
				</div>
				<div class="flex items-center gap-2">
					{#if !isAdding && !editingId}
						<button
							type="button"
							onclick={startAdd}
							class="flex items-center gap-1.5 rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-white cursor-pointer"
						>
							<Icon name="plus" class="w-3 h-3 text-zinc-950" />
							Adicionar
						</button>
					{/if}
					<button
						type="button"
						onclick={() => { companyStore.isTeamModalOpen = false; resetForm(); }}
						class="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white cursor-pointer"
					>
						<Icon name="close" class="w-4 h-4" />
					</button>
				</div>
			</div>

			<div class="flex max-h-[70vh]">
				<!-- Left: Member List -->
				<div class="flex-1 overflow-y-auto border-r border-zinc-800 p-4 space-y-2 {editingId || isAdding ? 'hidden sm:block sm:w-1/2' : 'w-full'}">
					{#if companyStore.team.length === 0}
						<div class="text-center py-8 text-zinc-500 text-xs">
							Nenhum membro registado.
						</div>
					{/if}

					{#each companyStore.team as member (member.id)}
						<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
						<div role="button" tabindex="0" class="group flex items-center gap-3 rounded-lg border p-3 transition-colors cursor-pointer {editingId === member.id ? 'border-zinc-600 bg-zinc-800/60' : 'border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/40'}" onclick={() => startEdit(member)} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') startEdit(member); }}>
							<!-- Avatar -->
							<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style="background-color: {member.color}">
								{getInitials(member.name)}
							</div>

							<!-- Info -->
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2">
									<span class="text-xs font-semibold text-zinc-200 truncate">{member.name}</span>
									{#if !member.isActive}
										<span class="rounded bg-zinc-800 px-1.5 py-0.2 text-[9px] text-zinc-500 border border-zinc-700">Inativo</span>
									{/if}
								</div>
								<div class="flex items-center gap-2 mt-0.5">
									<span class="rounded border px-1.5 py-0.2 text-[9px] font-medium {getRoleBadgeColor(member.role)}">
										{member.role}
									</span>
									{#if member.email}
										<span class="text-[10px] text-zinc-500 truncate">{member.email}</span>
									{/if}
								</div>
							</div>

							<!-- Actions -->
							<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
								<button
									type="button"
									onclick={(e) => { e.stopPropagation(); companyStore.toggleMemberActive(member.id); }}
									class="rounded p-1 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 cursor-pointer"
									title={member.isActive ? 'Desativar' : 'Ativar'}
								>
									<Icon name={member.isActive ? 'check' : 'close'} class="w-3 h-3" />
								</button>
								<button
									type="button"
									onclick={(e) => { e.stopPropagation(); handleDelete(member.id, member.name); }}
									class="rounded p-1 text-zinc-400 hover:bg-rose-900/40 hover:text-rose-300 cursor-pointer"
									title="Remover"
								>
									<Icon name="trash" class="w-3 h-3" />
								</button>
							</div>
						</div>
					{/each}
				</div>

				<!-- Right: Form -->
				{#if editingId || isAdding}
					<div class="w-full sm:w-1/2 p-4 space-y-3 overflow-y-auto">
						<div class="flex items-center justify-between">
							<span class="text-xs font-semibold text-zinc-200">
								{editingId ? 'Editar Membro' : 'Novo Membro'}
							</span>
							<button
								type="button"
								onclick={resetForm}
								class="text-[11px] text-zinc-400 hover:text-zinc-200 cursor-pointer sm:hidden"
							>
								Voltar
							</button>
						</div>

						<!-- Avatar Preview + Color Picker -->
						<div class="flex items-center gap-3">
							<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style="background-color: {formColor}">
								{formName.trim() ? getInitials(formName) : '??'}
							</div>
							<div class="flex flex-wrap gap-1.5">
								{#each COLOR_OPTIONS as color}
									<button
										type="button"
										onclick={() => formColor = color}
										class="h-6 w-6 rounded-full border-2 transition-all cursor-pointer {formColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'}"
										style="background-color: {color}"
										title={color}
									></button>
								{/each}
							</div>
						</div>

						<!-- Nome -->
						<div>
							<label for="member-name" class="block text-[11px] font-medium text-zinc-400 mb-1">Nome *</label>
							<input
								id="member-name"
								type="text"
								bind:value={formName}
								class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
								placeholder="Nome completo"
							/>
							{#if nameError}
								<p class="mt-1 text-[11px] text-rose-400">{nameError}</p>
							{/if}
						</div>

						<!-- Cargo -->
						<div>
							<label for="member-role" class="block text-[11px] font-medium text-zinc-400 mb-1">Cargo</label>
							<select
								id="member-role"
								bind:value={formRole}
								class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none"
							>
								{#each ROLE_OPTIONS as role}
									<option value={role}>{role}</option>
								{/each}
							</select>
						</div>

						<!-- Email -->
						<div>
							<label for="member-email" class="block text-[11px] font-medium text-zinc-400 mb-1">Email</label>
							<input
								id="member-email"
								type="email"
								bind:value={formEmail}
								class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
								placeholder="email@exemplo.com"
							/>
							{#if emailError}
								<p class="mt-1 text-[11px] text-rose-400">{emailError}</p>
							{/if}
						</div>

						<!-- Telefone -->
						<div>
							<label for="member-phone" class="block text-[11px] font-medium text-zinc-400 mb-1">Telefone</label>
							<input
								id="member-phone"
								type="tel"
								bind:value={formPhone}
								class="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
								placeholder="+244 9XX XXX XXX"
							/>
						</div>

						<!-- Ativo -->
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={formIsActive}
								class="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-zinc-200 focus:ring-zinc-600"
							/>
							<span class="text-xs text-zinc-300">Membro ativo</span>
						</label>

						<!-- Save -->
						<div class="flex justify-end gap-2 pt-2">
							<button
								type="button"
								onclick={resetForm}
								class="rounded-md border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 cursor-pointer"
							>
								Cancelar
							</button>
							<button
								type="button"
								onclick={handleSave}
								class="rounded-md bg-zinc-100 px-4 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-white cursor-pointer"
							>
								{editingId ? 'Atualizar' : 'Adicionar'}
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
