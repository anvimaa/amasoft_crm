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

export type PaperWidth = 58 | 80;

export interface ThermalReceiptOptions {
	paperWidth?: PaperWidth;
	dynamicHeight?: boolean;
	minHeight?: number;
}
