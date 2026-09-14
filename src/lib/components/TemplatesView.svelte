<script lang="ts">
	import { templatesStore } from '../stores/templates.svelte';
	import { crmStore } from '../stores/crm.svelte';
	import { companyStore } from '../stores/company.svelte';
	import { toast } from '../stores/toast.svelte';
	import Icon from './Icon.svelte';
	import type { ApproachTemplate, TemplateCategory } from '../types/crm';
	import { generateWhatsAppLink } from '../utils/whatsapp';

	const CATEGORIES: { id: TemplateCategory | 'all'; label: string; color: string }[] = [
		{ id: 'all', label: 'Todos os Modelos', color: '#71717a' },
		{ id: 'prospecting', label: 'Prospecção', color: '#3b82f6' },
		{ id: 'followup', label: 'Acompanhamento', color: '#f59e0b' },
		{ id: 'meeting', label: 'Reunião', color: '#8b5cf6' },
		{ id: 'proposal', label: 'Proposta', color: '#10b981' },
		{ id: 'closing', label: 'Encerramento', color: '#ec4899' },
		{ id: 'reactivation', label: 'Reativação', color: '#ef4444' }
	];

	function getCategoryInfo(cat: string) {
		return CATEGORIES.find((c) => c.id === cat) || { label: cat, color: '#71717a' };
	}

	function copyTemplateContent(template: ApproachTemplate) {
		const rendered = templatesStore.renderTemplate(template, {
			company: companyStore.company,
			assigneeName: 'Equipa Comercial'
		});
		navigator.clipboard.writeText(rendered);
		toast.success('Copiado', 'Texto da mensagem copiado para a área de transferência.');
	}

	function duplicateTemplate(template: ApproachTemplate) {
		templatesStore.addTemplate({
			title: `${template.title} (Cópia)`,
			description: template.description,
			category: template.category,
			content: template.content
		});
		toast.success('Modelo Duplicado', 'Nova cópia criada com sucesso.');
	}

	let deletingTemplate = $state<ApproachTemplate | null>(null);

	function handleDelete(template: ApproachTemplate) {
		deletingTemplate = template;
	}

	function confirmDeleteTemplate() {
		if (!deletingTemplate) return;
		templatesStore.deleteTemplate(deletingTemplate.id);
		toast.info('Modelo Removido', `O modelo "${deletingTemplate.title}" foi excluído com sucesso.`);
		deletingTemplate = null;
	}
</script>

