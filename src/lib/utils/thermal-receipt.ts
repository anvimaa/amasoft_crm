import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import type { ReceiptData, ThermalReceiptOptions } from '../types/receipt';

export const SAMPLE_RECEIPT_DATA: ReceiptData = {
	tipo: 'A2',
	titulo: 'PROVA DE VIDA',
	nome: 'Ana Vieira Raimundo',
	dataNascimento: '18/10/1999',
	tipoDoc: 'Bilhete de Identidade',
	numeroDoc: '009851194UE045',
	provincia: 'Uige',
	municipio: 'Uige',
	morada: 'Bairro Popular Rua C',
	areaResidencia: 'N3C-2TUV-S',
	pontoReferencia: 'P1: Escola 11 de Novembro',
	dataEmissao: '16/09/26 10:45:32',
	buap: 'Administracao Municipal do Uige',
	operador: 'Dombexe Antonio Malung 0',
	terminal: '81ade2',
	transaccao: '165',
	qrPayload: '009851194UE045|165|PROVA_DE_VIDA'
};

export const COMMERCIAL_RECEIPT_DATA: ReceiptData = {
	tipo: 'FATURA RECIBO',
	titulo: 'COMPROVATIVO DE PAGAMENTO',
	nome: 'Kero Hipermercados SA',
	dataNascimento: 'NIF: 5418290318',
	tipoDoc: 'Ref. Proposta',
	numeroDoc: 'PROP-2026-0042',
	provincia: 'Luanda',
	municipio: 'Talatona',
	morada: 'Avenida Pedro de Castro Van-Dunem Loy',
	areaResidencia: 'Complexo Comercial Kero',
	pontoReferencia: 'Junto ao Belas Shopping',
	dataEmissao: '22/09/26 14:30:15',
	buap: 'Amasoft Technologies Lda',
	operador: 'Antonio Silva (Comercial)',
	terminal: 'POS-KZ-01',
	transaccao: 'TX-984210',
	qrPayload: '5418290318|PROP-2026-0042|TX-984210|KERO_AMASOFT'
};

/**
 * Calculates the exact height needed for the thermal receipt content.
 */
function calculateReceiptHeight(
	data: ReceiptData,
	pageWidth: number,
	margin: number,
	qrSize: number
): number {
	// Simulated jsPDF to split text
	const tempDoc = new jsPDF({ unit: 'mm' });
	tempDoc.setFont('courier', 'normal');
	const contentWidth = pageWidth - margin * 2;
	const lineHeight = 3.8;

	let estimatedY = 8;

	const countLines = (text: string, fontSize = 8.5) => {
		tempDoc.setFontSize(fontSize);
		const lines: string[] = tempDoc.splitTextToSize(text || ' ', contentWidth);
		return lines.length * lineHeight;
	};

	// Header
	estimatedY += countLines(data.tipo, 9.5);
	estimatedY += countLines(data.titulo, 9.5);
	estimatedY += 2;

	// Personal Data
	estimatedY += countLines('Nome do Requerente:');
	estimatedY += countLines(data.nome);
	estimatedY += countLines('Data de Nascimento:');
	estimatedY += countLines(data.dataNascimento);
	estimatedY += countLines('Tipo de Doc. Utilizado:');
	estimatedY += countLines(data.tipoDoc);
	estimatedY += countLines('Numero:');
	estimatedY += countLines(data.numeroDoc);

	// Address Block
	estimatedY += countLines('Dados de Morada de Residente:');
	estimatedY += countLines(`Provincia: ${data.provincia}`);
	estimatedY += countLines(`Municipio: ${data.municipio}`);
	estimatedY += countLines(`Morada: ${data.morada}`);
	estimatedY += countLines(`Area de Residencia: ${data.areaResidencia}`);
	estimatedY += countLines('Ponto de Referencia:');
	estimatedY += countLines(data.pontoReferencia);

	// System Data
	estimatedY += 1;
	estimatedY += countLines(`DATA: ${data.dataEmissao}`);
	estimatedY += countLines(`BUAP: ${data.buap}`);
	estimatedY += countLines(`OPERADOR: ${data.operador}`);
	estimatedY += countLines(`TERMINAL: ${data.terminal}`);
	estimatedY += countLines(`TRANSACCAO: ${data.transaccao}`);

	// Footer Instructions & QR
	estimatedY += 2;
	estimatedY += countLines('Utilize o telemovel para ler');
	estimatedY += countLines('o codigo abaixo');
	estimatedY += 1;
	estimatedY += qrSize;
	estimatedY += 6; // Bottom padding

	return Math.max(estimatedY, 60);
}

/**
 * Generates a thermal receipt PDF using jsPDF and QRCode.
 * Default standard: 58mm width with dynamic height calculation.
 */
