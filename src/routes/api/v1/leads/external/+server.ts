import type { RequestHandler } from './$types';
import { getLeads, saveLeads } from '#lib/server/db.ts';
import type { ClientLead, LeadPriority } from '#lib/types/crm.ts';
import { FACTFLEXI_API_KEY } from '$app/env/private';
import { ExternalLeadInputSchema } from '#lib/schemas/external-lead.ts';

function getExpectedApiKey(): string {
	return FACTFLEXI_API_KEY?.trim() || '';
}

function validateApiKey(request: Request, url: URL): boolean {
	const expected = getExpectedApiKey();
	if (!expected) return false;

	// 1. Header: x-api-key or api-key
	const headerKey = request.headers.get('x-api-key') || request.headers.get('api-key');
	if (headerKey && headerKey.trim() === expected) return true;

	// 2. Header: Authorization: Bearer <key>
	const authHeader = request.headers.get('authorization');
	if (authHeader && authHeader.startsWith('Bearer ')) {
		const token = authHeader.slice(7).trim();
		if (token === expected) return true;
	}

	// 3. Query Param: ?apiKey=... or ?api_key=...
	const queryKey = url.searchParams.get('apiKey') || url.searchParams.get('api_key') || url.searchParams.get('key');
	if (queryKey && queryKey.trim() === expected) return true;

	return false;
}

function cleanPhoneNumber(phone?: string | null): { phone: string | null; phoneUnformatted: string | null } {
	if (!phone) return { phone: null, phoneUnformatted: null };
	const unformatted = phone.replace(/[^0-9+]/g, '');
	return {
		phone: phone.trim(),
		phoneUnformatted: unformatted || null
	};
}

