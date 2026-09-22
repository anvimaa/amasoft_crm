import { z } from 'zod';

export const ExternalLeadInputSchema = z.object({
	// Company title / name aliases
	title: z.string().trim().optional(),
	nome: z.string().trim().optional(),
	name: z.string().trim().optional(),
	empresa: z.string().trim().optional(),
	company_name: z.string().trim().optional(),

	// Phone & Contact numbers
	phone: z.string().trim().nullish(),
	telefone: z.string().trim().nullish(),
	telemovel: z.string().trim().nullish(),
	phoneUnformatted: z.string().trim().nullish(),

	// Email & Website
	email: z.string().trim().nullish(),
	correio_eletronico: z.string().trim().nullish(),
	website: z.string().trim().nullish(),
	site: z.string().trim().nullish(),
	url: z.string().trim().nullish(),

	// Identification & Location
	nif: z.string().trim().nullish(),
	tax_id: z.string().trim().nullish(),
	numero_contribuinte: z.string().trim().nullish(),
	address: z.string().trim().nullish(),
	endereco: z.string().trim().nullish(),
	morada: z.string().trim().nullish(),
	neighborhood: z.string().trim().nullish(),
	bairro: z.string().trim().nullish(),
	city: z.string().trim().nullish(),
	cidade: z.string().trim().nullish(),
	municipio: z.string().trim().nullish(),
	state: z.string().trim().nullish(),
	provincia: z.string().trim().nullish(),

	// Classification & Decision Maker
	categoryName: z.string().trim().nullish(),
	category: z.string().trim().nullish(),
	categoria: z.string().trim().nullish(),
	sector: z.string().trim().nullish(),
	decisionMaker: z.string().trim().nullish(),
	contacto: z.string().trim().nullish(),
	responsavel: z.string().trim().nullish(),
	gestor: z.string().trim().nullish(),
	decisionMakerRole: z.string().trim().nullish(),
	cargo: z.string().trim().nullish(),

	// Value
	estimatedValue: z.union([z.number(), z.string()]).nullish(),
	valorEstimado: z.union([z.number(), z.string()]).nullish(),
	valor: z.union([z.number(), z.string()]).nullish()
}).refine(
	(data) => {
		const rawTitle = data.title || data.nome || data.name || data.empresa || data.company_name;
		return typeof rawTitle === 'string' && rawTitle.trim().length > 0;
	},
	{
		message: 'O campo "title" ou "nome" da empresa é obrigatório.',
		path: ['title']
	}
);

export type ExternalLeadInput = z.infer<typeof ExternalLeadInputSchema>;
