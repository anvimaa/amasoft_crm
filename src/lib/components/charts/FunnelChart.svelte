<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, BarController, BarElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js';

	Chart.register(BarController, BarElement, LinearScale, CategoryScale, Tooltip, Legend);

	interface Props {
		labels: string[];
		data: number[];
		colors: string[];
		height?: number;
		onClick?: (index: number) => void;
	}

	let { labels, data, colors, height = 260, onClick }: Props = $props();

	let canvas = $state<HTMLCanvasElement | null>(null);
	let chart = $state<Chart | null>(null);

	onMount(() => {
		if (!canvas) return;

		chart = new Chart(canvas, {
			type: 'bar',
			data: {
				labels,
				datasets: [{
					data,
					backgroundColor: colors,
					borderColor: colors.map(c => c.replace(')', ', 0.8)').replace('rgb', 'rgba')),
					borderWidth: 0,
					borderRadius: 6,
					borderSkipped: false,
					barPercentage: 0.7,
					categoryPercentage: 0.8
				}]
			},
			options: {
				indexAxis: 'y',
				responsive: true,
				maintainAspectRatio: false,
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
							label: (ctx) => `${ctx.raw} leads`
						}
					}
				},
				scales: {
					x: {
						grid: { color: 'rgba(63, 63, 70, 0.3)' },
						ticks: { color: '#71717a', font: { size: 10 } },
						border: { display: false }
					},
					y: {
						grid: { display: false },
						ticks: { color: '#d4d4d8', font: { size: 11, weight: 500 } },
						border: { display: false }
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
			chart.update('none');
		}
	});
</script>

<div style="height: {height}px;">
	<canvas bind:this={canvas}></canvas>
</div>
