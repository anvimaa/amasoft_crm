<script lang="ts">
	import type { LeadPriority } from '../types/crm';

	interface Props {
		priority: LeadPriority;
		size?: 'sm' | 'md';
	}

	let { priority, size = 'md' }: Props = $props();

	const priorityConfig: Record<LeadPriority, { label: string; text: string; bg: string; border: string; indicator: string }> = {
		hot: {
			label: 'Prioridade Alta',
			text: 'text-rose-400',
			bg: 'bg-rose-500/10',
			border: 'border-rose-500/20',
			indicator: 'bg-rose-500'
		},
		warm: {
			label: 'Prioridade Média',
			text: 'text-amber-400',
			bg: 'bg-amber-500/10',
			border: 'border-amber-500/20',
			indicator: 'bg-amber-500'
		},
		cold: {
			label: 'Prioridade Baixa',
			text: 'text-zinc-400',
			bg: 'bg-zinc-800/40',
			border: 'border-zinc-700/40',
			indicator: 'bg-zinc-500'
		}
	};

	let current = $derived(priorityConfig[priority] || priorityConfig.cold);
	let sizeClasses = $derived(size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5');
</script>

<span class="inline-flex items-center gap-1.5 font-medium rounded border {current.bg} {current.text} {current.border} {sizeClasses}">
	<span class="w-1.5 h-1.5 rounded-full {current.indicator}"></span>
	{current.label}
</span>
