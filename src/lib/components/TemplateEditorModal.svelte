<script lang="ts">
	import { templatesStore } from '../stores/templates.svelte';
	import { companyStore } from '../stores/company.svelte';
	import { toast } from '../stores/toast.svelte';
	import Icon from './Icon.svelte';
	import type { ApproachTemplate, TemplateCategory } from '../types/crm';

	let title = $state<string>('');
	let description = $state<string>('');
	let category = $state<TemplateCategory>('prospecting');
	let content = $state<string>('');

	const CATEGORIES: { id: TemplateCategory; label: string }[] = [
		{ id: 'prospecting', label: 'Prospecção' },
		{ id: 'followup', label: 'Acompanhamento' },
		{ id: 'meeting', label: 'Reunião' },
		{ id: 'proposal', label: 'Proposta' },
		{ id: 'closing', label: 'Encerramento' },
		{ id: 'reactivation', label: 'Reativação' },
		{ id: 'general', label: 'Geral' }
	];

	const VARIABLES: { tag: string; label: string; example: string }[] = [
		{ tag: '{empresa}', label: 'Nome da Empresa', example: 'Sonangol E.P.' },
		{ tag: '{setor}', label: 'Setor de Atividade', example: 'Petróleo & Energia' },
		{ tag: '{cidade}', label: 'Cidade / Província', example: 'Luanda' },
		{ tag: '{decisor}', label: 'Nome do Decisor', example: 'Sr. António Silva' },
		{ tag: '{minha_empresa}', label: 'A Minha Empresa', example: companyStore.company.name },
		{ tag: '{meu_nome}', label: 'Meu Nome / Comercial', example: 'Comercial Amasoft' },
		{ tag: '{website}', label: 'Website Institucional', example: companyStore.company.website },
		{ tag: '{telefone}', label: 'Telefone de Contacto', example: companyStore.company.phone }
	];

	$effect(() => {
		if (templatesStore.editingTemplate) {
			title = templatesStore.editingTemplate.title;
			description = templatesStore.editingTemplate.description || '';
			category = templatesStore.editingTemplate.category;
			content = templatesStore.editingTemplate.content;
		} else {
			title = '';
			description = '';
			category = (templatesStore.activeCategory !== 'all' ? templatesStore.activeCategory : 'prospecting') as TemplateCategory;
			content = '';
		}
	});

	let previewRendered = $derived.by(() => {
		if (!content.trim()) return '';
		return templatesStore.renderTemplate(
			{
				id: 'preview',
				title,
				description,
				category,
				content,
				createdAt: ''
			},
			{
				lead: {
					title: 'Sonangol E.P.',
					categoryName: 'Petróleo & Gás',
					city: 'Luanda',
					decisionMaker: 'Eng. Manuel Costa'
				},
				company: companyStore.company,
				assigneeName: 'Equipa Comercial'
			}
		);
	});

	function insertVariable(tag: string) {
		content = content + (content.endsWith(' ') || content === '' ? '' : ' ') + tag;
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (!title.trim() || !content.trim()) {
			toast.error('Campos Obrigatórios', 'Por favor preencha o título e o conteúdo da mensagem.');
			return;
		}

		if (templatesStore.editingTemplate) {
			templatesStore.updateTemplate(templatesStore.editingTemplate.id, {
				title: title.trim(),
				description: description.trim(),
				category,
				content: content.trim()
			});
			toast.success('Modelo Atualizado', `O modelo "${title}" foi salvo com sucesso.`);
		} else {
			templatesStore.addTemplate({
				title: title.trim(),
				description: description.trim(),
				category,
				content: content.trim()
			});
			toast.success('Modelo Criado', `O modelo "${title}" foi adicionado ao catálogo.`);
		}

		templatesStore.closeModal();
	}
</script>

