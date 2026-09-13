<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';

	Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

	interface Props {
		labels: string[];
		data: number[];
		colors: string[];
		height?: number;
		cutout?: string;
		onClick?: (index: number) => void;
	}

	let { labels, data, colors, height = 240, cutout = '68%', onClick }: Props = $props();

	let canvas = $state<HTMLCanvasElement | null>(null);
	let chart = $state<Chart | null>(null);
	let total = $derived(data.reduce((a, b) => a + b, 0));

	onMount(() => {
		if (!canvas) return;

		chart = new Chart(canvas, {
			type: 'doughnut',
			data: {
				labels,
				datasets: [{
					data,
					backgroundColor: colors,
					borderColor: '#090a0f',
					borderWidth: 3,
					hoverBorderColor: '#18181b',
					hoverOffset: 4
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				cutout,
				plugins: {
					legend: { display: false },
					tooltip: {
						backgroundColor: '#18181b',
						titleColor: '#fafafa',
						bodyColor: '#a1a1aa',
						borderColor: '#27272a',
						borderWidth: 1,
						padding: 10,
						cornerRadius: 8,
						titleFont: { size: 12, weight: 'bold' },
						bodyFont: { size: 11 },
						callbacks: {
							label: (ctx) => {
								const pct = total > 0 ? ((ctx.raw as number) / total * 100).toFixed(1) : '0';
								return ` ${ctx.raw} leads (${pct}%)`;
							}
						}
					}
				},
				onClick: (_event, elements) => {
					if (onClick && elements.length > 0) {
						onClick(elements[0].index);
					}
				}
			}
		});

		return () => {
			chart?.destroy();
		};
	});

	$effect(() => {
		if (chart && data) {
			chart.data.labels = labels;
			chart.data.datasets[0].data = data;
			chart.data.datasets[0].backgroundColor = colors;
			total = data.reduce((a, b) => a + b, 0);
			chart.update('none');
		}
	});
</script>

<div style="height: {height}px;" class="relative">
	<canvas bind:this={canvas}></canvas>
	{#if total > 0}
		<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
			<div class="text-center">
				<span class="text-xl font-semibold text-zinc-100 font-mono">{total}</span>
				<span class="block text-[10px] text-zinc-500 uppercase tracking-wider">Total</span>
			</div>
		</div>
	{/if}
</div>