<div class="space-y-6 pb-12">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<div class="flex items-center gap-2">
				<h1 class="text-xl font-bold tracking-tight text-white">Modelos de Mensagem & Abordagem</h1>
				<span class="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-mono text-zinc-300 border border-zinc-700/60">
					{templatesStore.templates.length} modelos
				</span>
			</div>
			<p class="text-xs text-zinc-400 mt-1">
				Gerencie templates corporativos para prospecção, reuniões e fecho de negócios via WhatsApp e E-mail.
			</p>
		</div>

		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={() => templatesStore.resetToDefaults()}
				class="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
				title="Restaurar modelos padrão da Amasoft"
			>
				<Icon name="refresh" class="w-3.5 h-3.5 inline mr-1" />
				<span>Restaurar Padrões</span>
			</button>

			<button
				type="button"
				onclick={() => templatesStore.openNewModal()}
				class="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-white transition-colors cursor-pointer shadow-sm"
			>
				<Icon name="plus" class="w-3.5 h-3.5" />
				<span>Novo Modelo</span>
			</button>
		</div>
	</div>

	<!-- Controls & Search -->
	<div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3.5 space-y-3">
		<div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
			<!-- Search Bar -->
			<div class="relative flex-1">
				<Icon name="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
				<input
					type="text"
					bind:value={templatesStore.search}
					placeholder="Pesquisar por título, objetivo ou palavras-chave..."
					class="w-full rounded-md bg-zinc-950 border border-zinc-800 pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
				/>
			</div>

			<!-- Dynamic Variables Badge Helper -->
			<div class="text-[11px] text-zinc-400 flex items-center gap-1.5 overflow-x-auto">
				<span class="text-zinc-500">Tags suportadas:</span>
				<span class="font-mono text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">{`{empresa}`}</span>
				<span class="font-mono text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">{`{setor}`}</span>
				<span class="font-mono text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">{`{cidade}`}</span>
				<span class="font-mono text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">{`{meu_nome}`}</span>
			</div>
		</div>

		<!-- Category Filter Tabs -->
		<div class="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-zinc-800/60 text-xs">
			{#each CATEGORIES as cat}
				{@const count = templatesStore.countsByCategory[cat.id] ?? 0}
				<button
					type="button"
					onclick={() => templatesStore.activeCategory = cat.id}
					class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer text-xs {templatesStore.activeCategory === cat.id ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm' : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'}"
				>
					<span>{cat.label}</span>
					<span class="rounded-full px-1.5 py-0.2 text-[10px] font-mono {templatesStore.activeCategory === cat.id ? 'bg-zinc-300 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400'}">
						{count}
					</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Templates Cards Grid -->
	{#if templatesStore.filteredTemplates.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each templatesStore.filteredTemplates as template (template.id)}
				{@const catInfo = getCategoryInfo(template.category)}
				<div
					class="group flex flex-col justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4 hover:border-zinc-700 hover:bg-zinc-900/60 transition-all shadow-sm"
				>
					<div class="space-y-3">
						<!-- Top Header: Category Badge & Actions -->
						<div class="flex items-center justify-between gap-2">
							<span
								class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider"
								style="background-color: {catInfo.color}15; color: {catInfo.color}; border: 1px solid {catInfo.color}30;"
							>
								{catInfo.label}
							</span>

							<div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
								<button
									type="button"
									onclick={() => duplicateTemplate(template)}
									title="Duplicar modelo"
									class="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
								>
									<Icon name="copy" class="w-3.5 h-3.5" />
								</button>
								<button
									type="button"
									onclick={() => templatesStore.openEditModal(template)}
									title="Editar modelo"
									class="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
								>
									<Icon name="edit" class="w-3.5 h-3.5" />
								</button>
								<button
									type="button"
									onclick={() => handleDelete(template)}
									title="Excluir modelo"
									class="rounded p-1 text-zinc-400 hover:bg-rose-950/60 hover:text-rose-300 transition-colors cursor-pointer"
								>
									<Icon name="trash" class="w-3.5 h-3.5" />
								</button>
							</div>
						</div>

						<!-- Title & Description -->
						<div>
							<h3 class="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors">
								{template.title}
							</h3>
							{#if template.description}
								<p class="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
									{template.description}
								</p>
							{/if}
						</div>

						<!-- Content Box Preview -->
						<div class="rounded-lg bg-zinc-950/90 border border-zinc-800/70 p-3 font-mono text-[11px] text-zinc-300 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap select-text">
							{template.content}
						</div>
					</div>

					<!-- Bottom Action Footer -->
					<div class="flex items-center justify-between pt-3 mt-3 border-t border-zinc-800/60 text-xs">
						<span class="text-[10px] text-zinc-500 font-mono">
							Tags configuradas
						</span>

						<div class="flex items-center gap-1.5">
							<button
								type="button"
								onclick={() => copyTemplateContent(template)}
								class="flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
								title="Copiar texto pronto"
							>
								<Icon name="copy" class="w-3 h-3" />
								<span>Copiar</span>
							</button>

							<button
								type="button"
								onclick={() => templatesStore.openEditModal(template)}
								class="flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-[11px] font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer"
							>
								<span>Personalizar</span>
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="rounded-2xl border border-zinc-800 bg-zinc-950 p-12 text-center space-y-3">
			<div class="inline-flex rounded-full bg-zinc-900 p-3 text-zinc-400 border border-zinc-800">
				<Icon name="message-square" class="w-6 h-6" />
			</div>
			<div class="space-y-1">
				<h3 class="text-sm font-semibold text-zinc-200">Nenhum modelo encontrado</h3>
				<p class="text-xs text-zinc-500 max-w-sm mx-auto">
					Não foram encontrados modelos para a pesquisa ou categoria selecionada.
				</p>
			</div>
			<button
				type="button"
				onclick={() => { templatesStore.activeCategory = 'all'; templatesStore.search = ''; }}
				class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 cursor-pointer"
			>
				Limpar Filtros
			</button>
		</div>
	{/if}
</div>

{#if deletingTemplate}
	<!-- Static Backdrop (does not close on click) -->
	<div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm w-full h-full" aria-hidden="true"></div>

	<!-- Modal Wrapper -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
		<div
			class="pointer-events-auto relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4"
		>
			<div class="flex items-start gap-3">
				<div class="rounded-xl bg-rose-950/40 p-2.5 text-rose-400 border border-rose-900/40 shrink-0">
					<Icon name="trash" class="w-5 h-5" />
				</div>
				<div class="space-y-1.5 flex-1 min-w-0">
					<h3 class="text-base font-semibold text-white">Eliminar Modelo de Abordagem?</h3>
					<p class="text-xs text-zinc-400 leading-relaxed">
						Esta ação é irreversível. Tem a certeza de que deseja eliminar o modelo <strong class="text-zinc-200">"{deletingTemplate.title}"</strong>?
					</p>
					
					<div class="mt-2 rounded-lg bg-zinc-900/70 border border-zinc-800/80 p-2.5 text-[11px] text-zinc-400 font-mono line-clamp-3 leading-relaxed">
						{deletingTemplate.content}
					</div>
				</div>
			</div>

			<div class="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
				<button
					type="button"
					onclick={() => deletingTemplate = null}
					class="rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 cursor-pointer"
				>
					Cancelar
				</button>
				<button
					type="button"
					onclick={confirmDeleteTemplate}
					class="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 cursor-pointer shadow-sm"
				>
					<Icon name="trash" class="w-3.5 h-3.5" />
					<span>Eliminar Modelo</span>
				</button>
			</div>
		</div>
	</div>
{/if}

