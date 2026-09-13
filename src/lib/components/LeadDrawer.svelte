<script lang="ts">
	import { crmStore } from '../stores/crm.svelte';
	import { companyStore } from '../stores/company.svelte';
	import Icon from './Icon.svelte';
	import StatusBadge from './StatusBadge.svelte';
	import PriorityBadge from './PriorityBadge.svelte';
	import type { ClientLead, InteractionOutcome, LeadPriority, LeadStatus, NoteType } from '../types/crm';
	import { generateWhatsAppLink, WHATSAPP_TEMPLATES, WHATSAPP_CATEGORIES } from '../utils/whatsapp';
	import { formatKz } from '../utils/format';

	import { toast } from '../stores/toast.svelte';

	let lead = $derived(crmStore.selectedLead);
	
	let selectedTemplateId = $state<string>(WHATSAPP_TEMPLATES[0].id);
	let customMessage = $state<string>('');
	let newNoteText = $state<string>('');
	let newNoteChannel = $state<NoteType>('general');
	let newNoteOutcome = $state<InteractionOutcome | ''>('');
	let newNoteNextFollowUp = $state<string>('');
	let noteChannelFilter = $state<'all' | NoteType>('all');
	let isConfirmingDelete = $state<boolean>(false);

	let activeTab = $state<'whatsapp' | 'notes' | 'details'>('whatsapp');

	// Contact & follow-up drafts (synced from selected lead)
	let decisionMaker = $state<string>('');
	let decisionMakerRole = $state<string>('');
	let email = $state<string>('');
	let assignedTo = $state<string>('');
	let emailError = $state<string>('');
	let followUpDraft = $state<string>('');

	$effect(() => {
		if (lead) {
			const t = WHATSAPP_TEMPLATES.find(x => x.id === selectedTemplateId) || WHATSAPP_TEMPLATES[0];
			const assigneeName = lead.assignedTo ? companyStore.getMemberByName(lead.assignedTo)?.name : undefined;
			customMessage = t.getText(lead.title, lead.categoryName, lead.city || 'Angola', companyStore.company, assigneeName);
			isConfirmingDelete = false;
			decisionMaker = lead.decisionMaker || '';
			decisionMakerRole = lead.decisionMakerRole || '';
			email = lead.email || '';
			assignedTo = lead.assignedTo || '';
			emailError = '';
			followUpDraft = lead.nextFollowUpDate ? lead.nextFollowUpDate.slice(0, 10) : '';
			if (!newNoteNextFollowUp) newNoteNextFollowUp = '';
		}
	});

	let filteredNotes = $derived.by(() => {
		if (!lead) return [];
		if (noteChannelFilter === 'all') return lead.notes;
		return lead.notes.filter((n) => (n.type || 'general') === noteChannelFilter);
	});

	let followUpState = $derived.by(() => {
		if (!lead?.nextFollowUpDate) return { label: 'Sem agendamento', overdue: false } as const;
		const day = new Date(lead.nextFollowUpDate);
		if (isNaN(day.getTime())) return { label: lead.nextFollowUpDate, overdue: false } as const;
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const d = new Date(day.getFullYear(), day.getMonth(), day.getDate());
		const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
		const label = d.toLocaleDateString('pt-AO', { dateStyle: 'medium' });
		if (diff < 0) return { label: `Atrasado desde ${label}`, overdue: true } as const;
		if (diff === 0) return { label: `Hoje · ${label}`, overdue: false } as const;
		if (diff === 1) return { label: `Amanhã · ${label}`, overdue: false } as const;
		return { label, overdue: false } as const;
	});

	function handleTemplateChange(templateId: string) {
		selectedTemplateId = templateId;
		if (lead) {
			const t = WHATSAPP_TEMPLATES.find(x => x.id === templateId) || WHATSAPP_TEMPLATES[0];
			const assigneeName = lead.assignedTo ? companyStore.getMemberByName(lead.assignedTo)?.name : undefined;
			customMessage = t.getText(lead.title, lead.categoryName, lead.city || 'Angola', companyStore.company, assigneeName);
		}
	}

	function sendWhatsApp() {
		if (!lead?.phone) {
			toast.error('Contacto Indisponível', `A empresa "${lead?.title}" não possui número de telefone registado.`);
			return;
		}
		const url = generateWhatsAppLink(lead.phone, customMessage);
		if (url) {
			window.open(url, '_blank');
			crmStore.addNote(lead.id, `Mensagem de abordagem enviada via WhatsApp:\n\n${customMessage}`, 'whatsapp');
			toast.success('WhatsApp Aberto', `Conversa iniciada com ${lead.title}.`);
		}
	}

	function handleAddNote() {
		if (lead && newNoteText.trim()) {
			crmStore.logInteraction(lead.id, newNoteText.trim(), newNoteChannel, {
				outcome: newNoteOutcome || null,
				nextFollowUp: newNoteNextFollowUp || null
			});
			newNoteText = '';
			newNoteOutcome = '';
			newNoteNextFollowUp = '';
			toast.success('Atividade registada', 'Interação guardada e acompanhamento atualizado.');
		}
	}

	function isValidEmail(v: string): boolean {
		return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
	}

	function handleSaveContact() {
		if (!lead) return;
		if (email.trim() && !isValidEmail(email)) {
			emailError = 'Email inválido. Verifique o formato.';
			return;
		}
		emailError = '';
		crmStore.updateLead({
			...lead,
			decisionMaker: decisionMaker.trim() || undefined,
			decisionMakerRole: decisionMakerRole.trim() || undefined,
			email: email.trim() || undefined,
			assignedTo: assignedTo.trim() || undefined
		});
		toast.success('Contacto atualizado', 'Dados do decisor guardados.');
	}

	function handleSaveFollowUp() {
		if (!lead) return;
		crmStore.scheduleFollowUp(lead.id, followUpDraft || null);
		toast.success('Acompanhamento atualizado', followUpDraft ? `Próximo passo agendado.` : 'Agendamento removido.');
	}

	function handleCompleteFollowUp() {
		if (!lead) return;
		crmStore.completeFollowUp(lead.id);
		followUpDraft = '';
	}

	function formatDate(isoString: string): string {
		try {
			return new Date(isoString).toLocaleString('pt-AO', {
				dateStyle: 'short',
				timeStyle: 'short'
			});
		} catch {
			return isoString;
		}
	}
