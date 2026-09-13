<script lang="ts">
	import type { LeadStatus } from '../types/crm';

	interface Props {
		status: LeadStatus;
		size?: 'sm' | 'md' | 'lg';
		clickable?: boolean;
		onclick?: () => void;
	}

	let { status, size = 'md', clickable = false, onclick }: Props = $props();

	const statusConfig: Record<LeadStatus, { label: string; bg: string; text: string; border: string; dot: string }> = {
		lead: {
			label: 'Novo Lead',
			bg: 'bg-zinc-900/90',
			text: 'text-zinc-300',
			border: 'border-zinc-700/60',
			dot: 'bg-blue-400'
		},
		contacted: {
			label: 'Em Contacto',
			bg: 'bg-amber-950/20',
			text: 'text-amber-300',
			border: 'border-amber-800/40',
			dot: 'bg-amber-400'
		},
		meeting: {
			label: 'Qualificação',
			bg: 'bg-indigo-950/20',
			text: 'text-indigo-300',
			border: 'border-indigo-800/40',
			dot: 'bg-indigo-400'
		},
		proposal: {
			label: 'Proposta Enviada',
			bg: 'bg-sky-950/20',
			text: 'text-sky-300',
			border: 'border-sky-800/40',
			dot: 'bg-sky-400'
		},
		won: {
			label: 'Cliente Fechado',
			bg: 'bg-emerald-950/20',
			text: 'text-emerald-300',
			border: 'border-emerald-800/40',
			dot: 'bg-emerald-400'
		},
		lost: {
			label: 'Desqualificado',
			bg: 'bg-zinc-900/60',
			text: 'text-zinc-400',
			border: 'border-zinc-800',
			dot: 'bg-zinc-500'
		}
	};

	let current = $derived(statusConfig[status] || statusConfig.lead);
	let sizeClasses = $derived(
		size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1.5' :
		size === 'lg' ? 'text-xs px-3 py-1 gap-2' :
		'text-[11px] px-2.5 py-0.5 gap-1.5'
	);
</script>

{#if clickable}
	<button
		type="button"
		{onclick}
		class="inline-flex items-center font-medium rounded-full border transition-all hover:bg-zinc-800 cursor-pointer {current.bg} {current.text} {current.border} {sizeClasses}"
	>
		<span class="w-1.5 h-1.5 rounded-full {current.dot}"></span>
		{current.label}
	</button>
{:else}
	<span
		class="inline-flex items-center font-medium rounded-full border {current.bg} {current.text} {current.border} {sizeClasses}"
	>
		<span class="w-1.5 h-1.5 rounded-full {current.dot}"></span>
		{current.label}
	</span>
{/if}
