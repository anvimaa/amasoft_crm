<script lang="ts">
	import {
		gerarTalaoTermico,
		downloadThermalReceiptPDF,
		printThermalReceiptPDF,
		SAMPLE_RECEIPT_DATA,
		COMMERCIAL_RECEIPT_DATA
	} from '../utils/thermal-receipt';
	import { printViaBluetooth, printViaSerial } from '../utils/bixolon-printer';
	import type { ReceiptData, PaperWidth } from '../types/receipt';
	import { toast } from '../stores/toast.svelte';
	import Icon from './Icon.svelte';
	import QRCode from 'qrcode';

	let paperWidth = $state<PaperWidth>(58);
	let dynamicHeight = $state<boolean>(true);
	let isGenerating = $state<boolean>(false);
	let isPrinting = $state<boolean>(false);
	let isBluetoothPrinting = $state<boolean>(false);
	let isSerialPrinting = $state<boolean>(false);
	let qrPreviewUrl = $state<string>('');

	let formData = $state<ReceiptData>({ ...SAMPLE_RECEIPT_DATA });

	// Auto-update live QR preview when payload or key fields change
	$effect(() => {
		const payload = formData.qrPayload || `${formData.numeroDoc}|${formData.transaccao}`;
		QRCode.toDataURL(payload, { margin: 0, errorCorrectionLevel: 'M', width: 200 })
			.then((url) => {
				qrPreviewUrl = url;
			})
			.catch(() => {
				qrPreviewUrl = '';
			});
	});

	function setPreset(preset: 'buap' | 'commercial' | 'empty') {
		if (preset === 'buap') {
			formData = { ...SAMPLE_RECEIPT_DATA };
			toast.info('Modelo Carregado', 'Dados da Prova de Vida BUAP carregados.');
		} else if (preset === 'commercial') {
			formData = { ...COMMERCIAL_RECEIPT_DATA };
			toast.info('Modelo Carregado', 'Dados de Comprovativo Comercial carregados.');
		} else {
			formData = {
				tipo: '',
				titulo: '',
				nome: '',
				dataNascimento: '',
				tipoDoc: '',
				numeroDoc: '',
				provincia: '',
				municipio: '',
				morada: '',
				areaResidencia: '',
				pontoReferencia: '',
				dataEmissao: new Date().toLocaleDateString('pt-PT') + ' ' + new Date().toLocaleTimeString('pt-PT'),
				buap: '',
				operador: '',
				terminal: '',
				transaccao: '',
				qrPayload: ''
			};
			toast.info('Formulário Limpo', 'Campos limpos para preenchimento manual.');
		}
	}

	function autoGenerateQRPayload() {
		if (formData.numeroDoc && formData.transaccao) {
			formData.qrPayload = `${formData.numeroDoc}|${formData.transaccao}|${formData.titulo.replace(/\s+/g, '_').toUpperCase()}`;
			toast.success('Código QR Atualizado', 'Payload do QR Code gerado com sucesso.');
		} else {
			toast.error('Dados Incompletos', 'Preencha o Número do Documento e Transacção.');
		}
	}

	async function handleDownloadPDF() {
		if (!formData.nome || !formData.titulo) {
			toast.error('Atenção', 'Preencha pelo menos o Título e Nome do Requerente.');
			return;
		}

		isGenerating = true;
		try {
			const filename = `talao_${formData.titulo.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${formData.transaccao || 'doc'}.pdf`;
			await downloadThermalReceiptPDF(formData, filename, {
				paperWidth,
				dynamicHeight
			});
			toast.success('Download Concluído', `Talão térmico exportado (${paperWidth} mm).`);
		} catch {
			toast.error('Erro ao Gerar PDF', 'Não foi possível gerar o talão térmico.');
		} finally {
			isGenerating = false;
		}
	}

	async function handlePrint() {
		if (!formData.nome || !formData.titulo) {
			toast.error('Atenção', 'Preencha pelo menos o Título e Nome do Requerente.');
			return;
		}

		isPrinting = true;
		try {
			await printThermalReceiptPDF(formData, {
				paperWidth,
				dynamicHeight
			});
			toast.info('Impressão Enviada', 'Diálogo de impressão aberto para impressora térmica.');
		} catch {
			toast.error('Erro na Impressão', 'Não foi possível enviar para a impressora.');
		} finally {
			isPrinting = false;
		}
	}

	async function handleOpenPdfTab() {
		try {
			const doc = await gerarTalaoTermico(formData, { paperWidth, dynamicHeight });
			const blob = doc.output('blob');
			const url = URL.createObjectURL(blob);
			window.open(url, '_blank');
		} catch {
			toast.error('Erro', 'Não foi possível abrir o PDF.');
		}
	}

	async function handlePrintBluetooth() {
		if (!formData.nome || !formData.titulo) {
			toast.error('Atenção', 'Preencha pelo menos o Título e Nome do Requerente.');
			return;
		}

		isBluetoothPrinting = true;
		try {
			const result = await printViaBluetooth(formData);
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
		if (!formData.nome || !formData.titulo) {
			toast.error('Atenção', 'Preencha pelo menos o Título e Nome do Requerente.');
			return;
		}

		isSerialPrinting = true;
		try {
			const result = await printViaSerial(formData, 115200);
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

	function copyJsonData() {
		navigator.clipboard.writeText(JSON.stringify(formData, null, 2));
		toast.success('Copiado', 'Dados do talão copiados em formato JSON.');
	}
</script>

<div class="space-y-6 pb-12">
	<!-- Receipt Type Tabs -->
	<div class="flex items-center gap-2 border-b border-zinc-800 pb-3 flex-wrap">
		<a
			href="/talao"
			class="flex items-center gap-2 rounded-lg bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-white border border-zinc-700/60 transition-colors shadow-sm"
		>
			<Icon name="file-text" class="w-4 h-4 text-emerald-400" />
			<span>Talão BUAP (Prova de Vida)</span>
		</a>

		<a
			href="/talao/rupe"
			class="flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
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
				<h1 class="text-xl font-bold tracking-tight text-white">Emissão de Talão Térmico</h1>
				<span class="rounded-full bg-emerald-950/60 px-2.5 py-0.5 text-xs font-mono text-emerald-300 border border-emerald-900/50">
					{paperWidth} mm {dynamicHeight ? '• Altura Dinâmica' : ''}
				</span>
			</div>
			<p class="text-xs text-zinc-400 mt-1">
				Geração fiel de comprovativos e recibos para impressoras térmicas (58 mm / 80 mm) com QR Code bidimensional em jsPDF.
			</p>
		</div>

		<div class="flex items-center gap-2 flex-wrap">
			<button
				type="button"
				onclick={() => setPreset('buap')}
				class="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
			>
				<Icon name="file-text" class="w-3.5 h-3.5 inline mr-1 text-zinc-400" />
				<span>Exemplo BUAP</span>
			</button>

			<button
				type="button"
				onclick={() => setPreset('commercial')}
				class="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
			>
				<Icon name="money" class="w-3.5 h-3.5 inline mr-1 text-zinc-400" />
				<span>Exemplo Recibo Kz</span>
			</button>

			<button
				type="button"
				onclick={() => setPreset('empty')}
				class="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
			>
				<Icon name="refresh" class="w-3.5 h-3.5 inline mr-1 text-zinc-400" />
				<span>Limpar</span>
			</button>
		</div>
	</div>

	<!-- Main Grid: Form Inputs (Left) & Thermal Preview (Right) -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
		<!-- Left: Form Controls (7 cols) -->
		<div class="lg:col-span-7 space-y-5">
			<!-- Configuration Card -->
			<div class="rounded-xl border border-zinc-800/80 bg-zinc-950 p-4 space-y-4">
				<div class="flex items-center justify-between border-b border-zinc-800/70 pb-3">
					<div class="flex items-center gap-2">
						<Icon name="printer" class="w-4 h-4 text-emerald-400" />
						<span class="text-xs font-semibold uppercase tracking-wider text-zinc-200">Configuração de Impressão</span>
					</div>
					<div class="flex items-center gap-3">
						<!-- Paper Size Switch -->
						<div class="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-xs">
							<button
								type="button"
								onclick={() => (paperWidth = 58)}
								class="px-2.5 py-1 rounded-md transition-colors font-mono cursor-pointer {paperWidth === 58
									? 'bg-zinc-800 text-white font-bold'
									: 'text-zinc-400 hover:text-zinc-200'}"
							>
								58 mm
							</button>
							<button
								type="button"
								onclick={() => (paperWidth = 80)}
								class="px-2.5 py-1 rounded-md transition-colors font-mono cursor-pointer {paperWidth === 80
									? 'bg-zinc-800 text-white font-bold'
									: 'text-zinc-400 hover:text-zinc-200'}"
							>
								80 mm
							</button>
						</div>
					</div>
				</div>

				<div class="flex items-center justify-between text-xs text-zinc-400">
					<span>Ajuste automático de altura (Sem espaço em branco desperdiçado)</span>
					<label class="relative inline-flex items-center cursor-pointer">
						<input type="checkbox" bind:checked={dynamicHeight} class="sr-only peer" />
						<div class="w-8 h-4 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
					</label>
				</div>
			</div>

			<!-- Section 1: Cabeçalho & Tipo -->
			<div class="rounded-xl border border-zinc-800/80 bg-zinc-950 p-4 space-y-4">
				<div class="flex items-center gap-2 border-b border-zinc-800/70 pb-2">
					<Icon name="tag" class="w-4 h-4 text-zinc-400" />
					<span class="text-xs font-semibold uppercase tracking-wider text-zinc-300">1. Cabeçalho do Talão</span>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label for="tipo" class="block text-xs font-medium text-zinc-400 mb-1">Tipo / Código</label>
						<input
							id="tipo"
							type="text"
							bind:value={formData.tipo}
							placeholder="Ex: A2 ou FACTURA RECIBO"
							class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
						/>
					</div>
					<div>
						<label for="titulo" class="block text-xs font-medium text-zinc-400 mb-1">Título do Documento *</label>
						<input
							id="titulo"
							type="text"
							bind:value={formData.titulo}
							placeholder="Ex: PROVA DE VIDA"
							class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
						/>
					</div>
				</div>
			</div>

			<!-- Section 2: Requerente / Titular -->
			<div class="rounded-xl border border-zinc-800/80 bg-zinc-950 p-4 space-y-4">
				<div class="flex items-center gap-2 border-b border-zinc-800/70 pb-2">
					<Icon name="user" class="w-4 h-4 text-zinc-400" />
					<span class="text-xs font-semibold uppercase tracking-wider text-zinc-300">2. Dados do Requerente / Titular</span>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="sm:col-span-2">
						<label for="nome" class="block text-xs font-medium text-zinc-400 mb-1">Nome Completo / Empresa *</label>
						<input
							id="nome"
							type="text"
							bind:value={formData.nome}
							placeholder="Ex: Ana Vieira Raimundo"
							class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
						/>
					</div>
					<div>
						<label for="dataNascimento" class="block text-xs font-medium text-zinc-400 mb-1">Data Nascimento / NIF</label>
						<input
							id="dataNascimento"
							type="text"
							bind:value={formData.dataNascimento}
							placeholder="Ex: 18/10/1999 ou NIF: 5418290318"
							class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
						/>
					</div>
					<div>
						<label for="tipoDoc" class="block text-xs font-medium text-zinc-400 mb-1">Tipo de Documento</label>
						<input
							id="tipoDoc"
							type="text"
							bind:value={formData.tipoDoc}
							placeholder="Ex: Bilhete de Identidade"
							class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
						/>
					</div>
					<div class="sm:col-span-2">
						<label for="numeroDoc" class="block text-xs font-medium text-zinc-400 mb-1">Número do Documento</label>
						<input
							id="numeroDoc"
							type="text"
							bind:value={formData.numeroDoc}
							placeholder="Ex: 009851194UE045"
							class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
						/>
					</div>
				</div>
			</div>

			<!-- Section 3: Morada e Localização -->
			<div class="rounded-xl border border-zinc-800/80 bg-zinc-950 p-4 space-y-4">
				<div class="flex items-center gap-2 border-b border-zinc-800/70 pb-2">
					<Icon name="location" class="w-4 h-4 text-zinc-400" />
					<span class="text-xs font-semibold uppercase tracking-wider text-zinc-300">3. Dados de Morada do Residente</span>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label for="provincia" class="block text-xs font-medium text-zinc-400 mb-1">Provincia</label>
						<input
							id="provincia"
							type="text"
							bind:value={formData.provincia}
							placeholder="Ex: Uige, Luanda, Benguela..."
							class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
						/>
					</div>
					<div>
						<label for="municipio" class="block text-xs font-medium text-zinc-400 mb-1">Municipio</label>
						<input
							id="municipio"
							type="text"
							bind:value={formData.municipio}
							placeholder="Ex: Uige, Belas, Talatona..."
							class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
						/>
					</div>
					<div>
						<label for="morada" class="block text-xs font-medium text-zinc-400 mb-1">Morada / Bairro / Rua</label>
						<input
							id="morada"
							type="text"
							bind:value={formData.morada}
							placeholder="Ex: Bairro Popular Rua C"
							class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
						/>
					</div>
					<div>
						<label for="areaResidencia" class="block text-xs font-medium text-zinc-400 mb-1">Area de Residencia</label>
						<input
							id="areaResidencia"
							type="text"
							bind:value={formData.areaResidencia}
							placeholder="Ex: N3C-2TUV-S"
							class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
						/>
					</div>
					<div class="sm:col-span-2">
						<label for="pontoReferencia" class="block text-xs font-medium text-zinc-400 mb-1">Ponto de Referencia</label>
						<input
							id="pontoReferencia"
							type="text"
							bind:value={formData.pontoReferencia}
							placeholder="Ex: P1: Escola 11 de Novembro"
							class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
						/>
					</div>
				</div>
			</div>

			<!-- Section 4: Dados da Emissão e Sistema -->
			<div class="rounded-xl border border-zinc-800/80 bg-zinc-950 p-4 space-y-4">
				<div class="flex items-center gap-2 border-b border-zinc-800/70 pb-2">
					<Icon name="clock" class="w-4 h-4 text-zinc-400" />
					<span class="text-xs font-semibold uppercase tracking-wider text-zinc-300">4. Metadados do Sistema / Transaccao</span>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label for="dataEmissao" class="block text-xs font-medium text-zinc-400 mb-1">Data & Hora de Emissao</label>
						<input
							id="dataEmissao"
							type="text"
							bind:value={formData.dataEmissao}
							placeholder="Ex: 16/09/26 10:45:32"
							class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none font-mono"
						/>
					</div>
					<div>
						<label for="buap" class="block text-xs font-medium text-zinc-400 mb-1">BUAP / Posto / Entidade</label>
						<input
							id="buap"
							type="text"
							bind:value={formData.buap}
							placeholder="Ex: Administracao Municipal do Uige"
							class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
						/>
					</div>
					<div>
						<label for="operador" class="block text-xs font-medium text-zinc-400 mb-1">Operador</label>
						<input
							id="operador"
							type="text"
							bind:value={formData.operador}
							placeholder="Ex: Dombexe Antonio Malung 0"
							class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
						/>
					</div>
					<div>
						<label for="terminal" class="block text-xs font-medium text-zinc-400 mb-1">Terminal</label>
						<input
							id="terminal"
							type="text"
							bind:value={formData.terminal}
							placeholder="Ex: 81ade2"
							class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none font-mono"
						/>
					</div>
					<div class="sm:col-span-2">
						<label for="transaccao" class="block text-xs font-medium text-zinc-400 mb-1">Número de Transacção</label>
						<input
							id="transaccao"
							type="text"
							bind:value={formData.transaccao}
							placeholder="Ex: 165"
							class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none font-mono"
						/>
					</div>
				</div>
			</div>

			<!-- Section 5: QR Code Payload -->
			<div class="rounded-xl border border-zinc-800/80 bg-zinc-950 p-4 space-y-4">
				<div class="flex items-center justify-between border-b border-zinc-800/70 pb-2">
					<div class="flex items-center gap-2">
						<Icon name="sparkles" class="w-4 h-4 text-zinc-400" />
						<span class="text-xs font-semibold uppercase tracking-wider text-zinc-300">5. Conteúdo do QR Code</span>
					</div>
					<button
						type="button"
						onclick={autoGenerateQRPayload}
						class="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium transition-colors cursor-pointer"
					>
						Gerar do Formulário
					</button>
				</div>

				<div>
					<label for="qrPayload" class="block text-xs font-medium text-zinc-400 mb-1">Payload / String Codificada no QR</label>
					<input
						id="qrPayload"
						type="text"
						bind:value={formData.qrPayload}
						placeholder="Ex: 009851194UE045|165|PROVA_DE_VIDA"
						class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none font-mono"
					/>
					<p class="text-[11px] text-zinc-400 mt-1">
						Esta informação será renderizada no código QR de 34 mm (ou 44 mm em 80 mm) no rodapé do talão.
					</p>
				</div>
			</div>
		</div>

		<!-- Right: Live Slip Simulator & Actions (5 cols) -->
		<div class="lg:col-span-5 space-y-4 sticky top-6">
			<!-- Action Bar Card -->
			<div class="rounded-xl border border-zinc-800/80 bg-zinc-950 p-4 space-y-3.5">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-1.5">
						<span class="text-xs font-semibold uppercase tracking-wider text-zinc-200">Ações de Impressão</span>
						<span class="rounded bg-sky-950/80 text-sky-400 border border-sky-800/50 px-1.5 py-0.2 text-[10px] font-mono font-semibold">
							Quatenus / SPP-R200III
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

				<!-- Direct Bluetooth Print (Primary Action for Quatenus) -->
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
						onclick={handlePrint}
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
						<Icon name="sparkles" class="w-3.5 h-3.5 text-sky-400" />
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

				<!-- Quatenus SPP-R200III Tips -->
				<div class="rounded-lg bg-zinc-900/90 border border-zinc-800/80 p-2.5 text-[11px] text-zinc-400 space-y-1 font-sans">
					<div class="text-zinc-300 font-medium flex items-center gap-1.5">
						<span class="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
						<span>Dicas de Emparelhamento Quatenus:</span>
					</div>
					<p class="leading-relaxed">
						Ligue a impressora no botão Power até acender a luz azul. Se pedir código PIN no emparelhamento, digite <strong class="text-zinc-200 font-mono">0000</strong> (ou <strong class="text-zinc-200 font-mono">1234</strong>).
					</p>
				</div>
			</div>

			<!-- Realistic Thermal Slip Visualizer -->
			<div class="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 flex flex-col items-center">
				<div class="w-full flex items-center justify-between pb-3 border-b border-zinc-800/60 mb-4 text-xs text-zinc-400">
					<div class="flex items-center gap-1.5 font-mono text-[11px]">
						<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
						<span>Pré-visualização Térmica ({paperWidth} mm)</span>
					</div>
					<span class="font-mono text-[11px] text-zinc-400">Fonte: Courier</span>
				</div>

				<!-- Paper Slip Card -->
				<div
					class="bg-white text-black font-mono shadow-2xl p-4 transition-all duration-300 select-text relative"
					style="width: {paperWidth === 80 ? '340px' : '260px'}; font-family: 'Courier New', Courier, monospace; font-size: 11px; line-height: 1.35;"
				>
					<!-- Top Perforation Simulation -->
					<div class="absolute -top-1.5 left-0 right-0 h-1.5 bg-[radial-gradient(circle,_transparent_3px,_#ffffff_3px)] bg-[length:8px_8px]"></div>

					<!-- Slip Content -->
					<div class="space-y-1.5 text-zinc-950 font-normal">
						<!-- Header -->
						<div class="text-center pb-2">
							<div class="font-bold text-xs uppercase tracking-wide underline underline-offset-2">
								{formData.tipo || '—'}
							</div>
							<div class="font-bold text-xs uppercase tracking-wide underline underline-offset-2">
								{formData.titulo || '—'}
							</div>
						</div>

						<!-- Personal Info -->
						<div>
							<div class="font-bold underline">Nome do Requerente:</div>
							<div class="break-words">{formData.nome || '—'}</div>
						</div>

						<div>
							<div class="font-bold underline">Data de Nascimento:</div>
							<div>{formData.dataNascimento || '—'}</div>
						</div>

						<div>
							<div class="font-bold underline">Tipo de Doc. Utilizado:</div>
							<div>{formData.tipoDoc || '—'}</div>
						</div>

						<div>
							<div class="font-bold underline">Numero:</div>
							<div>{formData.numeroDoc || '—'}</div>
						</div>

						<!-- Address Block -->
						<div class="pt-1">
							<div class="font-bold underline">Dados de Morada de Residente:</div>
							<div>Provincia: {formData.provincia || '—'}</div>
							<div>Municipio: {formData.municipio || '—'}</div>
							<div>Morada: {formData.morada || '—'}</div>
							<div>Area de Residencia: {formData.areaResidencia || '—'}</div>
						</div>

						<div>
							<div class="font-bold underline">Ponto de Referencia:</div>
							<div class="break-words">{formData.pontoReferencia || '—'}</div>
						</div>

						<!-- System Block -->
						<div class="text-[10px] space-y-0.5 pt-1">
							<div>DATA: {formData.dataEmissao || '—'}</div>
							<div>BUAP: {formData.buap || '—'}</div>
							<div>OPERADOR: {formData.operador || '—'}</div>
							<div>TERMINAL: {formData.terminal || '—'}</div>
							<div>TRANSACCAO: {formData.transaccao || '—'}</div>
						</div>

						<!-- Instructions & QR Code -->
						<div class="text-center pt-2 space-y-1">
							<div class="text-[10px] leading-tight">
								Utilize o telemovel para ler<br />o codigo abaixo
							</div>

							<div class="flex justify-center py-2">
								{#if qrPreviewUrl}
									<img
										src={qrPreviewUrl}
										alt="QR Code do Talão"
										class="w-28 h-28 object-contain border border-zinc-200 p-1"
									/>
								{:else}
									<div class="w-28 h-28 border border-dashed border-zinc-400 flex items-center justify-center text-[10px] text-zinc-500">
										Sem QR Code
									</div>
								{/if}
							</div>
						</div>
					</div>

					<!-- Bottom Perforation Simulation -->
					<div class="absolute -bottom-1.5 left-0 right-0 h-1.5 bg-[radial-gradient(circle,_transparent_3px,_#ffffff_3px)] bg-[length:8px_8px]"></div>
				</div>
			</div>
		</div>
	</div>
</div>
