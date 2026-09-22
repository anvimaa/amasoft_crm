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
	let activeAgendaTab = $state<'followups' | 'renewals'>('followups');

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
	<!-- Header with Tab Navigation -->
	<div class="rounded-xl bg-zinc-900/60 border border-zinc-800 p-5">
		<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
			<div class="space-y-1">
				<div class="flex items-center gap-2">
					<Icon name="calendar" class="w-5 h-5 text-zinc-400" />
					<span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">A Minha Agenda Operacional</span>
				</div>
				<h1 class="text-base sm:text-lg font-semibold text-zinc-100">
					{#if activeAgendaTab === 'followups'}
						{crmStore.followUpCounts.dueNow} acompanhamentos pendentes para hoje
					{:else}
						{crmStore.stats.expiringSoonSubscriptionsCount} renovações de licenças & avenças nos próximos 30 dias
					{/if}
				</h1>
				<p class="text-xs text-zinc-400">
					{#if activeAgendaTab === 'followups'}
						{crmStore.followUpCounts.overdue} atrasados, {crmStore.followUpCounts.tomorrow} amanhã, {crmStore.followUpCounts.unscheduled} sem data agendada.
					{:else}
						Gestão proativa de renovações de Fact Flexi, sistemas SaaS e contratos de assistência técnica.
					{/if}
				</p>
			</div>

			<!-- Tab switch buttons -->
			<div class="flex items-center gap-2 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
				<button
					type="button"
					onclick={() => activeAgendaTab = 'followups'}
					class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer {activeAgendaTab === 'followups' ? 'bg-zinc-100 text-zinc-950 font-semibold' : 'text-zinc-400 hover:text-white'}"
				>
					<Icon name="calendar" class="w-3.5 h-3.5" />
					<span>Follow-ups ({crmStore.followUpCounts.dueNow})</span>
				</button>
				<button
					type="button"
					onclick={() => activeAgendaTab = 'renewals'}
					class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer {activeAgendaTab === 'renewals' ? 'bg-zinc-100 text-zinc-950 font-semibold' : 'text-zinc-400 hover:text-white'}"
				>
					<Icon name="tag" class="w-3.5 h-3.5" />
					<span>Renovações SaaS ({crmStore.stats.expiringSoonSubscriptionsCount})</span>
				</button>
			</div>
		</div>
	</div>

	<!-- TAB 1: COMMERCIAL FOLLOW-UPS -->
	{#if activeAgendaTab === 'followups'}
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
	{:else if activeAgendaTab === 'renewals'}
		<!-- TAB 2: SAAS LICENSES & RETAINER RENEWALS -->
		<div class="space-y-4">
			<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
				<div class="flex items-center justify-between mb-4">
					<div>
						<h2 class="text-sm font-semibold text-zinc-100">Renovações Próximas & Licenças Vencidas</h2>
						<p class="text-xs text-zinc-400">
							Subscrições de Fact Flexi, CRM e avenças de suporte técnico com necessidade de renovação
						</p>
					</div>
					<span class="rounded-full bg-sky-950 border border-sky-800/80 px-2.5 py-0.5 text-xs font-mono font-bold text-sky-300">
						{crmStore.stats.expiringSubscriptionsList.length} licenças
					</span>
				</div>

				{#if crmStore.stats.expiringSubscriptionsList.length === 0}
					<div class="rounded-lg border border-dashed border-zinc-800/80 p-8 text-center text-xs text-zinc-500 space-y-1">
						<p class="font-semibold text-zinc-400">Nenhuma renovação pendente para os próximos 30 dias</p>
						<p>Todas as licenças e contratos de clientes estão ativos e em dia.</p>
					</div>
				{:else}
					<div class="divide-y divide-zinc-800/80">
						{#each crmStore.stats.expiringSubscriptionsList as item (item.subscription.id)}
							<div class="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-800/20 px-2 rounded-lg transition-colors">
								<div class="space-y-1 min-w-0">
									<div class="flex items-center gap-2 flex-wrap">
										<button
											type="button"
											onclick={() => openDrawer(item.lead)}
											class="text-xs font-semibold text-white hover:text-sky-300 transition-colors cursor-pointer text-left truncate"
										>
											{item.lead.title}
										</button>
										<span class="rounded bg-sky-950/70 border border-sky-800/80 px-2 py-0.2 text-[10px] font-semibold text-sky-300">
											{item.subscription.productName} • {item.subscription.planName}
										</span>
										<span class="rounded px-2 py-0.2 text-[10px] font-semibold border {item.daysUntil < 0 ? 'bg-rose-950/70 text-rose-300 border-rose-800/80' : item.daysUntil <= 7 ? 'bg-amber-950/70 text-amber-300 border-amber-800/80' : 'bg-zinc-800 text-zinc-300 border-zinc-700'}">
											{item.daysUntil < 0 ? `Expirada há ${Math.abs(item.daysUntil)}d` : item.daysUntil === 0 ? 'Expira Hoje' : `Expira em ${item.daysUntil} dias`}
										</span>
									</div>

									<div class="text-[11px] text-zinc-400 flex items-center gap-2 flex-wrap">
										<span>Vencimento: <strong class="text-zinc-200">{item.subscription.renewalDate}</strong></span>
										<span>·</span>
										<span>Ciclo: <strong class="text-zinc-300 capitalize">{item.subscription.billingCycle}</strong></span>
										{#if item.lead.phone}
											<span>·</span>
											<span class="font-mono text-zinc-300">{item.lead.phone}</span>
										{/if}
									</div>
								</div>

								<div class="flex items-center gap-3 flex-shrink-0">
									<div class="text-right">
										<div class="text-xs font-mono font-bold text-emerald-400">{formatKz(item.subscription.priceKz)}</div>
										<span class="text-[10px] text-zinc-500">Valor de Renovação</span>
									</div>

									<button
										type="button"
										onclick={() => openDrawer(item.lead)}
										class="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-white transition-colors cursor-pointer shadow-sm"
									>
										<Icon name="tag" class="w-3.5 h-3.5 text-sky-600" />
										<span>Gerir & Notificar</span>
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
