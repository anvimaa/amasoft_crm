<script lang="ts">
	import { crmStore } from '../stores/crm.svelte';
	import { toast } from '../stores/toast.svelte';
	import Icon from './Icon.svelte';
	import type { RawClientData } from '../types/crm';

	let fileInputRef = $state<HTMLInputElement | null>(null);
	let isDragging = $state<boolean>(false);
	let fileName = $state<string>('');
	let fileSize = $state<string>('');
	let parsedData = $state<RawClientData[] | null>(null);
	let parseError = $state<string | null>(null);
	let skipDuplicates = $state<boolean>(true);
	let isImporting = $state<boolean>(false);

	let duplicateCount = $derived.by(() => {
		if (!parsedData) return 0;
		const existingTitles = new Set(crmStore.leads.map((l) => l.title.trim().toLowerCase()));
		const existingPhones = new Set(
			crmStore.leads
				.filter((l) => l.phoneUnformatted || l.phone)
				.map((l) => (l.phoneUnformatted || l.phone || '').replace(/[^0-9]/g, ''))
				.filter(Boolean)
		);

		return parsedData.filter((item) => {
			if (!item.title) return true;
			const titleNorm = item.title.trim().toLowerCase();
			const phoneClean = (item.phoneUnformatted || item.phone || '').replace(/[^0-9]/g, '');
			return existingTitles.has(titleNorm) || (phoneClean.length >= 8 && existingPhones.has(phoneClean));
		}).length;
	});

	let leadsToImportCount = $derived.by(() => {
		if (!parsedData) return 0;
		if (skipDuplicates) {
			return Math.max(0, parsedData.length - duplicateCount);
		}
		return parsedData.length;
	});

	let withPhoneInFile = $derived.by(() => {
		if (!parsedData) return 0;
		return parsedData.filter((item) => !!item.phone).length;
	});

	let withWebsiteInFile = $derived.by(() => {
		if (!parsedData) return 0;
		return parsedData.filter((item) => !!item.website).length;
	});

	function resetState() {
		fileName = '';
		fileSize = '';
		parsedData = null;
		parseError = null;
		isImporting = false;
		if (fileInputRef) {
			fileInputRef.value = '';
		}
	}

	function handleClose() {
		resetState();
		crmStore.isImportModalOpen = false;
	}

	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	async function processFile(file: File) {
		resetState();
		fileName = file.name;
		fileSize = formatBytes(file.size);

		if (!file.name.toLowerCase().endsWith('.json')) {
			parseError = 'O ficheiro selecionado não é um ficheiro JSON válido (.json).';
			return;
		}

		try {
			const text = await file.text();
			const json = JSON.parse(text);

			if (!Array.isArray(json)) {
				parseError = 'O ficheiro JSON deve conter uma lista (array) de empresas.';
				return;
			}

			if (json.length === 0) {
				parseError = 'O ficheiro JSON está vazio.';
				return;
			}

			// Validate at least some fields match
			const sample = json[0];
			if (!sample || typeof sample !== 'object' || (!sample.title && !sample.categoryName)) {
				parseError = 'O formato do ficheiro não corresponde ao esquema de empresas (campos esperados: title, categoryName, city, phone, etc.).';
				return;
			}

			parsedData = json as RawClientData[];
			parseError = null;
		} catch (e: any) {
			parseError = `Erro ao ler o ficheiro JSON: ${e.message || 'Sintaxe inválida.'}`;
		}
	}

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			processFile(target.files[0]);
		}
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
			processFile(e.dataTransfer.files[0]);
		}
	}

	async function handleExecuteImport() {
		if (!parsedData || parsedData.length === 0) return;

		isImporting = true;
		try {
			const result = await crmStore.importLeads(parsedData, { skipDuplicates });
			
			toast.success(
				'Importação Concluída',
				`${result.importedCount} empresas foram adicionadas com sucesso à sua base de prospeção.` +
				(result.skippedCount > 0 ? ` (${result.skippedCount} duplicados/inválidos ignorados)` : '')
			);

			handleClose();
		} catch (e) {
			toast.error('Erro na Importação', 'Não foi possível salvar os novos dados no servidor.');
		} finally {
			isImporting = false;
		}
	}