</script>

{#if crmStore.isDrawerOpen && lead}
	<!-- Backdrop -->
	<button
		type="button"
		class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity w-full h-full border-0 cursor-default"
		onclick={() => crmStore.selectLead(null)}
		aria-label="Fechar painel"
	></button>

	<!-- Slide-over Drawer Panel -->
	<aside
		class="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col bg-zinc-950 border-l border-zinc-800 shadow-2xl transition-transform overflow-hidden"
	>
		<!-- Header -->
		<div class="flex items-start justify-between border-b border-zinc-800 p-5 bg-zinc-900/60">
			<div class="space-y-1.5 max-w-lg">
				<div class="flex items-center gap-2">
					<PriorityBadge priority={lead.priority} size="sm" />
					<StatusBadge status={lead.status} size="sm" />
				</div>
				<h2 class="text-base font-semibold text-zinc-100 leading-tight">{lead.title}</h2>
				<p class="text-xs text-zinc-400">{lead.categoryName} • {lead.city || 'Angola'}</p>
			</div>

			<button
				type="button"
				onclick={() => crmStore.selectLead(null)}
				class="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
			>
				<Icon name="close" class="w-4 h-4" />
			</button>
		</div>

		<!-- Quick Modifiers -->
		<div class="grid grid-cols-2 gap-3 px-5 py-3 bg-zinc-900/30 border-b border-zinc-800 text-xs">
			<div>
				<label for="drawer-status" class="block text-[11px] font-medium text-zinc-400 mb-1">Estágio Comercial</label>
				<select
					id="drawer-status"
					value={lead.status}
					onchange={(e) => lead && crmStore.updateStatus(lead.id, (e.target as HTMLSelectElement).value as LeadStatus)}
					class="w-full rounded-md bg-zinc-900 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-zinc-500 focus:outline-none"
				>
					<option value="lead">Novo Lead</option>
					<option value="contacted">Em Contacto</option>
					<option value="meeting">Qualificação / Reunião</option>
					<option value="proposal">Proposta Enviada</option>
					<option value="won">Cliente Fechado</option>
					<option value="lost">Desqualificado</option>
				</select>
			</div>

			<div>
				<label for="drawer-priority" class="block text-[11px] font-medium text-zinc-400 mb-1">Nível de Prioridade</label>
				<select
					id="drawer-priority"
					value={lead.priority}
					onchange={(e) => lead && crmStore.updatePriority(lead.id, (e.target as HTMLSelectElement).value as LeadPriority)}
					class="w-full rounded-md bg-zinc-900 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-zinc-500 focus:outline-none"
				>
					<option value="hot">Alta</option>
					<option value="warm">Média</option>
					<option value="cold">Baixa</option>
				</select>
			</div>
		</div>

		<!-- Next follow-up banner -->
		<div class="flex flex-col sm:flex-row sm:items-center gap-2.5 px-5 py-3 bg-zinc-900/30 border-b border-zinc-800 text-xs">
			<div class="flex items-center gap-2 flex-1 min-w-0">
				<Icon name="calendar" class="w-3.5 h-3.5 {followUpState.overdue ? 'text-rose-400' : 'text-zinc-400'}" />
				<span class="text-[11px] font-medium text-zinc-400">Próximo passo:</span>
				<span class="text-xs font-semibold {followUpState.overdue ? 'text-rose-300' : 'text-zinc-100'} truncate">{followUpState.label}</span>
			</div>
			<div class="flex items-center gap-2">
				<input
					type="date"
					bind:value={followUpDraft}
					aria-label="Data do próximo acompanhamento"
					class="rounded-md bg-zinc-900 border border-zinc-700 px-2 py-1 text-xs text-zinc-200 focus:border-zinc-500 focus:outline-none"
				/>
				<button
					type="button"
					onclick={handleSaveFollowUp}
					class="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-900 hover:bg-white cursor-pointer"
				>
					Agendar
				</button>
				{#if lead.nextFollowUpDate}
					<button
						type="button"
						onclick={handleCompleteFollowUp}
						title="Marcar acompanhamento como concluído"
						class="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800 cursor-pointer"
					>
						Concluir
					</button>
				{/if}
			</div>
		</div>

		<!-- Tabs Bar -->
		<div class="flex border-b border-zinc-800 px-5 bg-zinc-900/20">
			<button
				type="button"
				onclick={() => activeTab = 'whatsapp'}
				class="flex items-center gap-1.5 border-b-2 py-2.5 px-3 text-xs font-medium transition-colors cursor-pointer {activeTab === 'whatsapp' ? 'border-zinc-100 text-zinc-100' : 'border-transparent text-zinc-400 hover:text-zinc-200'}"
			>
				<Icon name="whatsapp" class="w-3.5 h-3.5 text-emerald-400" />
				Abordagem Comercial
			</button>
			<button
				type="button"
				onclick={() => activeTab = 'notes'}
				class="flex items-center gap-1.5 border-b-2 py-2.5 px-3 text-xs font-medium transition-colors cursor-pointer {activeTab === 'notes' ? 'border-zinc-100 text-zinc-100' : 'border-transparent text-zinc-400 hover:text-zinc-200'}"
			>
				<Icon name="edit" class="w-3.5 h-3.5 text-zinc-400" />
				Registo de Atividades ({lead.notes.length})
			</button>
			<button
				type="button"
				onclick={() => activeTab = 'details'}
				class="flex items-center gap-1.5 border-b-2 py-2.5 px-3 text-xs font-medium transition-colors cursor-pointer {activeTab === 'details' ? 'border-zinc-100 text-zinc-100' : 'border-transparent text-zinc-400 hover:text-zinc-200'}"
			>
				<Icon name="building" class="w-3.5 h-3.5 text-zinc-400" />
				Dados Cadastrais
			</button>
		</div>

		<!-- Content Area -->
		<div class="flex-1 overflow-y-auto p-5 space-y-5">
			
			<!-- TAB 1: WHATSAPP OUTREACH -->
			{#if activeTab === 'whatsapp'}
				<div class="space-y-4">
					<div class="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3.5 flex items-center justify-between text-xs">
						<div class="flex items-center gap-2 text-zinc-300">
							<Icon name="phone" class="w-3.5 h-3.5 text-zinc-400" />
							<span>Contacto: <strong class="font-mono text-zinc-100">{lead.phone || 'Não disponível'}</strong></span>
						</div>
						{#if !lead.website}
							<span class="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300 border border-zinc-700/60">
								Sem Website Registado
							</span>
						{/if}
					</div>

					<!-- Template Selector with Categories -->
					<div>
						<label for="template-picker" class="block text-xs font-medium text-zinc-300 mb-2">Modelos de Comunicação ({WHATSAPP_TEMPLATES.length})</label>
						<div class="space-y-3">
							{#each Object.entries(WHATSAPP_CATEGORIES) as [catKey, catInfo]}
								{@const catTemplates = WHATSAPP_TEMPLATES.filter(t => t.category === catKey)}
								{#if catTemplates.length > 0}
									<div>
										<div class="flex items-center gap-2 mb-1.5">
											<span class="w-2 h-2 rounded-full" style="background-color: {catInfo.color}"></span>
											<span class="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">{catInfo.label}</span>
										</div>
										<div class="grid grid-cols-1 gap-1.5">
											{#each catTemplates as template (template.id)}
												<button
													type="button"
													onclick={() => handleTemplateChange(template.id)}
													class="text-left p-2.5 rounded-lg border transition-all cursor-pointer {selectedTemplateId === template.id ? 'border-zinc-500 bg-zinc-900 text-white' : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'}"
												>
													<div class="text-[11px] font-semibold">{template.title}</div>
													<div class="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{template.description}</div>
												</button>
											{/each}
										</div>
									</div>
								{/if}
							{/each}
						</div>
					</div>

					<!-- Editable Message Area -->
					<div>
						<label for="custom-msg" class="block text-xs font-medium text-zinc-300 mb-1.5">Mensagem Pronta para Envio</label>
						<textarea
							id="custom-msg"
							rows="8"
							bind:value={customMessage}
							class="w-full rounded-lg bg-zinc-900 border border-zinc-800 p-3 text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none leading-relaxed font-sans"
						></textarea>
					</div>

					<!-- Send Button -->
					<button
						type="button"
						onclick={sendWhatsApp}
						disabled={!lead.phone}
						class="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
					>
						<Icon name="whatsapp" class="w-4 h-4" />
						Abrir Conversa no WhatsApp
					</button>
				</div>

			<!-- TAB 2: NOTES & TIMELINE -->
			{:else if activeTab === 'notes'}
				<div class="space-y-4">
					<!-- Add Note Form -->
					<div class="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3.5 space-y-2.5">
						<span class="text-xs font-medium text-zinc-200">Novo Registo de Atividade</span>
						
						<div class="flex flex-wrap gap-1.5">
							<button
								type="button"
								onclick={() => newNoteChannel = 'general'}
								class="rounded px-2 py-0.5 text-xs font-medium cursor-pointer {newNoteChannel === 'general' ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-800 text-zinc-400'}"
							>
								Geral
							</button>
							<button
								type="button"
								onclick={() => newNoteChannel = 'whatsapp'}
								class="rounded px-2 py-0.5 text-xs font-medium cursor-pointer {newNoteChannel === 'whatsapp' ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-800 text-zinc-400'}"
							>
								WhatsApp
							</button>
							<button
								type="button"
								onclick={() => newNoteChannel = 'call'}
								class="rounded px-2 py-0.5 text-xs font-medium cursor-pointer {newNoteChannel === 'call' ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-800 text-zinc-400'}"
							>
								Chamada
							</button>
							<button
								type="button"
								onclick={() => newNoteChannel = 'visit'}
								class="rounded px-2 py-0.5 text-xs font-medium cursor-pointer {newNoteChannel === 'visit' ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-800 text-zinc-400'}"
							>
								Visita
							</button>
							<button
								type="button"
								onclick={() => newNoteChannel = 'email'}
								class="rounded px-2 py-0.5 text-xs font-medium cursor-pointer {newNoteChannel === 'email' ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-800 text-zinc-400'}"
							>
								Email
							</button>
							<button
								type="button"
								onclick={() => newNoteChannel = 'meeting'}
								class="rounded px-2 py-0.5 text-xs font-medium cursor-pointer {newNoteChannel === 'meeting' ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-800 text-zinc-400'}"
							>
								Reunião
							</button>
						</div>

						<textarea
							rows="3"
							bind:value={newNoteText}
							placeholder="Adicionar nota sobre o contacto ou alinhamento com a empresa..."
							class="w-full rounded-md bg-zinc-950 border border-zinc-800 p-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
						></textarea>

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
							<div>
								<label for="note-outcome" class="block text-[11px] font-medium text-zinc-400 mb-1">Resultado do contacto</label>
								<select
									id="note-outcome"
									bind:value={newNoteOutcome}
									class="w-full rounded-md bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none"
								>
									<option value="">Sem resultado</option>
									<option value="sem-resposta">Sem resposta</option>
									<option value="contactado">Contactado</option>
									<option value="interessado">Interessado</option>
									<option value="proposta-pedida">Proposta pedida</option>
									<option value="recusou">Recusou</option>
								</select>
							</div>
							<div>
								<label for="note-next" class="block text-[11px] font-medium text-zinc-400 mb-1">Próximo acompanhamento</label>
								<input
									id="note-next"
									type="date"
									bind:value={newNoteNextFollowUp}
									class="w-full rounded-md bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none"
								/>
							</div>
						</div>

						<div class="flex justify-end">
							<button
								type="button"
								onclick={handleAddNote}
								disabled={!newNoteText.trim()}
								class="rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-white disabled:opacity-40 cursor-pointer"
							>
								Salvar Registo
							</button>
						</div>
					</div>

					<!-- Timeline -->
					<div class="space-y-2.5 pt-1">
						<div class="flex items-center justify-between">
							<span class="text-xs font-medium text-zinc-400 uppercase tracking-wider">Histórico</span>
							<select
								bind:value={noteChannelFilter}
								aria-label="Filtrar histórico por canal"
								class="rounded-md bg-zinc-950 border border-zinc-800 px-2 py-1 text-[11px] text-zinc-300 focus:border-zinc-600 focus:outline-none"
							>
								<option value="all">Todos os canais</option>
								<option value="whatsapp">WhatsApp</option>
								<option value="call">Chamadas</option>
								<option value="visit">Visitas</option>
								<option value="email">Emails</option>
								<option value="meeting">Reuniões</option>
								<option value="general">Notas gerais</option>
							</select>
						</div>
						
						{#each filteredNotes as note (note.id)}
							<div class="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3 space-y-1">
								<div class="flex items-center justify-between text-[11px]">
									<span class="font-medium text-zinc-300">
										{#if note.type === 'call'}Chamada Telefónica
										{:else if note.type === 'whatsapp'}WhatsApp
										{:else if note.type === 'visit'}Visita Presencial
										{:else if note.type === 'email'}Email
										{:else if note.type === 'meeting'}Reunião / Demonstração
										{:else}Nota Interna{/if}
										{#if note.outcome}
											<span class="ml-1.5 rounded bg-zinc-800 px-1.5 py-0.2 text-[10px] text-zinc-400 border border-zinc-700/60">{note.outcome}</span>
										{/if}
									</span>
									<span class="text-zinc-500 font-mono">{formatDate(note.createdAt)}</span>
								</div>
								<p class="text-xs text-zinc-300 whitespace-pre-line leading-relaxed">{note.content}</p>
							</div>
						{:else}
							<div class="text-center py-6 text-xs text-zinc-500">
								{#if noteChannelFilter === 'all'}
									Nenhum histórico registado.
								{:else}
									Sem registos neste canal.
								{/if}
							</div>
						{/each}
					</div>
				</div>

		<!-- TAB 3: DETAILS -->
		{:else if activeTab === 'details'}
			<div class="space-y-4 text-xs">
				
				<!-- Contact & Decisor -->
				<div class="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 space-y-3">
					<div class="flex items-center justify-between">
						<span class="font-semibold text-zinc-200">Contacto & Decisor</span>
						<span class="text-[10px] text-zinc-500">Campos para equipa comercial</span>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
						<div>
							<label for="det-decision" class="block text-[11px] font-medium text-zinc-500 mb-1">Nome do Decisor</label>
							<input
								id="det-decision"
								type="text"
								bind:value={decisionMaker}
								placeholder="Ex: João Silva, Directora Comercial..."
								class="w-full rounded bg-zinc-950 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
							/>
						</div>

						<div>
							<label for="det-role" class="block text-[11px] font-medium text-zinc-500 mb-1">Cargo / Função</label>
							<input
								id="det-role"
								type="text"
								bind:value={decisionMakerRole}
								placeholder="Ex: CEO, Gerente de TI..."
								class="w-full rounded bg-zinc-950 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
							/>
						</div>

						<div>
							<label for="det-email" class="block text-[11px] font-medium text-zinc-500 mb-1">Email</label>
							<div class="flex gap-1.5">
								<input
									id="det-email"
									type="email"
									bind:value={email}
									placeholder="Ex: nome@empresa.co.ao"
									class="w-full rounded bg-zinc-950 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
								/>
								{#if email.trim()}
									<a
										href="mailto:{email.trim()}"
										class="shrink-0 rounded bg-zinc-800 border border-zinc-700 px-2 py-1.5 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
										title="Abrir cliente de email"
									>
										<Icon name="mail" class="w-3.5 h-3.5" />
									</a>
								{/if}
							</div>
							{#if emailError}
								<p class="mt-1 text-[11px] text-rose-400">{emailError}</p>
							{/if}
						</div>

						<div>
							<label for="det-phone" class="block text-[11px] font-medium text-zinc-500 mb-1">Telefone Principal</label>
							<div class="flex gap-1.5">
								<span class="flex-1 rounded bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 font-mono text-xs text-zinc-200">
									{lead.phone || 'Não informado'}
								</span>
								{#if lead.phone}
									<a
										href="tel:{lead.phone}"
										class="shrink-0 rounded bg-zinc-800 border border-zinc-700 px-2 py-1.5 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
										title="Ligar"
									>
										<Icon name="phone" class="w-3.5 h-3.5" />
									</a>
									<a
										href="https://wa.me/{lead.phoneUnformatted || lead.phone}"
										target="_blank"
										rel="noopener noreferrer"
										class="shrink-0 rounded bg-zinc-800 border border-zinc-700 px-2 py-1.5 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
										title="WhatsApp"
									>
										<Icon name="whatsapp" class="w-3.5 h-3.5 text-emerald-400" />
									</a>
								{/if}
							</div>
						</div>

						<div class="sm:col-span-2">
							<label for="det-assigned" class="block text-[11px] font-medium text-zinc-500 mb-1">Responsável</label>
							<div class="flex gap-1.5">
								<select
									id="det-assigned"
									bind:value={assignedTo}
									class="flex-1 rounded bg-zinc-950 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-zinc-500 focus:outline-none"
								>
									<option value="">Sem responsável</option>
									{#each companyStore.activeMembers as member (member.id)}
										<option value={member.name}>{member.name} — {member.role}</option>
									{/each}
									{#each crmStore.availableAssignees as a (a)}
										{#if !companyStore.getMemberByName(a)}
											<option value={a}>{a}</option>
										{/if}
									{/each}
								</select>
							</div>
						</div>
					</div>

					<div class="flex justify-end pt-1">
						<button
							type="button"
							onclick={handleSaveContact}
							class="rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-white cursor-pointer"
						>
							Guardar Contacto
						</button>
					</div>
				</div>

				<!-- Company Details -->
				<div class="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 space-y-3">
					<span class="font-semibold text-zinc-200">Dados Cadastrais</span>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
						<div>
							<span class="text-zinc-500 block text-[11px]">Telefone</span>
							<span class="font-mono text-zinc-200 text-xs">{lead.phone || 'Não informado'}</span>
						</div>

						<div>
							<span class="text-zinc-500 block text-[11px]">Província / Cidade</span>
							<span class="text-zinc-200 text-xs">{lead.city || 'Angola'}</span>
						</div>

						<div>
							<span class="text-zinc-500 block text-[11px]">Endereço</span>
							<span class="text-zinc-200 text-xs">{lead.address || 'Não informado'}</span>
						</div>

						<div>
							<span class="text-zinc-500 block text-[11px]">Website</span>
							{#if lead.website}
								<a href={lead.website} target="_blank" rel="noopener noreferrer" class="text-indigo-400 hover:underline">{lead.website}</a>
							{:else}
								<span class="text-zinc-400">Sem Website</span>
							{/if}
						</div>

						<div>
							<span class="text-zinc-500 block text-[11px]">Valor Estimado da Oportunidade</span>
							<input
								type="number"
								value={lead.estimatedValue}
								onchange={(e) => {
									if (lead) {
										lead.estimatedValue = Number((e.target as HTMLInputElement).value);
										crmStore.updateLead(lead);
									}
								}}
								class="w-full mt-1 rounded bg-zinc-950 border border-zinc-700 px-2.5 py-1 text-xs text-zinc-100 focus:border-zinc-500 focus:outline-none font-mono"
							/>
						</div>

						<div>
							<span class="text-zinc-500 block text-[11px]">Setor Comercial</span>
							<span class="text-zinc-200 text-xs">{lead.categoryName}</span>
						</div>
					</div>
				</div>

				<!-- Delete Action -->
				<div class="pt-3 border-t border-zinc-800 flex justify-between items-center text-xs">
					<span class="text-zinc-500 font-mono">ID: {lead.id}</span>
					
					{#if isConfirmingDelete}
						<div class="flex items-center gap-2">
							<span class="text-[11px] text-zinc-400">Tem a certeza?</span>
							<button
								type="button"
								onclick={() => isConfirmingDelete = false}
								class="text-xs text-zinc-400 hover:text-white px-2 py-0.5 rounded cursor-pointer"
							>
								Cancelar
							</button>
							<button
								type="button"
								onclick={() => {
									if (lead) {
										const title = lead.title;
										crmStore.deleteLead(lead.id);
										toast.success('Registo Removido', `A empresa "${title}" foi removida do CRM.`);
									}
								}}
								class="text-xs bg-rose-600 hover:bg-rose-500 text-white font-semibold px-2.5 py-1 rounded cursor-pointer"
							>
								Sim, Excluir
							</button>
						</div>
					{:else}
						<button
							type="button"
							onclick={() => isConfirmingDelete = true}
							class="text-xs text-rose-400 hover:text-rose-300 cursor-pointer flex items-center gap-1"
						>
							<Icon name="trash" class="w-3 h-3" />
							<span>Remover Registo</span>
						</button>
					{/if}
				</div>

			</div>
			{/if}

		</div>
	</aside>
{/if}
