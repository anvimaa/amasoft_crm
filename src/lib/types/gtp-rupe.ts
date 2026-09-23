export interface GtpRupeData {
	// Cabeçalho & Referência
	rupe: string; // 20 dígitos (ex: 60201260203073134198)
	dataHoraEmissao: string; // ex: 23/09/2026 14:10:12
	portalOrigem: string; // ex: Portal da Administração Municipal
	portalRodape: string; // ex: Portal do Contribuinte

	// 1 - DADOS DO DOCUMENTO
	numeroLiquidacao: string; // 11 dígitos (mesmo que GPT, ex: 37362232233)
	dataEmissao: string; // ex: 23/09/2026
	mesAnoReferencia: string; // ex: 9/2026
	dataVencimento: string; // ex: 22/10/2026
	referenciaExterna: string; // opcional
	formaLiquidacao: string; // ex: Auto Liquidação
	tipoLiquidacao: string; // ex: Definitiva

	// 2 - DADOS DO CONTRIBUINTE
	nif: string; // ex: 021287366UE050
	nomeContribuinte: string; // ex: Nsimba Pedro
	reparticaoFiscal: string; // ex: 301 - Rf Uíge

	// 3 - DETALHE DA RECEITA
	codigoReceita: string; // ex: 04S
	nomeReceita: string; // ex: Receitas De Serviços Diversos
	valorReceita: string; // ex: 7.398,00
	valorTotal: string; // ex: 7.398,00
	moeda: string; // ex: AKZ
	valorExtenso: string; // ex: Sete Mil, Trezentos e Noventa e Oito Kwanzas

	// 4 - OUTRAS INFORMAÇÕES
	protocolo: string; // 11 dígitos gerados aleatoriamente (ex: 53623232122)
	documentoDescricao: string; // ex: Comparticipação Do Serviço De Energia.
}
