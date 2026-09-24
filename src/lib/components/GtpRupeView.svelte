<script lang="ts">
	import { onMount } from 'svelte';
	import type { GtpRupeData } from '../types/gtp-rupe';
	import {
		createDefaultGtpRupeData,
		generateRandom11Digits,
		generateRandomRupe,
		formatRupe,
		generateRupeQrCodeDataUrl,
		formatGuiaRupeValue,
		SUGGESTED_RUPE_VALUES,
		fetchGtpRupeTemplate,
		renderGtpRupeSvg,
		downloadSvgFile,
		downloadGtpRupePdf,
		printSvgDocument,
		getTodayDateTimeStr,
		getTodayDateStr,
		getMesAnoReferencia,
		getVencimentoDateStr,
		fetchLatestGtpRupeFromApi,
		saveLatestGtpRupeToApi
	} from '../utils/gtp-rupe';
	import { valorPorExtensoKwanzas } from '../utils/numero-extenso';
	import { toast } from '../stores/toast.svelte';
	import Icon from './Icon.svelte';

	let formData = $state<GtpRupeData>(createDefaultGtpRupeData());
	let rawSvgTemplate = $state<string>('');
	let renderedSvg = $state<string>('');
	let isPdfGenerating = $state<boolean>(false);
	let isSvgDownloading = $state<boolean>(false);
	let autoExtenso = $state<boolean>(true);
	let currentQrDataUrl = $state<string>('');
	let isSaving = $state<boolean>(false);
	let lastSavedTime = $state<string>('');
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;

	onMount(async () => {
		const [template, savedRupe] = await Promise.all([
			fetchGtpRupeTemplate(),
			fetchLatestGtpRupeFromApi()
		]);
		rawSvgTemplate = template;
		if (savedRupe && savedRupe.rupe) {
			formData = savedRupe;
		}
		await updateRenderedSvg();
	});

	function triggerAutoSave() {
		if (saveTimeout) clearTimeout(saveTimeout);
		saveTimeout = setTimeout(async () => {
			isSaving = true;
			const ok = await saveLatestGtpRupeToApi(formData);
			isSaving = false;
			if (ok) {
				const now = new Date();
				lastSavedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
			}
		}, 300);
	}

	async function updateRenderedSvg() {
		if (autoExtenso) {
			formData.valorExtenso = valorPorExtensoKwanzas(formData.valorTotal);
		}
		currentQrDataUrl = await generateRupeQrCodeDataUrl(formData.rupe);
		if (rawSvgTemplate) {
			renderedSvg = renderGtpRupeSvg(rawSvgTemplate, formData, currentQrDataUrl);
		}
		triggerAutoSave();
	}

	function handleRupeInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const clean = (target.value || '').replace(/\D/g, '').slice(0, 20);
		formData.rupe = clean;
		target.value = clean;
		updateRenderedSvg();
	}

	function handleNumero11Input(e: Event) {
		const target = e.target as HTMLInputElement;
		const clean = (target.value || '').replace(/\D/g, '').slice(0, 11);
		formData.numeroLiquidacao = clean;
		target.value = clean;
		updateRenderedSvg();
	}

	function handleProtocoloInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const clean = (target.value || '').replace(/\D/g, '').slice(0, 11);
		formData.protocolo = clean;
		target.value = clean;
		updateRenderedSvg();
	}

	function handleValorChange() {
		if (autoExtenso) {
			formData.valorExtenso = valorPorExtensoKwanzas(formData.valorTotal);
		}
		formData.valorReceita = formData.valorTotal;
		updateRenderedSvg();
	}

	function handleValorBlur() {
		formData.valorTotal = formatGuiaRupeValue(formData.valorTotal);
		formData.valorReceita = formData.valorTotal;
		if (autoExtenso) {
			formData.valorExtenso = valorPorExtensoKwanzas(formData.valorTotal);
		}
		updateRenderedSvg();
	}

	function randomizeGptAndNumero() {
		const newNum = generateRandom11Digits();
		formData.numeroLiquidacao = newNum;
		updateRenderedSvg();
		toast.info('Número Atualizado', `Novo Nº 1.1 / GPT gerado: ${newNum}`);
	}

	function randomizeProtocolo() {
		const newProto = generateRandom11Digits();
		formData.protocolo = newProto;
		updateRenderedSvg();
		toast.info('Protocolo Atualizado', `Novo protocolo gerado: ${newProto}`);
	}

	function randomizeRupe() {
		const newRupe = generateRandomRupe();
		formData.rupe = newRupe;
		updateRenderedSvg();
		toast.info('RUPE Gerado', `Nova referência RUPE de 20 dígitos criada.`);
	}

	function randomizeAll() {
		const num = generateRandom11Digits();
		const proto = generateRandom11Digits();
		const rupe = generateRandomRupe();
		formData.numeroLiquidacao = num;
		formData.protocolo = proto;
		formData.rupe = rupe;
		formData.dataHoraEmissao = getTodayDateTimeStr();
		formData.dataEmissao = getTodayDateStr();
		formData.mesAnoReferencia = getMesAnoReferencia();
		formData.dataVencimento = getVencimentoDateStr(30);
		updateRenderedSvg();
		toast.success('Dados Gerados', 'Novos valores aleatórios atribuídos com sucesso.');
	}

	function resetForm() {
		formData = createDefaultGtpRupeData();
		updateRenderedSvg();
		toast.info('Restaurado', 'Formulário da Guia RUPE redefinido para os padrões.');
	}

	function handleDownloadSvg() {
		if (!renderedSvg) {
			toast.error('Erro', 'O modelo SVG ainda não foi carregado.');
			return;
		}
		isSvgDownloading = true;
		try {
			const filename = `GTP_RUPE_${formData.rupe || formData.numeroLiquidacao}.svg`;
			downloadSvgFile(renderedSvg, filename);
			toast.success('Download Concluído', `Ficheiro vetorial ${filename} descarregado.`);
		} catch {
			toast.error('Erro', 'Não foi possível descarregar o ficheiro SVG.');
		} finally {
			isSvgDownloading = false;
		}
	}

	async function handleDownloadPdf() {
		if (!renderedSvg) {
			toast.error('Erro', 'O modelo SVG ainda não foi carregado.');
			return;
		}
		isPdfGenerating = true;
		try {
			const filename = `Nota_Liquidacao_RUPE_${formData.rupe || formData.numeroLiquidacao}.pdf`;
			await downloadGtpRupePdf(renderedSvg, filename);
			toast.success('PDF Gerado', `Nota de Liquidação exportada em PDF A4 (${filename}).`);
		} catch {
			toast.error('Erro', 'Falha ao converter SVG para PDF.');
		} finally {
			isPdfGenerating = false;
		}
	}

	function handlePrint() {
		if (!renderedSvg) {
			toast.error('Erro', 'O documento não está pronto para impressão.');
			return;
		}
		printSvgDocument(renderedSvg);
		toast.info('Impressão', 'Janela de impressão A4 aberta.');
	}

	function copyJson() {
		navigator.clipboard.writeText(JSON.stringify(formData, null, 2));
		toast.success('Copiado', 'Dados da Nota de Liquidação copiados em formato JSON.');
	}
