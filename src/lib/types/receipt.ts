export interface ReceiptData {
	tipo: string;
	titulo: string;
	nome: string;
	dataNascimento: string;
	tipoDoc: string;
	numeroDoc: string;
	provincia: string;
	municipio: string;
	morada: string;
	areaResidencia: string;
	pontoReferencia: string;
	dataEmissao: string;
	buap: string;
	operador: string;
	terminal: string;
	transaccao: string;
	qrPayload: string;
}

export interface RupeReceiptData {
	banco: string; // 'BAI'
	sloganBanco: string; // 'Confiança no Futuro'
	entidadeLinha1: string; // 'MINISTÉRIO DAS'
	entidadeLinha2: string; // 'FINANÇAS'
	centralPagamento1: string; // 'CENTRAL D PAG ESTADO'
	centralPagamento2: string; // 'CENTRAL D PAG ESTADO'
	nif: string; // '000005000393533'
	identTpa: string; // '00313911'
	dataHora: string; // '2026-02-09 13:48:21'
	periodoTransacao: string; // 'Per: 574 Tr: 076 Mg076'
	tc: string; // '30462475C6FE7C64'
	aid: string; // 'A0000006900200'
	tipoCartao: string; // 'MCX DEBIT'
	idEstabelecimento: string; // '0000178890'
	tipoOperacao: string; // 'PAGAMENTO AO ESTADO'
	rupe: string; // '60201260200438206869'
	valor: string; // '44086,00'
	moeda: string; // 'Kz'
	tipoCopia: string; // 'CÓPIA COMERCIANTE'
	rodape: string; // 'PAGUE COM CÓDIGO QR'
}

export type PaperWidth = 58 | 80;

export interface ThermalReceiptOptions {
	paperWidth?: PaperWidth;
	dynamicHeight?: boolean;
	minHeight?: number;
}
