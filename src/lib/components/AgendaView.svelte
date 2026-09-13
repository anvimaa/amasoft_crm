<script lang="ts">
	import { crmStore } from '../stores/crm.svelte';
	import Icon from './Icon.svelte';
	import PriorityBadge from './PriorityBadge.svelte';
	import StatusBadge from './StatusBadge.svelte';
	import type { ClientLead } from '../types/crm';
	import { generateWhatsAppLink, WHATSAPP_TEMPLATES } from '../utils/whatsapp';
	import { formatKz } from '../utils/format';
	import { toast } from '../stores/toast.svelte';

	let quickRescheduleId = $state<string | null>(null);
	let quickRescheduleDate = $state<string>('');

	function formatDate(isoString: string | null): string {
		if (!isoString) return '—';
		try {
			return new Date(isoString).toLocaleDateString('pt-AO', { dateStyle: 'short' });
		} catch {
			return isoString;
		}
	}

	function daysSince(isoString: string | null): number {
		if (!isoString) return 999;
		const t = new Date(isoString).getTime();
		if (isNaN(t)) return 999;
		return Math.round((Date.now() - t) / 86400000);
	}

	function openWhatsApp(lead: ClientLead) {
		if (!lead.phone) {
			toast.error('Contacto Indisponível', `A empresa "${lead.title}" não possui telefone.`);
			return;
		}
		const url = generateWhatsAppLink(lead.phone, WHATSAPP_TEMPLATES[0].getText(lead.title, lead.categoryName, lead.city || 'Angola'));
		if (url) {
			window.open(url, '_blank');
			crmStore.addNote(lead.id, `Contacto via WhatsApp (Agenda).`, 'whatsapp');
		}
	}

	function openCall(lead: ClientLead) {
		if (!lead.phone) {
			toast.error('Contacto Indisponível', `A empresa "${lead.title}" não possui telefone.`);
			return;
		}
		window.open(`tel:${lead.phone}`, '_self');
		crmStore.addNote(lead.id, `Chamada telefónica iniciada (Agenda).`, 'call');
	}

	function openEmail(lead: ClientLead) {
		if (!lead.email) {
			toast.error('Email Indisponível', `A empresa "${lead.title}" não possui email registado.`);
			return;
		}
		window.open(`mailto:${lead.email}`, '_self');
		crmStore.addNote(lead.id, `Email enviado (Agenda).`, 'email');
	}

	function openDrawer(lead: ClientLead) {
		crmStore.selectLead(lead);
	}

	function startQuickReschedule(lead: ClientLead, e: MouseEvent) {
		e.stopPropagation();
		quickRescheduleId = lead.id;
		quickRescheduleDate = lead.nextFollowUpDate ? lead.nextFollowUpDate.slice(0, 10) : '';
	}

	function confirmQuickReschedule() {
		if (!quickRescheduleId) return;
		crmStore.scheduleFollowUp(quickRescheduleId, quickRescheduleDate || null);
		quickRescheduleId = null;
		quickRescheduleDate = '';
		toast.success('Acompanhamento atualizado', 'Data de follow-up reagendada.');
	}

	function cancelQuickReschedule() {
		quickRescheduleId = null;
		quickRescheduleDate = '';
	}

	function renderLeadRow(lead: ClientLead) {
		const overdue = daysSince(lead.nextFollowUpDate ?? null) < 0;
		const contactAge = daysSince(lead.lastContactDate);
		return { lead, overdue, contactAge };
	}

	type Section = {
		key: string;
		icon: 'clock' | 'calendar';
		iconColor: string;
		title: string;
		count: number;
		leads: ClientLead[];
		emptyText: string;
	};

	let sections = $derived.by<Section[]>(() => {
		const g = crmStore.followUpGroups;
		return [
			{ key: 'overdue', icon: 'clock', iconColor: 'text-rose-400', title: 'Atrasados', count: g.overdue.length, leads: g.overdue, emptyText: 'Nenhum atrasado' },
			{ key: 'today', icon: 'calendar', iconColor: 'text-zinc-100', title: 'Hoje', count: g.today.length, leads: g.today, emptyText: 'Nada agendado para hoje' },
			{ key: 'tomorrow', icon: 'calendar', iconColor: 'text-zinc-300', title: 'Amanhã', count: g.tomorrow.length, leads: g.tomorrow, emptyText: 'Nada agendado para amanhã' },
			{ key: 'next7', icon: 'calendar', iconColor: 'text-zinc-400', title: 'Próximos 7 dias', count: g.next7.length, leads: g.next7, emptyText: 'Nenhum nos próximos 7 dias' },
			{ key: 'unscheduled', icon: 'clock', iconColor: 'text-zinc-500', title: 'Sem agendamento', count: g.unscheduled.length, leads: g.unscheduled.slice(0, 20), emptyText: 'Todos os leads estão agendados' },
		];
	});
