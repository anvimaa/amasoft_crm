<script lang="ts">
	import { onMount } from 'svelte';
	import {
		createDefaultRupeData,
		getRupeCurrentDateTime,
		downloadRupeThermalPDF,
		printRupeThermalPDF,
		gerarRupeTalaoTermico,
		printRupeViaBluetooth,
		printRupeViaSerial,
		convertImageToEscPosRaster,
		convertImageToMonochrome,
		BAI_LOGO_BASE64
	} from '../utils/rupe-receipt';
	import { generateRandomRupe, SUGGESTED_RUPE_VALUES, fetchLatestGtpRupeFromApi, formatRupe } from '../utils/gtp-rupe';
	import type { RupeReceiptData, PaperWidth } from '../types/receipt';
	import { toast } from '../stores/toast.svelte';
	import Icon from './Icon.svelte';

	let paperWidth = $state<PaperWidth>(58);
	let dynamicHeight = $state<boolean>(true);
	let isGenerating = $state<boolean>(false);
	let isPrinting = $state<boolean>(false);
	let isBluetoothPrinting = $state<boolean>(false);
	let isSerialPrinting = $state<boolean>(false);
	let showAdvancedTpa = $state<boolean>(false);
	let isSyncingWithGuia = $state<boolean>(false);
	let syncedFromGuia = $state<boolean>(false);

	let formData = $state<RupeReceiptData>(createDefaultRupeData());

	async function syncFromLatestGuia(silent: boolean = false) {
		isSyncingWithGuia = true;
		try {
			const latestGtp = await fetchLatestGtpRupeFromApi();
			if (latestGtp && latestGtp.rupe) {
				const cleanRupe = (latestGtp.rupe || '').replace(/\D/g, '');
				if (cleanRupe) {
					formData.rupe = cleanRupe;
				}
				if (latestGtp.valorTotal) {
					formData.valor = latestGtp.valorTotal;
				}
				if (latestGtp.nif) {
					formData.nif = latestGtp.nif;
				}
				syncedFromGuia = true;
				if (!silent) {
					toast.success('Sincronizado com a Guia', `RUPE ${formatRupe(cleanRupe)} e valor de ${latestGtp.valorTotal} Kz carregados.`);
				}
			} else if (!silent) {
				toast.info('Sem Dados da Guia', 'Nenhuma Guia RUPE salva recentemente.');
			}
		} catch (e) {
			console.error('Erro ao sincronizar com última Guia:', e);
		} finally {
			isSyncingWithGuia = false;
		}
	}

	onMount(async () => {
		// Set live exact timestamp at the moment of opening the RUPE tab
		formData.dataHora = getRupeCurrentDateTime();

		// Pre-warm the ESC/POS monochrome raster bitmap and PDF logo in memory
		convertImageToEscPosRaster(BAI_LOGO_BASE64, 280, 384).catch(() => {});
		convertImageToMonochrome(BAI_LOGO_BASE64).catch(() => {});

		// Automatically sync with the latest Nota de Liquidação (GTP RUPE)
		await syncFromLatestGuia(true);
	});

	function setCurrentDateTime() {
		formData.dataHora = getRupeCurrentDateTime();
		toast.info('Data Atualizada', 'Data e hora definidas para o momento atual.');
	}

	function handleRupeInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const clean = (target.value || '').replace(/\D/g, '').slice(0, 20);
		formData.rupe = clean;
		target.value = clean;
	}

	function resetRupeForm() {
		formData = createDefaultRupeData();
		toast.info('Formulário Restaurado', 'Valores padrão do talão RUPE carregados com a data atual.');
	}

	async function handleDownloadPDF() {
		if (!formData.rupe || !formData.valor) {
			toast.error('Atenção', 'Preencha o Número RUPE e o Valor Pago.');
			return;
		}

		isGenerating = true;
		try {
			const filename = `talao_rupe_${formData.rupe}_${formData.valor}.pdf`;
			await downloadRupeThermalPDF(formData, filename, { paperWidth, dynamicHeight });
			toast.success('Download Concluído', `Talão RUPE exportado em PDF (${paperWidth} mm).`);
		} catch {
			toast.error('Erro ao Gerar PDF', 'Não foi possível gerar o PDF do talão RUPE.');
		} finally {
			isGenerating = false;
		}
	}

	async function handlePrintDriver() {
		if (!formData.rupe || !formData.valor) {
			toast.error('Atenção', 'Preencha o Número RUPE e o Valor Pago.');
			return;
		}

		isPrinting = true;
		try {
			await printRupeThermalPDF(formData, { paperWidth, dynamicHeight });
			toast.info('Impressão Enviada', 'Diálogo de impressão aberto para impressora térmica.');
		} catch {
			toast.error('Erro na Impressão', 'Não foi possível imprimir o documento.');
		} finally {
			isPrinting = false;
		}
	}

	async function handlePrintBluetooth() {
		if (!formData.rupe || !formData.valor) {
			toast.error('Atenção', 'Preencha o Número RUPE e o Valor Pago.');
			return;
		}

		isBluetoothPrinting = true;
		try {
			const result = await printRupeViaBluetooth(formData);
			if (result.success) {
				toast.success('Impressão Bluetooth', result.message);
			} else {
				toast.error('Bluetooth', result.message);
			}
		} catch (err: any) {
			toast.error('Erro Bluetooth', err.message || 'Falha ao comunicar com a impressora.');
		} finally {
			isBluetoothPrinting = false;
		}
	}

	async function handlePrintSerial() {
		if (!formData.rupe || !formData.valor) {
			toast.error('Atenção', 'Preencha o Número RUPE e o Valor Pago.');
			return;
		}

		isSerialPrinting = true;
		try {
			const result = await printRupeViaSerial(formData, 115200);
			if (result.success) {
				toast.success('Impressão Serial', result.message);
			} else {
				toast.error('Porta Serial', result.message);
			}
		} catch (err: any) {
			toast.error('Erro Serial', err.message || 'Falha na porta serial.');
		} finally {
			isSerialPrinting = false;
		}
	}

	async function handleOpenPdfTab() {
		try {
			const doc = await gerarRupeTalaoTermico(formData, { paperWidth, dynamicHeight });
			const blob = doc.output('blob');
			const url = URL.createObjectURL(blob);
			window.open(url, '_blank');
		} catch {
			toast.error('Erro', 'Não foi possível abrir o PDF.');
		}
	}

	function copyJsonData() {
		navigator.clipboard.writeText(JSON.stringify(formData, null, 2));
		toast.success('Copiado', 'Dados do talão RUPE copiados em formato JSON.');
	}