export const POST: RequestHandler = async ({ request, url }) => {
	// 1. Authenticate Request via API Key
	if (!validateApiKey(request, url)) {
		return Response.json(
			{
				success: false,
				error: 'Unauthorized',
				message: 'Chave de API inválida ou não fornecida. Use o header x-api-key ou Authorization: Bearer <chave_api>'
			},
			{ status: 401 }
		);
	}

	try {
		let rawBody: unknown;
		try {
			rawBody = await request.json();
		} catch {
			return Response.json(
				{
					success: false,
					error: 'Invalid JSON',
					message: 'O corpo da requisição deve ser um JSON válido.'
				},
				{ status: 400 }
			);
		}

		// 2. Validate payload with Zod
		const validationResult = ExternalLeadInputSchema.safeParse(rawBody);
		if (!validationResult.success) {
			const issue = validationResult.error.issues[0];
			return Response.json(
				{
					success: false,
					error: 'Bad Request',
					message: issue?.message || 'Dados inválidos.',
					details: validationResult.error.issues.map((i) => ({
						field: i.path.join('.'),
						message: i.message
					}))
				},
				{ status: 400 }
			);
		}

		const body = validationResult.data;

		// Flexible key mapping for Fact Flexi payloads
		const title = (body.title || body.nome || body.name || body.company_name || body.empresa || '').trim();
		const rawPhone = body.phone || body.telefone || body.telemovel || body.phoneUnformatted || null;
		const { phone, phoneUnformatted } = cleanPhoneNumber(rawPhone);

		const email = (body.email || body.correio_eletronico || '').trim() || undefined;
		const website = (body.website || body.site || body.url || '').trim() || null;
		const nif = (body.nif || body.tax_id || body.numero_contribuinte || '').trim();
		const address = (body.address || body.endereco || body.morada || '').trim() || null;
		const neighborhood = (body.neighborhood || body.bairro || '').trim() || null;
		const city = (body.city || body.cidade || body.municipio || 'Luanda').trim();
		const state = (body.state || body.provincia || 'Luanda').trim();
		const categoryName = (body.categoryName || body.category || body.categoria || body.sector || 'Serviços').trim();
		const decisionMaker = (body.decisionMaker || body.contacto || body.responsavel || body.gestor || '').trim() || undefined;
		const decisionMakerRole = (body.decisionMakerRole || body.cargo || '').trim() || undefined;
		const estimatedValue = Number(body.estimatedValue || body.valorEstimado || body.valor || 0) || 0;

		const leads = getLeads();

		// Duplicate detection: match by Title or Phone
		const existingIndex = leads.findIndex((l) => {
			const sameTitle = l.title.toLowerCase().trim() === title.toLowerCase();
			const samePhone = phoneUnformatted && l.phoneUnformatted && l.phoneUnformatted === phoneUnformatted;
			return sameTitle || samePhone;
		});

		const hasPhone = Boolean(phone || phoneUnformatted);
		const hasWebsite = Boolean(website);

		// Priority derivation
		let priority: LeadPriority = 'cold';
		if (hasPhone && !hasWebsite) priority = 'hot';
		else if (hasPhone && hasWebsite) priority = 'warm';

		const nowIso = new Date().toISOString();

		if (existingIndex >= 0) {
			// Update existing lead
			const existing = leads[existingIndex];

			if (email && !existing.email) existing.email = email;
			if (decisionMaker && !existing.decisionMaker) existing.decisionMaker = decisionMaker;
			if (decisionMakerRole && !existing.decisionMakerRole) existing.decisionMakerRole = decisionMakerRole;
			if (website && !existing.website) existing.website = website;
			if (address && !existing.address) existing.address = address;
			if (nif && !existing.tags.some((t) => t.startsWith('NIF:'))) existing.tags.push(`NIF: ${nif}`);
			if (!existing.tags.includes('Fact Flexi')) existing.tags.push('Fact Flexi');

			// Add note from Fact Flexi
			existing.notes.unshift({
				id: `note-${Date.now()}`,
				content: `Cliente sincronizado via Fact Flexi API. NIF: ${nif || 'N/A'}, Contacto: ${decisionMaker || 'N/A'}.`,
				createdAt: nowIso,
				type: 'general'
			});

			leads[existingIndex] = existing;
			saveLeads(leads);

			return Response.json(
				{
					success: true,
					action: 'updated',
					message: `Cliente "${title}" já existia no CRM e foi atualizado com os dados da Fact Flexi.`,
					lead: existing
				},
				{ status: 200 }
			);
		}

		// Create New Lead
		const tags: string[] = ['Fact Flexi'];
		if (city) tags.push(city);
		if (hasWebsite) tags.push('Com Website');
		else tags.push('Sem Website');
		if (hasPhone) tags.push('Telefone Válido');
		if (nif) tags.push(`NIF: ${nif}`);

		const newLead: ClientLead = {
			id: `lead-ff-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
			title,
			categories: [categoryName],
			categoryName,
			address,
			neighborhood,
			street: address,
			city,
			postalCode: null,
			state,
			countryCode: 'AO',
			website,
			phone,
			phoneUnformatted,
			location: null,
			plusCode: null,
			status: 'lead',
			priority,
			estimatedValue,
			tags,
			notes: [
				{
					id: `note-${Date.now()}`,
					content: `Lead cadastrado automaticamente via Fact Flexi API. NIF: ${nif || 'N/A'}${decisionMaker ? ` | Responsável: ${decisionMaker}` : ''}.`,
					createdAt: nowIso,
					type: 'general'
				}
			],
			lastContactDate: null,
			nextFollowUpDate: null,
			email,
			decisionMaker,
			decisionMakerRole
		};

		// Prepend to database
		leads.unshift(newLead);
		saveLeads(leads);

		return Response.json(
			{
				success: true,
				action: 'created',
				message: `Novo lead "${title}" cadastrado com sucesso no Amasoft CRM via Fact Flexi API.`,
				lead: newLead
			},
			{ status: 201 }
		);
	} catch (error: any) {
		console.error('Error in Fact Flexi external lead API:', error);
		return Response.json(
			{
				success: false,
				error: 'Internal Server Error',
				message: error.message || 'Erro ao processar criação de lead.'
			},
			{ status: 500 }
		);
	}
};