export async function gerarTalaoTermico(
	data: ReceiptData,
	options: ThermalReceiptOptions = {}
): Promise<jsPDF> {
	const pageWidth = options.paperWidth || 58;
	const margin = 4;
	const contentWidth = pageWidth - margin * 2;
	const centerX = pageWidth / 2;
	const qrSize = pageWidth === 80 ? 44 : 34;

	const dynamicHeight = options.dynamicHeight ?? true;
	const pageHeight = dynamicHeight
		? calculateReceiptHeight(data, pageWidth, margin, qrSize)
		: options.minHeight || 210;

	const doc = new jsPDF({
		orientation: 'portrait',
		unit: 'mm',
		format: [pageWidth, pageHeight]
	});

	let y = 8;
	const lineHeight = 3.8;

	const printText = (
		text: string,
		align: 'left' | 'center' = 'left',
		underline = false,
		fontSize = 8.5,
		isBold = false
	) => {
		doc.setFont('courier', isBold ? 'bold' : 'normal');
		doc.setFontSize(fontSize);
		const lines: string[] = doc.splitTextToSize(text || '', contentWidth);

		lines.forEach((line) => {
			const x = align === 'center' ? centerX : margin;
			doc.text(line, x, y, { align });

			if (underline && line.trim().length > 0) {
				const textWidth = doc.getTextWidth(line);
				const startX = align === 'center' ? centerX - textWidth / 2 : margin;
				doc.setLineWidth(0.2);
				doc.line(startX, y + 0.4, startX + textWidth, y + 0.4);
			}
			y += lineHeight;
		});
	};

	const printSection = (label: string, value: string) => {
		printText(label, 'left', true, 8.5, true);
		printText(value || '-', 'left', false, 8.5, false);
	};

	// 1. Header (Títulos em Negrito)
	printText(data.tipo, 'center', true, 9.5, true);
	printText(data.titulo, 'center', true, 9.5, true);
	y += 2;

	// 2. Personal Info (Rótulos em negrito, valores normais)
	printSection('Nome do Requerente:', data.nome);
	printSection('Data de Nascimento:', data.dataNascimento);
	printSection('Tipo de Doc. Utilizado:', data.tipoDoc);
	printSection('Numero:', data.numeroDoc);

	// 3. Address Info
	printText('Dados de Morada de Residente:', 'left', true, 8.5, true);
	printText(`Provincia: ${data.provincia || '-'}`, 'left', false, 8.5, false);
	printText(`Municipio: ${data.municipio || '-'}`, 'left', false, 8.5, false);
	printText(`Morada: ${data.morada || '-'}`, 'left', false, 8.5, false);
	printText(`Area de Residencia: ${data.areaResidencia || '-'}`, 'left', false, 8.5, false);
	printSection('Ponto de Referencia:', data.pontoReferencia);

	// 4. Emission / System Info (Valores normais)
	y += 1;
	printText(`DATA: ${data.dataEmissao || '-'}`, 'left', false, 8.5, false);
	printText(`BUAP: ${data.buap || '-'}`, 'left', false, 8.5, false);
	printText(`OPERADOR: ${data.operador || '-'}`, 'left', false, 8.5, false);
	printText(`TERMINAL: ${data.terminal || '-'}`, 'left', false, 8.5, false);
	printText(`TRANSACCAO: ${data.transaccao || '-'}`, 'left', false, 8.5, false);

	// 5. QR Code Instruction (Texto normal)
	y += 2;
	printText('Utilize o telemovel para ler', 'center', false, 8.5, false);
	printText('o codigo abaixo', 'center', false, 8.5, false);

	// 6. QR Code Generation & Embedding
	y += 1;
	const qrX = (pageWidth - qrSize) / 2;
	const qrDataUrl = await QRCode.toDataURL(data.qrPayload || `${data.numeroDoc}|${data.transaccao}`, {
		margin: 0,
		errorCorrectionLevel: 'M'
	});

	doc.addImage(qrDataUrl, 'PNG', qrX, y, qrSize, qrSize);

	return doc;
}

/**
 * Triggers browser download of the thermal receipt.
 */
export async function downloadThermalReceiptPDF(
	data: ReceiptData,
	filename = 'talao_termico.pdf',
	options: ThermalReceiptOptions = {}
): Promise<void> {
	const doc = await gerarTalaoTermico(data, options);
	doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

/**
 * Opens print dialogue directly in an invisible iframe for direct thermal printing.
 */
export async function printThermalReceiptPDF(
	data: ReceiptData,
	options: ThermalReceiptOptions = {}
): Promise<void> {
	const doc = await gerarTalaoTermico(data, options);
	const blob = doc.output('blob');
	const blobUrl = URL.createObjectURL(blob);

	const iframe = document.createElement('iframe');
	iframe.style.position = 'fixed';
	iframe.style.right = '0';
	iframe.style.bottom = '0';
	iframe.style.width = '0';
	iframe.style.height = '0';
	iframe.style.border = '0';
	iframe.src = blobUrl;

	document.body.appendChild(iframe);

	iframe.onload = () => {
		setTimeout(() => {
			iframe.contentWindow?.focus();
			iframe.contentWindow?.print();
			setTimeout(() => {
				document.body.removeChild(iframe);
				URL.revokeObjectURL(blobUrl);
			}, 2000);
		}, 300);
	};
}

/**
 * Returns a Data URL for previewing in an <iframe> or <img> element.
 */
export async function getThermalReceiptDataUrl(
	data: ReceiptData,
	options: ThermalReceiptOptions = {}
): Promise<string> {
	const doc = await gerarTalaoTermico(data, options);
	return doc.output('datauristring');
}