</script>

<div class="space-y-6 pb-12">
	<!-- Receipt Type Tabs -->
	<div class="flex items-center gap-2 border-b border-zinc-800 pb-3 flex-wrap">
		<a
			href="/talao"
			class="flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
		>
			<Icon name="file-text" class="w-4 h-4 text-emerald-400" />
			<span>Talão BUAP (Prova de Vida)</span>
		</a>

		<a
			href="/talao/rupe"
			class="flex items-center gap-2 rounded-lg bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-white border border-zinc-700/60 transition-colors shadow-sm"
		>
			<Icon name="money" class="w-4 h-4 text-amber-400" />
			<span>Talão RUPE Térmico (58 mm)</span>
		</a>

		<a
			href="/gtp-rupe"
			class="flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
		>
			<Icon name="file-text" class="w-4 h-4 text-sky-400" />
			<span>Guia de Liquidação RUPE (A4)</span>
			<span class="rounded bg-sky-950/80 text-sky-300 border border-sky-800/40 text-[10px] font-mono px-1.5 py-0.2">
				Oficial
			</span>
		</a>
	</div>

	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<div class="flex items-center gap-2">
				<h1 class="text-xl font-bold tracking-tight text-white">Talão de Pagamento RUPE (Estado)</h1>
				<span class="rounded-full bg-amber-950/60 px-2.5 py-0.5 text-xs font-mono text-amber-300 border border-amber-900/50">
					Ministério das Finanças • BAI
				</span>
			</div>
			<p class="text-xs text-zinc-400 mt-1">
				Emissão e impressão fiel de comprovativos de Pagamento ao Estado (RUPE) via TPA/Multicaixa em impressoras térmicas (58 mm).
			</p>
		</div>

		<div class="flex items-center gap-2 flex-wrap">
			{#if syncedFromGuia}
				<span class="flex items-center gap-1.5 rounded-md bg-amber-950/40 border border-amber-900/50 px-2.5 py-1 text-[11px] text-amber-300" title="Dados obtidos da última Guia RUPE A4 gerada">
					<Icon name="check" class="w-3 h-3 text-amber-400" />
					<span>Sincronizado da Guia A4</span>
				</span>
			{/if}

			<button
				type="button"
				onclick={() => syncFromLatestGuia(false)}
				disabled={isSyncingWithGuia}
				class="rounded-lg border border-sky-800/70 bg-sky-950/40 px-3 py-1.5 text-xs font-medium text-sky-200 hover:text-white hover:bg-sky-900/60 transition-colors cursor-pointer disabled:opacity-50"
				title="Atualizar talão com os dados da última Guia de Liquidação RUPE salva"
			>
				<Icon name="refresh" class="w-3.5 h-3.5 inline mr-1 text-sky-400 {isSyncingWithGuia ? 'animate-spin' : ''}" />
				<span>Importar da Guia RUPE</span>
			</button>

			<button
				type="button"
				onclick={resetRupeForm}
				class="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
			>
				<Icon name="refresh" class="w-3.5 h-3.5 inline mr-1 text-zinc-400" />
				<span>Restaurar Padrão</span>
			</button>
		</div>
	</div>

	<!-- Main Grid: Form Inputs (Left) & Thermal Preview (Right) -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
		<!-- Left: Form Controls (7 cols) -->
		<div class="lg:col-span-7 space-y-5">
			<!-- Primary Essential Fields Card -->
			<div class="rounded-xl border border-zinc-800/80 bg-zinc-950 p-5 space-y-4 shadow-sm">
				<div class="flex items-center gap-2 border-b border-zinc-800/70 pb-3">
					<Icon name="money" class="w-4 h-4 text-amber-400" />
					<span class="text-xs font-semibold uppercase tracking-wider text-zinc-200">
						Dados Principais do Pagamento
					</span>
				</div>

				<div class="space-y-4">
					<!-- RUPE Input -->
					<div>
						<div class="flex items-center justify-between mb-1">
							<label for="rupe" class="block text-xs font-medium text-zinc-300">
								Número RUPE (20 dígitos) *
							</label>
							<button
								type="button"
								onclick={() => {
									formData.rupe = generateRandomRupe();
									toast.info('RUPE Gerado', 'Nova referência RUPE de 20 dígitos criada.');
								}}
								class="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
							>
								<Icon name="refresh" class="w-3 h-3" />
								<span>Gerar RUPE</span>
							</button>
						</div>
						<div class="relative">
							<input
								id="rupe"
								type="text"
								inputmode="numeric"
								maxlength="20"
								value={formData.rupe}
								oninput={handleRupeInput}
								placeholder="Ex: 60201260200438206869"
								class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 pr-16 text-sm font-mono text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
							/>
							<span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-mono {formData.rupe.length === 20 ? 'text-amber-400 font-semibold' : 'text-zinc-500'}">
								{formData.rupe.length}/20
							</span>
						</div>
						<div class="flex items-center justify-between mt-0.5 text-[11px] text-zinc-400">
							<span>Formatado: <strong class="text-zinc-200 font-mono">{formatRupe(formData.rupe) || '—'}</strong></span>
							{#if formData.rupe.length === 20}
								<span class="text-amber-400 flex items-center gap-0.5">
									<Icon name="check" class="w-3 h-3" />
									<span>20 dígitos completos</span>
								</span>
							{/if}
						</div>
					</div>

					<!-- Valor / Montante & Moeda -->
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<div class="sm:col-span-2">
							<label for="valor" class="block text-xs font-medium text-zinc-300 mb-1">
								Valor Pago (Montante) *
							</label>
							<input
								id="valor"
								type="text"
								bind:value={formData.valor}
								placeholder="Ex: 7398,00"
								class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-sm font-mono text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
							/>
						</div>
						<div>
							<label for="moeda" class="block text-xs font-medium text-zinc-300 mb-1">
								Moeda
							</label>
							<input
								id="moeda"
								type="text"
								bind:value={formData.moeda}
								class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-sm font-mono text-white focus:border-amber-500 focus:outline-none"
							/>
						</div>
					</div>

					<!-- Valores Sugestivos -->
					<div>
						<span class="block text-[11px] font-medium text-zinc-400 mb-1.5">
							Valores Sugestivos:
						</span>
						<div class="flex items-center gap-1.5 flex-wrap">
							{#each SUGGESTED_RUPE_VALUES as val}
								<button
									type="button"
									onclick={() => {
										formData.valor = val;
									}}
									class="rounded-md border px-2.5 py-1 text-xs font-mono transition-all cursor-pointer {formData.valor === val
										? 'bg-amber-950/80 border-amber-500/80 text-amber-300 font-semibold shadow-sm'
										: 'border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:border-zinc-700 hover:text-white'}"
								>
									{val}
								</button>
							{/each}
						</div>
					</div>

					<!-- Data e Hora de Pagamento -->
					<div>
						<div class="flex items-center justify-between mb-1">
							<label for="dataHora" class="block text-xs font-medium text-zinc-300">
								Data e Hora do Pagamento *
							</label>
							<button
								type="button"
								onclick={setCurrentDateTime}
								class="text-[11px] text-amber-400 hover:text-amber-300 font-medium transition-colors cursor-pointer"
							>
								Inserir Data/Hora Atual
							</button>
						</div>
						<input
							id="dataHora"
							type="text"
							bind:value={formData.dataHora}
							placeholder="Ex: 2026-02-09 13:48:21"
							class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-xs font-mono text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
						/>
					</div>
				</div>
			</div>

			<!-- Collapsible Advanced TPA Metadata Card -->
			<div class="rounded-xl border border-zinc-800/80 bg-zinc-950 p-4 space-y-3">
				<button
					type="button"
					onclick={() => (showAdvancedTpa = !showAdvancedTpa)}
					class="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-300 cursor-pointer"
				>
					<div class="flex items-center gap-2">
						<Icon name="clock" class="w-4 h-4 text-zinc-400" />
						<span>Metadados do TPA e Terminal (Opcional)</span>
					</div>
					<Icon name={showAdvancedTpa ? 'chevron-down' : 'chevron-right'} class="w-4 h-4 text-zinc-400" />
				</button>

				{#if showAdvancedTpa}
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-zinc-800/70">
						<div>
							<label for="identTpa" class="block text-xs font-medium text-zinc-400 mb-1">Ident. TPA</label>
							<input
								id="identTpa"
								type="text"
								bind:value={formData.identTpa}
								class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
							/>
						</div>
						<div>
							<label for="nif" class="block text-xs font-medium text-zinc-400 mb-1">NIF da Entidade</label>
							<input
								id="nif"
								type="text"
								bind:value={formData.nif}
								class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
							/>
						</div>
						<div>
							<label for="periodoTransacao" class="block text-xs font-medium text-zinc-400 mb-1">Per / Tr / Mg</label>
							<input
								id="periodoTransacao"
								type="text"
								bind:value={formData.periodoTransacao}
								class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
							/>
						</div>
						<div>
							<label for="tc" class="block text-xs font-medium text-zinc-400 mb-1">Código TC</label>
							<input
								id="tc"
								type="text"
								bind:value={formData.tc}
								class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
							/>
						</div>
						<div>
							<label for="aid" class="block text-xs font-medium text-zinc-400 mb-1">Código AID</label>
							<input
								id="aid"
								type="text"
								bind:value={formData.aid}
								class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
							/>
						</div>
						<div>
							<label for="idEstabelecimento" class="block text-xs font-medium text-zinc-400 mb-1">Id. Estabelecimento</label>
							<input
								id="idEstabelecimento"
								type="text"
								bind:value={formData.idEstabelecimento}
								class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
							/>
						</div>
						<div>
							<label for="tipoCartao" class="block text-xs font-medium text-zinc-400 mb-1">Tipo de Cartão</label>
							<input
								id="tipoCartao"
								type="text"
								bind:value={formData.tipoCartao}
								class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
							/>
						</div>
						<div>
							<label for="tipoCopia" class="block text-xs font-medium text-zinc-400 mb-1">Tipo de Cópia</label>
							<select
								id="tipoCopia"
								bind:value={formData.tipoCopia}
								class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
							>
								<option value="CÓPIA COMERCIANTE">CÓPIA COMERCIANTE</option>
								<option value="CÓPIA CLIENTE">CÓPIA CLIENTE</option>
							</select>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Right: Action Bar & Real Thermal Slip Simulator (5 cols) -->
		<div class="lg:col-span-5 space-y-4 sticky top-6">
			<!-- Action Bar Card -->
			<div class="rounded-xl border border-zinc-800/80 bg-zinc-950 p-4 space-y-3.5">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-1.5">
						<span class="text-xs font-semibold uppercase tracking-wider text-zinc-200">Ações de Impressão</span>
						<span class="rounded bg-amber-950/80 text-amber-400 border border-amber-800/50 px-1.5 py-0.2 text-[10px] font-mono font-semibold">
							RUPE 58mm
						</span>
					</div>
					<button
						type="button"
						onclick={copyJsonData}
						class="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
						title="Copiar JSON"
					>
						<Icon name="copy" class="w-3.5 h-3.5" />
						<span>JSON</span>
					</button>
				</div>

				<!-- Direct Bluetooth Print -->
				<button
					type="button"
					onclick={handlePrintBluetooth}
					disabled={isBluetoothPrinting}
					class="w-full flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-sky-500 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-sky-950/50"
				>
					<Icon name="bluetooth" class="w-4 h-4 text-white" />
					<span>{isBluetoothPrinting ? 'Conectando ao Bluetooth...' : 'Imprimir Bluetooth (Quatenus SPP-R200III)'}</span>
				</button>

				<div class="grid grid-cols-2 gap-2">
					<button
						type="button"
						onclick={handlePrintDriver}
						disabled={isPrinting}
						class="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 shadow-sm"
					>
						<Icon name="printer" class="w-3.5 h-3.5" />
						<span>{isPrinting ? 'Enviando...' : 'Driver / PDF'}</span>
					</button>

					<button
						type="button"
						onclick={handlePrintSerial}
						disabled={isSerialPrinting}
						class="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-200 hover:text-white hover:bg-zinc-800 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 shadow-sm"
					>
						<Icon name="sparkles" class="w-3.5 h-3.5 text-amber-400" />
						<span>{isSerialPrinting ? 'Enviando...' : 'Porta COM / USB'}</span>
					</button>
				</div>

				<div class="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800/80">
					<button
						type="button"
						onclick={handleDownloadPDF}
						disabled={isGenerating}
						class="flex items-center justify-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer disabled:opacity-50"
					>
						<Icon name="download" class="w-3.5 h-3.5 text-zinc-400" />
						<span>Baixar PDF</span>
					</button>

					<button
						type="button"
						onclick={handleOpenPdfTab}
						class="flex items-center justify-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
					>
						<Icon name="external" class="w-3.5 h-3.5 text-zinc-400" />
						<span>Nova Aba</span>
					</button>
				</div>
			</div>

			<!-- Realistic Thermal Slip Visualizer (RUPE) -->
			<div class="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 flex flex-col items-center">
				<div class="w-full flex items-center justify-between pb-3 border-b border-zinc-800/60 mb-4 text-xs text-zinc-400">
					<div class="flex items-center gap-1.5 font-mono text-[11px]">
						<span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
						<span>Pré-visualização Térmica (58 mm)</span>
					</div>
					<span class="font-mono text-[11px] text-zinc-400">Fonte: Helvetica / Térmica Sans</span>
				</div>

				<!-- Paper Slip Card -->
				<div
					class="bg-white text-black shadow-2xl p-5 transition-all duration-300 select-text relative"
					style="width: 290px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-variant-numeric: tabular-nums; font-size: 13px; line-height: 1.4;"
				>
					<!-- Top Perforation Simulation -->
					<div class="absolute -top-1.5 left-0 right-0 h-1.5 bg-[radial-gradient(circle,_transparent_3px,_#ffffff_3px)] bg-[length:8px_8px]"></div>

					<!-- Slip Content -->
					<div class="space-y-3 text-zinc-950 font-normal">
						<!-- BAI Header & Logo (Preto e Branco Puro) -->
						<div class="text-center pt-1 pb-1">
							<img
								src={BAI_LOGO_BASE64}
								alt="Logo BAI - Confiança no Futuro"
								class="mx-auto w-40 object-contain grayscale contrast-200 mix-blend-multiply"
							/>
						</div>

						<!-- Ministério das Finanças (Alinhado à Esquerda) -->
						<div class="text-left font-normal text-[13px] leading-tight pt-1">
							<div>{formData.entidadeLinha1}</div>
							<div>{formData.entidadeLinha2}</div>
						</div>

						<!-- TPA Transaction Details (Alinhado à Esquerda) -->
						<div class="text-left text-[12.5px] leading-snug space-y-0.5 pt-1">
							<div>{formData.centralPagamento1}</div>
							<div>{formData.centralPagamento2}</div>
							<div>NIF: {formData.nif}</div>
							<div>Ident. TPA: {formData.identTpa}</div>
							<div>{formData.dataHora}</div>
							<div>{formData.periodoTransacao}</div>
							<div>TC: {formData.tc}</div>
							<div>{formData.aid}</div>
							<div>{formData.tipoCartao}</div>
							<div>Id.Estab.:{formData.idEstabelecimento}</div>
						</div>

						<!-- Tipo Operação -->
						<div class="text-left font-normal text-[13px] pt-1">
							{formData.tipoOperacao}
						</div>

						<!-- RUPE Block (Centralizado) -->
						<div class="pt-3 text-center">
							<div class="font-normal text-[13px] tracking-wide">RUPE</div>
							<div class="text-[13px] font-normal tracking-wider pt-1.5 break-all">
								{formData.rupe || '—'}
							</div>
						</div>

						<!-- Montante Block (Alinhado à Esquerda) -->
						<div class="pt-2 text-left">
							<div class="font-normal text-[13px]">Montante:</div>
							<div class="text-[13.5px] font-normal pt-1.5 pl-1">
								{formData.valor}  {formData.moeda}
							</div>
						</div>

						<!-- Footer (Centralizado) -->
						<div class="text-center text-[13px] leading-tight pt-4 pb-2 space-y-1 font-normal">
							<div>{formData.tipoCopia}</div>
							<div>{formData.rodape}</div>
						</div>
					</div>

					<!-- Bottom Perforation Simulation -->
					<div class="absolute -bottom-1.5 left-0 right-0 h-1.5 bg-[radial-gradient(circle,_transparent_3px,_#ffffff_3px)] bg-[length:8px_8px]"></div>
				</div>
			</div>
		</div>
	</div>
</div>