</script>

<div class="space-y-6 pb-12">
	<!-- Receipt Navigation Tabs -->
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
			class="flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
		>
			<Icon name="printer" class="w-4 h-4 text-amber-400" />
			<span>Talão RUPE Térmico (58 mm)</span>
		</a>

		<a
			href="/gtp-rupe"
			class="flex items-center gap-2 rounded-lg bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-white border border-zinc-700/60 transition-colors shadow-sm"
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
				<h1 class="text-xl font-bold tracking-tight text-white">Nota de Liquidação RUPE (GTP A4)</h1>
				<span class="rounded-full bg-sky-950/60 px-2.5 py-0.5 text-xs font-mono text-sky-300 border border-sky-900/50">
					Ministério das Finanças • Estado
				</span>
			</div>
			<p class="text-xs text-zinc-400 mt-1">
				Preenchimento rápido com geração de dados aleatórios e exportação vetorial em SVG e PDF formato A4.
			</p>
		</div>

		<div class="flex items-center gap-2 flex-wrap">
			{#if isSaving}
				<span class="flex items-center gap-1.5 rounded-md bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-[11px] text-zinc-400">
					<Icon name="refresh" class="w-3 h-3 text-sky-400 animate-spin" />
					<span>A guardar...</span>
				</span>
			{:else if lastSavedTime}
				<span class="flex items-center gap-1.5 rounded-md bg-emerald-950/40 border border-emerald-900/50 px-2.5 py-1 text-[11px] text-emerald-400" title="Guardado no servidor data/gtp-rupe-latest.json">
					<Icon name="check" class="w-3 h-3 text-emerald-400" />
					<span>Guardado ({lastSavedTime})</span>
				</span>
			{/if}

			<button
				type="button"
				onclick={randomizeAll}
				class="rounded-lg border border-sky-800/70 bg-sky-950/40 px-3 py-1.5 text-xs font-medium text-sky-200 hover:text-white hover:bg-sky-900/60 transition-colors cursor-pointer"
			>
				<Icon name="sparkles" class="w-3.5 h-3.5 inline mr-1 text-sky-400" />
				<span>Gerar Todos os Dados</span>
			</button>

			<button
				type="button"
				onclick={resetForm}
				class="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
			>
				<Icon name="refresh" class="w-3.5 h-3.5 inline mr-1 text-zinc-400" />
				<span>Restaurar Padrão</span>
			</button>
		</div>
	</div>

	<!-- Main Grid: Form Inputs (Left) & A4 Vector Live Preview (Right) -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
		<!-- Left: Form Controls (6 cols) -->
		<div class="lg:col-span-6 space-y-4">
			<!-- Section 1: Dados do Documento & RUPE -->
			<div class="rounded-xl border border-zinc-800/80 bg-zinc-950 p-4 space-y-3.5 shadow-sm">
				<div class="flex items-center justify-between border-b border-zinc-800/70 pb-2.5">
					<div class="flex items-center gap-2">
						<Icon name="file-text" class="w-4 h-4 text-sky-400" />
						<span class="text-xs font-semibold uppercase tracking-wider text-zinc-200">
							1. Dados do Documento & RUPE
						</span>
					</div>
				</div>

				<div class="space-y-3.5">
					<!-- RUPE Input -->
					<div>
						<div class="flex items-center justify-between mb-1">
							<label for="rupe" class="block text-xs font-medium text-zinc-300">
								Número RUPE (20 dígitos) *
							</label>
							<button
								type="button"
								onclick={randomizeRupe}
								class="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer transition-colors"
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
								placeholder="Ex: 60201260203073134198"
								class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 pr-16 text-sm font-mono text-white placeholder-zinc-500 focus:border-sky-500 focus:outline-none"
							/>
							<span class="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono {formData.rupe.length === 20 ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}">
								{formData.rupe.length}/20
							</span>
						</div>
						<div class="flex items-center justify-between mt-1 text-[11px] text-zinc-400">
							<span>Formatado: <strong class="text-zinc-200 font-mono">{formatRupe(formData.rupe) || '—'}</strong></span>
							{#if formData.rupe.length === 20}
								<span class="text-emerald-400 flex items-center gap-0.5">
									<Icon name="check" class="w-3 h-3" />
									<span>20 dígitos completos</span>
								</span>
							{/if}
						</div>
					</div>

					<!-- 1.1 Número & GPT (Sincronizados) -->
					<div>
						<div class="flex items-center justify-between mb-1">
							<label for="numeroLiquidacao" class="block text-xs font-medium text-zinc-300">
								1.1 Número / GPT (11 dígitos) *
							</label>
							<button
								type="button"
								onclick={randomizeGptAndNumero}
								class="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer transition-colors"
							>
								<Icon name="refresh" class="w-3 h-3" />
								<span>Gerar 11 Dígitos</span>
							</button>
						</div>
						<div class="relative">
							<input
								id="numeroLiquidacao"
								type="text"
								inputmode="numeric"
								maxlength="11"
								value={formData.numeroLiquidacao}
								oninput={handleNumero11Input}
								placeholder="Ex: 37362232233"
								class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 pr-16 text-sm font-mono text-white focus:border-sky-500 focus:outline-none"
							/>
							<span class="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono {formData.numeroLiquidacao.length === 11 ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}">
								{formData.numeroLiquidacao.length}/11
							</span>
						</div>
						<span class="text-[10.5px] text-zinc-400 mt-0.5 block">
							O Número 1.1 e o identificador GPT no Home Banking são automaticamente iguais.
						</span>
					</div>

					<!-- Datas: Emissão, Mês/Ano Ref, Vencimento -->
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
						<div>
							<label for="dataEmissao" class="block text-xs font-medium text-zinc-400 mb-1">1.2 Emissão</label>
							<input
								id="dataEmissao"
								type="text"
								bind:value={formData.dataEmissao}
								oninput={updateRenderedSvg}
								class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-2.5 py-1.5 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
							/>
						</div>
						<div>
							<label for="mesAnoReferencia" class="block text-xs font-medium text-zinc-400 mb-1">1.3 Mês/Ano</label>
							<input
								id="mesAnoReferencia"
								type="text"
								bind:value={formData.mesAnoReferencia}
								oninput={updateRenderedSvg}
								class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-2.5 py-1.5 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
							/>
						</div>
						<div>
							<label for="dataVencimento" class="block text-xs font-medium text-zinc-400 mb-1">1.4 Vencimento</label>
							<input
								id="dataVencimento"
								type="text"
								bind:value={formData.dataVencimento}
								oninput={updateRenderedSvg}
								class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-2.5 py-1.5 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
							/>
						</div>
					</div>

					<!-- Forma & Tipo de Liquidação -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
						<div>
							<label for="formaLiquidacao" class="block text-xs font-medium text-zinc-400 mb-1">1.6 Forma</label>
							<input
								id="formaLiquidacao"
								type="text"
								bind:value={formData.formaLiquidacao}
								oninput={updateRenderedSvg}
								class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
							/>
						</div>
						<div>
							<label for="tipoLiquidacao" class="block text-xs font-medium text-zinc-400 mb-1">1.7 Tipo</label>
							<input
								id="tipoLiquidacao"
								type="text"
								bind:value={formData.tipoLiquidacao}
								oninput={updateRenderedSvg}
								class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
							/>
						</div>
					</div>
				</div>
			</div>

			<!-- Section 2: Dados do Contribuinte -->
			<div class="rounded-xl border border-zinc-800/80 bg-zinc-950 p-4 space-y-3.5 shadow-sm">
				<div class="flex items-center gap-2 border-b border-zinc-800/70 pb-2.5">
					<Icon name="user" class="w-4 h-4 text-emerald-400" />
					<span class="text-xs font-semibold uppercase tracking-wider text-zinc-200">
						2. Dados do Contribuinte
					</span>
				</div>

				<div class="space-y-3">
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
						<div>
							<label for="nif" class="block text-xs font-medium text-zinc-300 mb-1">2.1 NIF *</label>
							<input
								id="nif"
								type="text"
								bind:value={formData.nif}
								oninput={updateRenderedSvg}
								placeholder="Ex: 021287366UE050"
								class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
							/>
						</div>
						<div>
							<label for="nomeContribuinte" class="block text-xs font-medium text-zinc-300 mb-1">2.2 Nome / Designação *</label>
							<input
								id="nomeContribuinte"
								type="text"
								bind:value={formData.nomeContribuinte}
								oninput={updateRenderedSvg}
								placeholder="Ex: Nsimba Pedro"
								class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
							/>
						</div>
					</div>

					<div>
						<label for="reparticaoFiscal" class="block text-xs font-medium text-zinc-300 mb-1">
							2.3 Repartição Fiscal do Contribuinte
						</label>
						<input
							id="reparticaoFiscal"
							type="text"
							bind:value={formData.reparticaoFiscal}
							oninput={updateRenderedSvg}
							placeholder="Ex: 301 - Rf Uíge"
							class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
						/>
					</div>
				</div>
			</div>

			<!-- Section 3: Detalhe da Receita e Valor Total -->
			<div class="rounded-xl border border-zinc-800/80 bg-zinc-950 p-4 space-y-3.5 shadow-sm">
				<div class="flex items-center gap-2 border-b border-zinc-800/70 pb-2.5">
					<Icon name="money" class="w-4 h-4 text-amber-400" />
					<span class="text-xs font-semibold uppercase tracking-wider text-zinc-200">
						3. Detalhe da Receita e Valores
					</span>
				</div>

				<div class="space-y-3">
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
						<div>
							<label for="codigoReceita" class="block text-xs font-medium text-zinc-300 mb-1">3.1 Código</label>
							<input
								id="codigoReceita"
								type="text"
								bind:value={formData.codigoReceita}
								oninput={updateRenderedSvg}
								placeholder="04S"
								class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
							/>
						</div>
						<div class="sm:col-span-2">
							<label for="nomeReceita" class="block text-xs font-medium text-zinc-300 mb-1">3.2 Nome da Receita</label>
							<input
								id="nomeReceita"
								type="text"
								bind:value={formData.nomeReceita}
								oninput={updateRenderedSvg}
								placeholder="Ex: Receitas De Serviços Diversos"
								class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
							/>
						</div>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
						<div>
							<label for="valorTotal" class="block text-xs font-medium text-zinc-300 mb-1">3.4 Valor Total (Kz) *</label>
							<input
								id="valorTotal"
								type="text"
								bind:value={formData.valorTotal}
								oninput={handleValorChange}
								onblur={handleValorBlur}
								placeholder="Ex: 7.398,00"
								class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-sm font-mono text-white focus:border-amber-500 focus:outline-none"
							/>
						</div>
						<div>
							<label for="moeda" class="block text-xs font-medium text-zinc-400 mb-1">Moeda</label>
							<input
								id="moeda"
								type="text"
								bind:value={formData.moeda}
								oninput={updateRenderedSvg}
								class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-sm font-mono text-white focus:border-amber-500 focus:outline-none"
							/>
						</div>
					</div>

					<!-- Valores Sugestivos / Frequentes -->
					<div>
						<span class="block text-[11px] font-medium text-zinc-400 mb-1.5">
							Valores Sugestivos:
						</span>
						<div class="flex items-center gap-1.5 flex-wrap">
							{#each SUGGESTED_RUPE_VALUES as val}
								<button
									type="button"
									onclick={() => {
										formData.valorTotal = val;
										handleValorChange();
									}}
									class="rounded-md border px-2.5 py-1 text-xs font-mono transition-all cursor-pointer {formData.valorTotal === val
										? 'bg-amber-950/80 border-amber-500/80 text-amber-300 font-semibold shadow-sm'
										: 'border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:border-zinc-700 hover:text-white'}"
								>
									{val}
								</button>
							{/each}
						</div>
					</div>

					<div>
						<div class="flex items-center justify-between mb-1">
							<label for="valorExtenso" class="block text-xs font-medium text-zinc-300">
								3.5 Valor por Extenso
							</label>
							<label class="flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer">
								<input
									type="checkbox"
									bind:checked={autoExtenso}
									onchange={handleValorChange}
									class="rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-0 cursor-pointer"
								/>
								<span>Gerar automaticamente</span>
							</label>
						</div>
						<input
							id="valorExtenso"
							type="text"
							bind:value={formData.valorExtenso}
							oninput={updateRenderedSvg}
							disabled={autoExtenso}
							class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none disabled:opacity-80"
						/>
					</div>
				</div>
			</div>

			<!-- Section 4: Outras Informações -->
			<div class="rounded-xl border border-zinc-800/80 bg-zinc-950 p-4 space-y-3.5 shadow-sm">
				<div class="flex items-center justify-between border-b border-zinc-800/70 pb-2.5">
					<div class="flex items-center gap-2">
						<Icon name="tag" class="w-4 h-4 text-purple-400" />
						<span class="text-xs font-semibold uppercase tracking-wider text-zinc-200">
							4. Outras Informações & Protocolo
						</span>
					</div>
				</div>

				<div class="space-y-3">
					<div>
						<div class="flex items-center justify-between mb-1">
							<label for="protocolo" class="block text-xs font-medium text-zinc-300">
								Protocolo (11 dígitos gerados)
							</label>
							<button
								type="button"
								onclick={randomizeProtocolo}
								class="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer transition-colors"
							>
								<Icon name="refresh" class="w-3 h-3" />
								<span>Gerar Protocolo</span>
							</button>
						</div>
						<div class="relative">
							<input
								id="protocolo"
								type="text"
								inputmode="numeric"
								maxlength="11"
								value={formData.protocolo}
								oninput={handleProtocoloInput}
								placeholder="Ex: 53623232122"
								class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 pr-16 text-xs font-mono text-white focus:border-purple-500 focus:outline-none"
							/>
							<span class="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono {formData.protocolo.length === 11 ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}">
								{formData.protocolo.length}/11
							</span>
						</div>
					</div>

					<div>
						<label for="documentoDescricao" class="block text-xs font-medium text-zinc-300 mb-1">
							Documento / Descrição do Serviço
						</label>
						<input
							id="documentoDescricao"
							type="text"
							bind:value={formData.documentoDescricao}
							oninput={updateRenderedSvg}
							placeholder="Ex: Comparticipação Do Serviço De Energia."
							class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs text-white focus:border-purple-500 focus:outline-none"
						/>
					</div>
				</div>
			</div>
		</div>

		<!-- Right: Action Bar & Live SVG A4 Preview (6 cols) -->
		<div class="lg:col-span-6 space-y-4 sticky top-6">
			<!-- Action Card -->
			<div class="rounded-xl border border-zinc-800/80 bg-zinc-950 p-4 space-y-3 shadow-sm">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<span class="text-xs font-semibold uppercase tracking-wider text-zinc-200">
							Ações de Exportação
						</span>
						<span class="rounded bg-sky-950/80 text-sky-400 border border-sky-800/50 px-1.5 py-0.2 text-[10px] font-mono font-semibold">
							A4 Vetorial
						</span>
					</div>
					<button
						type="button"
						onclick={copyJson}
						class="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
						title="Copiar JSON"
					>
						<Icon name="copy" class="w-3.5 h-3.5" />
						<span>JSON</span>
					</button>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
					<!-- Download SVG -->
					<button
						type="button"
						onclick={handleDownloadSvg}
						disabled={isSvgDownloading}
						class="flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-sky-500 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 shadow-sm"
					>
						<Icon name="download" class="w-3.5 h-3.5" />
						<span>Baixar SVG</span>
					</button>

					<!-- Download PDF -->
					<button
						type="button"
						onclick={handleDownloadPdf}
						disabled={isPdfGenerating}
						class="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 shadow-sm"
					>
						<Icon name="file-text" class="w-3.5 h-3.5" />
						<span>{isPdfGenerating ? 'A Gerar PDF...' : 'Baixar PDF A4'}</span>
					</button>

					<!-- Print -->
					<button
						type="button"
						onclick={handlePrint}
						class="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-xs font-semibold text-zinc-200 hover:text-white hover:bg-zinc-800 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
					>
						<Icon name="printer" class="w-3.5 h-3.5 text-amber-400" />
						<span>Imprimir A4</span>
					</button>
				</div>
			</div>

			<!-- Realistic A4 Document Visualizer -->
			<div class="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5 flex flex-col items-center">
				<div class="w-full flex items-center justify-between pb-2.5 border-b border-zinc-800/60 mb-3 text-xs text-zinc-400">
					<div class="flex items-center gap-1.5 font-mono text-[11px]">
						<span class="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
						<span>Pré-visualização A4 Vetorial (GTP RUPE)</span>
					</div>
					<span class="font-mono text-[11px] text-zinc-400">210 × 297 mm</span>
				</div>

				<!-- A4 Paper Sheet Wrapper -->
				<div
					class="w-full bg-white text-black shadow-2xl rounded-sm overflow-hidden relative border border-zinc-300"
					style="aspect-ratio: 210 / 297;"
				>
					{#if renderedSvg}
						<div class="w-full h-full flex items-center justify-center pointer-events-auto select-text [&>svg]:w-full [&>svg]:h-full [&>svg]:block">
							<!-- Render Injected SVG Directly -->
							{@html renderedSvg}
						</div>
					{:else}
						<div class="w-full h-full flex items-center justify-center text-zinc-400 text-xs font-mono">
							A carregar modelo vetorial GTP RUPE...
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