{#if templatesStore.isEditorModalOpen}
	<!-- Static Backdrop (does not close on outside click) -->
	<div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm w-full h-full" aria-hidden="true"></div>

	<!-- Modal Wrapper -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
		<div
			class="pointer-events-auto relative w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col"
		>
			<!-- Header -->
			<div class="flex items-start justify-between border-b border-zinc-800 pb-4">
				<div class="flex items-center gap-3">
					<div class="rounded-xl bg-zinc-800 p-2.5 text-zinc-100 border border-zinc-700/60">
						<Icon name="message-square" class="w-5 h-5" />
					</div>
					<div>
						<h3 class="text-base font-semibold text-white tracking-tight">
							{templatesStore.editingTemplate ? 'Editar Modelo de Mensagem' : 'Novo Modelo de Abordagem'}
						</h3>
						<p class="text-xs text-zinc-400 mt-0.5">
							Configure os parâmetros e variáveis dinâmicas para comunicação via WhatsApp
						</p>
					</div>
				</div>

				<button
					type="button"
					onclick={() => templatesStore.closeModal()}
					class="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
					aria-label="Fechar modal"
				>
					<Icon name="close" class="w-4 h-4" />
				</button>
			</div>

			<!-- Body -->
			<form onsubmit={handleSubmit} class="space-y-4 overflow-y-auto pr-1 text-xs">
				<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
					<!-- Title -->
					<div class="md:col-span-2 space-y-1">
						<label for="tmpl-title" class="block text-[11px] font-medium text-zinc-300">
							Título do Modelo *
						</label>
						<input
							id="tmpl-title"
							type="text"
							required
							bind:value={title}
							placeholder="Ex: Abordagem Web — Empresas sem site"
							class="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
						/>
					</div>

					<!-- Category -->
					<div class="space-y-1">
						<label for="tmpl-category" class="block text-[11px] font-medium text-zinc-300">
							Categoria *
						</label>
						<select
							id="tmpl-category"
							bind:value={category}
							class="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-zinc-200 focus:border-zinc-600 focus:outline-none cursor-pointer"
						>
							{#each CATEGORIES as cat}
								<option value={cat.id}>{cat.label}</option>
							{/each}
						</select>
					</div>
				</div>

				<!-- Description -->
				<div class="space-y-1">
					<label for="tmpl-desc" class="block text-[11px] font-medium text-zinc-300">
						Finalidade / Quando Usar
					</label>
					<input
						id="tmpl-desc"
						type="text"
						bind:value={description}
						placeholder="Ex: Usar para empresas contactadas pela primeira vez sem presença online"
						class="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
					/>
				</div>

				<!-- Variable Quick Insert Bar -->
				<div class="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3 space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-[11px] font-semibold text-zinc-300">Tags / Variáveis Disponíveis</span>
						<span class="text-[10px] text-zinc-500">Clique para inserir no texto</span>
					</div>

					<div class="flex flex-wrap gap-1.5">
						{#each VARIABLES as v}
							<button
								type="button"
								onclick={() => insertVariable(v.tag)}
								class="inline-flex items-center gap-1 rounded bg-zinc-800 hover:bg-zinc-700 px-2 py-1 text-[11px] font-mono text-zinc-300 border border-zinc-700/60 transition-colors cursor-pointer"
								title={`Exemplo: ${v.example}`}
							>
								<span class="text-zinc-100 font-semibold">{v.tag}</span>
								<span class="text-[10px] text-zinc-400">({v.label})</span>
							</button>
						{/each}
					</div>
				</div>

				<!-- Content Textarea & Live Preview Grid -->
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
					<!-- Textarea -->
					<div class="space-y-1">
						<label for="tmpl-content" class="block text-[11px] font-medium text-zinc-300">
							Mensagem do Modelo (com formatação WhatsApp) *
						</label>
						<textarea
							id="tmpl-content"
							rows="9"
							required
							bind:value={content}
							placeholder={'Prezada equipa da *{empresa}*,...'}
							class="w-full rounded-lg bg-zinc-900 border border-zinc-800 p-3 text-zinc-100 font-mono text-xs placeholder-zinc-600 focus:border-zinc-600 focus:outline-none leading-relaxed resize-none"
						></textarea>
						<p class="text-[10px] text-zinc-500">
							Dica: Use <code class="text-zinc-400 font-mono">*texto*</code> para negrito e <code class="text-zinc-400 font-mono">_texto_</code> para itálico no WhatsApp.
						</p>
					</div>

					<!-- Live Preview -->
					<div class="space-y-1">
						<div class="flex items-center justify-between">
							<span class="text-[11px] font-medium text-zinc-400">Pré-visualização (com dados de exemplo):</span>
							<span class="text-[10px] text-emerald-400 font-mono">WhatsApp Ready</span>
						</div>

						<div class="h-[210px] rounded-lg border border-emerald-900/40 bg-emerald-950/10 p-3.5 overflow-y-auto space-y-2">
							<div class="rounded-lg bg-zinc-900/90 border border-zinc-800 p-3 shadow-sm">
								{#if previewRendered}
									<p class="whitespace-pre-wrap text-xs text-zinc-200 leading-relaxed">
										{previewRendered}
									</p>
								{:else}
									<p class="text-xs text-zinc-500 italic">
										Comece a escrever o modelo para ver a pré-visualização em tempo real...
									</p>
								{/if}
							</div>
						</div>
					</div>
				</div>

				<!-- Footer Buttons -->
				<div class="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-800">
					<button
						type="button"
						onclick={() => templatesStore.closeModal()}
						class="rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 cursor-pointer transition-colors"
					>
						Cancelar
					</button>

					<button
						type="submit"
						class="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-white cursor-pointer transition-colors shadow-sm"
					>
						<Icon name="check" class="w-3.5 h-3.5" />
						<span>{templatesStore.editingTemplate ? 'Salvar Alterações' : 'Criar Modelo'}</span>
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