</script>

<div class="space-y-6 pb-12">
	<!-- Header -->
	<div class="rounded-xl bg-zinc-900/60 border border-zinc-800 p-5">
		<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
			<div class="space-y-1">
				<div class="flex items-center gap-2">
					<Icon name="calendar" class="w-5 h-5 text-zinc-400" />
					<span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">A Minha Agenda</span>
				</div>
				<h1 class="text-base sm:text-lg font-semibold text-zinc-100">
					{crmStore.followUpCounts.dueNow} acompanhamentos pendentes hoje
				</h1>
				<p class="text-xs text-zinc-400">
					{crmStore.followUpCounts.overdue} atrasados, {crmStore.followUpCounts.tomorrow} amanhã, {crmStore.followUpCounts.unscheduled} sem data agendada.
				</p>
			</div>
		</div>
	</div>

	<!-- Sections -->
	{#each sections as section}
		{#if section.count > 0 || section.key === 'unscheduled'}
			<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
				<div class="flex items-center justify-between mb-4">
					<div class="flex items-center gap-2">
						<Icon name={section.icon} class="w-4 h-4 {section.iconColor}" />
						<h2 class="text-sm font-semibold text-zinc-100">{section.title}</h2>
						<span class="rounded bg-zinc-800 px-1.5 py-0.2 text-[10px] font-mono text-zinc-400 border border-zinc-700/50">
							{section.count}
						</span>
					</div>
				</div>

				{#if section.leads.length === 0}
					<div class="flex items-center gap-2 py-4 text-center text-zinc-600">
						<Icon name={section.icon} class="w-3.5 h-3.5 {section.iconColor} opacity-40" />
						<span class="text-[11px]">{section.emptyText}</span>
					</div>
				{:else}
					<div class="divide-y divide-zinc-800/80">
						{#each section.leads as lead (lead.id)}
							{@const rendered = renderLeadRow(lead)}
							<div class="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-800/20 px-2 rounded-lg transition-colors">
								<div class="space-y-1 min-w-0">
									<div class="flex items-center gap-2">
										<button
											type="button"
											onclick={() => openDrawer(lead)}
											class="text-xs font-semibold text-zinc-100 hover:text-white truncate cursor-pointer"
										>
											{lead.title}
										</button>
										<PriorityBadge priority={lead.priority} size="sm" />
										<StatusBadge status={lead.status} size="sm" />
									</div>
									<div class="text-[11px] text-zinc-400 flex items-center gap-2 flex-wrap">
										<span>{lead.categoryName}</span>
										<span>·</span>
										<span>{lead.city || 'Angola'}</span>
										{#if lead.decisionMaker}
											<span>·</span>
											<span class="text-zinc-300">{lead.decisionMaker}{lead.decisionMakerRole ? ` (${lead.decisionMakerRole})` : ''}</span>
										{/if}
										{#if rendered.contactAge < 999}
											<span>·</span>
											<span class="text-zinc-500">Contactado há {rendered.contactAge}d</span>
										{/if}
									</div>
								</div>

								<div class="flex items-center gap-2 flex-shrink-0">
									<span class="text-xs font-mono text-zinc-300 min-w-[70px] text-right">{formatKz(lead.estimatedValue)}</span>

									{#if quickRescheduleId === lead.id}
										<div class="flex items-center gap-1.5">
											<input
												type="date"
												bind:value={quickRescheduleDate}
												class="rounded bg-zinc-950 border border-zinc-700 px-2 py-1 text-xs text-zinc-200 focus:border-zinc-500 focus:outline-none"
											/>
											<button type="button" onclick={confirmQuickReschedule} class="rounded bg-zinc-100 px-2 py-1 text-[11px] font-semibold text-zinc-900 hover:bg-white cursor-pointer">OK</button>
											<button type="button" onclick={cancelQuickReschedule} class="text-[11px] text-zinc-400 hover:text-white cursor-pointer">X</button>
										</div>
									{:else}
										<button
											type="button"
											onclick={(e) => startQuickReschedule(lead, e)}
											title="Reagendar"
											class="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer"
										>
											Reagendar
										</button>
									{/if}

									{#if lead.phone}
										<button type="button" onclick={() => openWhatsApp(lead)} title="WhatsApp" class="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer">
											<Icon name="whatsapp" class="w-3.5 h-3.5 text-emerald-400" />
										</button>
										<button type="button" onclick={() => openCall(lead)} title="Ligar" class="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer">
											<Icon name="phone" class="w-3.5 h-3.5" />
										</button>
									{/if}
									{#if lead.email}
										<button type="button" onclick={() => openEmail(lead)} title="Email" class="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer">
											<Icon name="mail" class="w-3.5 h-3.5" />
										</button>
									{/if}

									<button
										type="button"
										onclick={() => openDrawer(lead)}
										class="rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer"
									>
										Ficha
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	{/each}
</div>