</script>

{#if crmStore.isImportModalOpen}
	<!-- Static Backdrop (does not close on click) -->
	<div
		class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm w-full h-full"
		aria-hidden="true"
	></div>

	<!-- Modal Wrapper -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
		<div
			class="pointer-events-auto relative w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col"
		>
			<!-- Header -->
			<div class="flex items-start justify-between border-b border-zinc-800/80 pb-4">
				<div class="flex items-center gap-3">
					<div class="rounded-xl bg-zinc-800 p-2.5 text-zinc-100 border border-zinc-700/60">
						<Icon name="upload" class="w-5 h-5" />
					</div>
					<div>
						<h3 class="text-base font-semibold text-white tracking-tight">
							Importar Ficheiro de Empresas (.json)
						</h3>
						<p class="text-xs text-zinc-400 mt-0.5">
							Carregue um arquivo JSON no mesmo formato do catálogo <code class="font-mono text-zinc-300">clientes.json</code>
						</p>
					</div>
				</div>

				<button
					type="button"
					onclick={handleClose}
					class="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
					aria-label="Fechar modal"
				>
					<Icon name="close" class="w-4 h-4" />
				</button>
			</div>

			<!-- Body (Scrollable) -->
			<div class="space-y-4 overflow-y-auto pr-1">
				
				<!-- Upload / Drag & Drop Area -->
				<div
					class="relative border-2 border-dashed rounded-xl p-6 text-center transition-colors {isDragging ? 'border-zinc-400 bg-zinc-900/60' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/30'}"
					ondragover={(e) => { e.preventDefault(); isDragging = true; }}
					ondragleave={() => isDragging = false}
					ondrop={handleDrop}
					role="region"
					aria-label="Área de envio de arquivo"
				>
					<input
						type="file"
						accept=".json,application/json"
						bind:this={fileInputRef}
						onchange={handleFileSelect}
						class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
					/>
					
					<div class="flex flex-col items-center justify-center space-y-2 pointer-events-none">
						<div class="rounded-full bg-zinc-800/80 p-3 text-zinc-300 border border-zinc-700/50">
							<Icon name="file" class="w-6 h-6" />
						</div>
						
						<div>
							<span class="text-xs font-semibold text-zinc-200">
								Clique para selecionar
							</span>
							<span class="text-xs text-zinc-400"> ou arraste o ficheiro JSON aqui</span>
						</div>
						
						<p class="text-[11px] text-zinc-500">
							Compatível com estrutura nativa (14 campos incluindo title, phone, city, etc.)
						</p>
					</div>
				</div>

				<!-- Error State -->
				{#if parseError}
					<div class="rounded-xl border border-rose-900/60 bg-rose-950/30 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
						<Icon name="close" class="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
						<div class="space-y-0.5">
							<strong class="font-semibold text-rose-200">Ficheiro Inválido</strong>
							<p class="text-rose-300/90">{parseError}</p>
						</div>
					</div>
				{/if}

				<!-- File Analyzed & Preview Stats -->
				{#if parsedData && !parseError}
					<div class="space-y-3">
						
						<!-- File Summary Badge Bar -->
						<div class="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 text-xs">
							<div class="flex items-center gap-2 truncate">
								<Icon name="check" class="w-4 h-4 text-emerald-400 shrink-0" />
								<span class="font-mono text-zinc-200 truncate">{fileName}</span>
								<span class="text-zinc-500">({fileSize})</span>
							</div>

							<button
								type="button"
								onclick={resetState}
								class="text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
							>
								Trocar ficheiro
							</button>
						</div>

						<!-- Metric Cards Grid -->
						<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
							<div class="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-2.5">
								<span class="text-[10px] text-zinc-500 font-medium">Total no Ficheiro</span>
								<p class="text-sm font-bold font-mono text-zinc-100 mt-0.5">{parsedData.length}</p>
							</div>

							<div class="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-2.5">
								<span class="text-[10px] text-zinc-500 font-medium">Com Telefone</span>
								<p class="text-sm font-bold font-mono text-emerald-400 mt-0.5">{withPhoneInFile}</p>
							</div>

							<div class="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-2.5">
								<span class="text-[10px] text-zinc-500 font-medium">Com Website</span>
								<p class="text-sm font-bold font-mono text-sky-400 mt-0.5">{withWebsiteInFile}</p>
							</div>

							<div class="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-2.5">
								<span class="text-[10px] text-zinc-500 font-medium">Já Existentes (Dup.)</span>
								<p class="text-sm font-bold font-mono text-amber-400 mt-0.5">{duplicateCount}</p>
							</div>
						</div>

						<!-- Options Toggle -->
						<div class="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-xs">
							<label class="flex items-start gap-2.5 cursor-pointer select-none">
								<input
									type="checkbox"
									bind:checked={skipDuplicates}
									class="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-zinc-100 focus:ring-0 cursor-pointer"
								/>
								<div class="space-y-0.5">
									<span class="font-medium text-zinc-200">Ignorar empresas já existentes na base</span>
									<p class="text-[11px] text-zinc-400">
										Empresas com mesmo nome comercial ou mesmo contacto telefónico não serão duplicadas.
									</p>
								</div>
							</label>
						</div>

						<!-- Preview Table -->
						<div class="space-y-1.5">
							<div class="flex items-center justify-between text-[11px] text-zinc-400 px-0.5">
								<span>Amostra dos registos identificados (primeiras 4 contas):</span>
								<span>Total a importar: <strong class="text-zinc-200 font-mono">{leadsToImportCount}</strong></span>
							</div>

							<div class="rounded-lg border border-zinc-800/80 bg-zinc-950 overflow-hidden text-xs">
								<table class="w-full text-left">
									<thead class="bg-zinc-900 text-[10px] text-zinc-400 uppercase border-b border-zinc-800">
										<tr>
											<th class="px-3 py-1.5 font-semibold">Empresa</th>
											<th class="px-3 py-1.5 font-semibold">Setor</th>
											<th class="px-3 py-1.5 font-semibold">Cidade</th>
											<th class="px-3 py-1.5 font-semibold">Contacto</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-zinc-800/60 font-mono text-[11px] text-zinc-300">
										{#each parsedData.slice(0, 4) as item}
											<tr class="hover:bg-zinc-900/40">
												<td class="px-3 py-1.5 font-sans font-medium text-zinc-100 truncate max-w-[150px]">
													{item.title || 'Sem Nome'}
												</td>
												<td class="px-3 py-1.5 font-sans text-zinc-400 truncate max-w-[120px]">
													{item.categoryName || 'Geral'}
												</td>
												<td class="px-3 py-1.5 font-sans text-zinc-300">
													{item.city || 'Desconhecida'}
												</td>
												<td class="px-3 py-1.5 text-zinc-400">
													{item.phone || '-'}
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Footer Actions -->
			<div class="flex items-center justify-between pt-4 border-t border-zinc-800/80 text-xs">
				<button
					type="button"
					onclick={handleClose}
					class="rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 font-medium text-zinc-300 hover:bg-zinc-800 cursor-pointer transition-colors"
				>
					Cancelar
				</button>

				<button
					type="button"
					disabled={!parsedData || parseError !== null || leadsToImportCount === 0 || isImporting}
					onclick={handleExecuteImport}
					class="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-4 py-2 font-semibold text-zinc-950 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-sm"
				>
					{#if isImporting}
						<div class="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
						<span>A importar...</span>
					{:else}
						<Icon name="upload" class="w-3.5 h-3.5" />
						<span>Importar {leadsToImportCount} {leadsToImportCount === 1 ? 'Empresa' : 'Empresas'}</span>
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
