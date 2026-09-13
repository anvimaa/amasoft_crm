<script lang="ts">
	import { toast } from '../stores/toast.svelte';
	import Icon from './Icon.svelte';
</script>

<div class="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
	{#each toast.toasts as item (item.id)}
		<div
			class="pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-5 {item.type === 'success' ? 'bg-zinc-950 border-emerald-900/60 text-zinc-100' : item.type === 'error' ? 'bg-zinc-950 border-rose-900/60 text-zinc-100' : 'bg-zinc-950 border-zinc-800 text-zinc-100'}"
		>
			<div class="shrink-0 mt-0.5">
				{#if item.type === 'success'}
					<div class="rounded-full bg-emerald-950/80 p-1 text-emerald-400 border border-emerald-800/40">
						<Icon name="check" class="w-3.5 h-3.5" />
					</div>
				{:else if item.type === 'error'}
					<div class="rounded-full bg-rose-950/80 p-1 text-rose-400 border border-rose-800/40">
						<Icon name="close" class="w-3.5 h-3.5" />
					</div>
				{:else}
					<div class="rounded-full bg-zinc-800 p-1 text-zinc-300">
						<Icon name="dashboard" class="w-3.5 h-3.5" />
					</div>
				{/if}
			</div>

			<div class="flex-1 min-w-0">
				<h4 class="text-xs font-semibold text-white leading-snug">{item.title}</h4>
				{#if item.description}
					<p class="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">{item.description}</p>
				{/if}
			</div>

			<button
				type="button"
				onclick={() => toast.dismiss(item.id)}
				class="shrink-0 rounded p-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
			>
				<Icon name="close" class="w-3.5 h-3.5" />
			</button>
		</div>
	{/each}
</div>
