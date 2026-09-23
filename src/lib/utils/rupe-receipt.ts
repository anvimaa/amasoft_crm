import { jsPDF } from 'jspdf';
import type { RupeReceiptData, ThermalReceiptOptions } from '../types/receipt';
import { BIXOLON_BLE_SERVICES } from './bixolon-printer';

export function getRupeCurrentDateTime(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	const hours = String(now.getHours()).padStart(2, '0');
	const minutes = String(now.getMinutes()).padStart(2, '0');
	const seconds = String(now.getSeconds()).padStart(2, '0');
	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function createDefaultRupeData(): RupeReceiptData {
	return {
		banco: 'BAI',
		sloganBanco: 'Confiança no Futuro',
		entidadeLinha1: 'MINISTÉRIO DAS',
		entidadeLinha2: 'FINANÇAS',
		centralPagamento1: 'CENTRAL D PAG ESTADO',
		centralPagamento2: 'CENTRAL D PAG ESTADO',
		nif: '5000393533',
		identTpa: '00313911',
		dataHora: getRupeCurrentDateTime(),
		periodoTransacao: 'Per: 274 Tr: 076 Mg076',
		tc: '30462475C6FE7C64',
		aid: 'A0000006900200',
		tipoCartao: 'MCX DEBIT',
		idEstabelecimento: '0000178890',
		tipoOperacao: 'PAGAMENTO AO ESTADO',
		rupe: '60201260200438206869',
		valor: '7398,00',
		moeda: 'Kz',
		tipoCopia: 'CÓPIA COMERCIANTE',
		rodape: 'PAGUE COM CÓDIGO QR'
	};
}

export const DEFAULT_RUPE_DATA: RupeReceiptData = createDefaultRupeData();

/**
 * Strips accented characters for safe ESC/POS thermal printing.
 */
function cleanAscii(str: string): string {
	return (str || '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^\x00-\x7F]/g, '');
}

/**
 * Calculates height needed for the RUPE receipt PDF.
 */
function calculateRupeHeight(
	data: RupeReceiptData,
	pageWidth: number,
	margin: number
): number {
	const tempDoc = new jsPDF({ unit: 'mm' });
	tempDoc.setFont('helvetica', 'normal');
	const contentWidth = pageWidth - margin * 2;
	const lineHeight = 4.6;

	let estimatedY = 8;

	const countLines = (text: string, fontSize = 10.5) => {
		tempDoc.setFontSize(fontSize);
		const lines: string[] = tempDoc.splitTextToSize(text || ' ', contentWidth);
		return lines.length * lineHeight;
	};

	// Logo + space
	estimatedY += 18;

	// Entidade (Ministério das Finanças)
	estimatedY += countLines(data.entidadeLinha1, 10.5);
	estimatedY += countLines(data.entidadeLinha2, 10.5);
	estimatedY += 3;

	// System & TPA Info
	estimatedY += countLines(data.centralPagamento1, 10);
	estimatedY += countLines(data.centralPagamento2, 10);
	estimatedY += countLines(`NIF: ${data.nif}`, 10);
	estimatedY += countLines(`Ident. TPA: ${data.identTpa}`, 10);
	estimatedY += countLines(data.dataHora, 10);
	estimatedY += countLines(data.periodoTransacao, 10);
	estimatedY += countLines(`TC: ${data.tc}`, 10);
	estimatedY += countLines(data.aid, 10);
	estimatedY += countLines(data.tipoCartao, 10);
	estimatedY += countLines(`Id.Estab.:${data.idEstabelecimento}`, 10);
	estimatedY += 3;
	estimatedY += countLines(data.tipoOperacao, 10.5);

	// RUPE block
	estimatedY += 6;
	estimatedY += countLines('RUPE', 11);
	estimatedY += 2;
	estimatedY += countLines(data.rupe, 10.5);

	// Montante block
	estimatedY += 5;
	estimatedY += countLines('Montante:', 10.5);
	estimatedY += 2;
	estimatedY += countLines(` ${data.valor}  ${data.moeda}`, 11);

	// Footer
	estimatedY += 7;
	estimatedY += countLines(data.tipoCopia, 10.5);
	estimatedY += 2;
	estimatedY += countLines(data.rodape, 10.5);
	estimatedY += 10;

	return Math.max(estimatedY, 145);
}

export { BAI_LOGO_BASE64 } from './bai-logo-base64';
import { BAI_LOGO_BASE64 } from './bai-logo-base64';

export const BAI_LOGO_URL = BAI_LOGO_BASE64;

let cachedLogoBase64: string | null = null;
let cachedEscPosRaster: number[] | null = null;

/**
 * Converts any image source to crisp pure black and white (monochrome) for thermal printers.
 */
export function convertImageToMonochrome(imgSrc: string = BAI_LOGO_BASE64): Promise<string> {
	if (cachedLogoBase64) return Promise.resolve(cachedLogoBase64);
	if (typeof document === 'undefined') return Promise.resolve(imgSrc);

	return new Promise((resolve) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';

		const processImage = () => {
			try {
				if (!img.naturalWidth || !img.naturalHeight) {
					resolve(imgSrc);
					return;
				}
				const canvas = document.createElement('canvas');
				canvas.width = img.naturalWidth;
				canvas.height = img.naturalHeight;
				const ctx = canvas.getContext('2d');
				if (!ctx) {
					resolve(imgSrc);
					return;
				}
				ctx.fillStyle = '#FFFFFF';
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(img, 0, 0);

				const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
				const d = imgData.data;
				for (let i = 0; i < d.length; i += 4) {
					const r = d[i];
					const g = d[i + 1];
					const b = d[i + 2];
					// Luminance formula
					const gray = 0.299 * r + 0.587 * g + 0.114 * b;
					// Contrast threshold: white background (255) vs black ink (0)
					const bw = gray > 165 ? 255 : 0;
					d[i] = bw;
					d[i + 1] = bw;
					d[i + 2] = bw;
				}
				ctx.putImageData(imgData, 0, 0);
				const result = canvas.toDataURL('image/png');
				cachedLogoBase64 = result;
				resolve(result);
			} catch (e) {
				console.error('Error in convertImageToMonochrome:', e);
				resolve(imgSrc);
			}
		};

		img.onload = processImage;
		img.onerror = () => resolve(imgSrc);
		img.src = imgSrc;

		if (img.complete && img.naturalWidth > 0) {
			processImage();
		}
	});
}

export async function getBaiLogoDataUrl(): Promise<string | null> {
	if (cachedLogoBase64) return cachedLogoBase64;
	try {
		const monoDataUrl = await convertImageToMonochrome(BAI_LOGO_BASE64);
		cachedLogoBase64 = monoDataUrl;
		return monoDataUrl;
	} catch {
		return BAI_LOGO_BASE64;
	}
}

/**
 * Generates the RUPE thermal receipt PDF faithful to the physical voucher.
 */
export async function gerarRupeTalaoTermico(
	data: RupeReceiptData,
	options: ThermalReceiptOptions = {}
): Promise<jsPDF> {
	const pageWidth = options.paperWidth || 58;
	const margin = 3.5;
	const contentWidth = pageWidth - margin * 2;
	const centerX = pageWidth / 2;

	const dynamicHeight = options.dynamicHeight ?? true;
	const pageHeight = dynamicHeight
		? calculateRupeHeight(data, pageWidth, margin)
		: options.minHeight || 210;

	const doc = new jsPDF({
		orientation: 'portrait',
		unit: 'mm',
		format: [pageWidth, pageHeight]
	});

	let y = 7;
	const lineHeight = 4.4;

	const printText = (
		text: string,
		align: 'left' | 'center' = 'left',
		fontSize = 10,
		isBold = false
	) => {
		doc.setFont('helvetica', isBold ? 'bold' : 'normal');
		doc.setFontSize(fontSize);
		const lines: string[] = doc.splitTextToSize(text || '', contentWidth);

		lines.forEach((line) => {
			const x = align === 'center' ? centerX : margin;
			doc.text(line, x, y, { align });
			y += lineHeight;
		});
	};

	// 1. BAI Official Logo from Image URL
	const logoDataUrl = await getBaiLogoDataUrl();
	if (logoDataUrl) {
		const logoWidth = 34;
		const logoHeight = 12;
		doc.addImage(logoDataUrl, 'JPEG', (pageWidth - logoWidth) / 2, y, logoWidth, logoHeight);
		y += logoHeight + 4;
	} else {
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(12);
		doc.text('BAI', centerX, y + 5, { align: 'center' });
		y += 10;
	}

	// 2. Ministério das Finanças Header (Alinhado à Esquerda conforme o talão real)
	printText(data.entidadeLinha1, 'left', 10.5, false);
	printText(data.entidadeLinha2, 'left', 10.5, false);
	y += 0.5;

	// 3. TPA Transaction & Central de Pagamento details (Alinhado à Esquerda)
	printText(data.centralPagamento1, 'left', 10, false);
	printText(data.centralPagamento2, 'left', 10, false);
	printText(`NIF: ${data.nif}`, 'left', 10, false);
	printText(`Ident. TPA: ${data.identTpa}`, 'left', 10, false);
	printText(data.dataHora, 'left', 10, false);
	printText(data.periodoTransacao, 'left', 10, false);
	printText(`TC: ${data.tc}`, 'left', 10, false);
	printText(data.aid, 'left', 10, false);
	printText(data.tipoCartao, 'left', 10, false);
	printText(`Id.Estab.:${data.idEstabelecimento}`, 'left', 10, false);
	
	// Tipo Operação
	y += 1.5;
	printText(data.tipoOperacao, 'left', 10.5, false);

	// 4. RUPE Block (Centralizado conforme talão real)
	y += 3;
	printText('RUPE', 'center', 11, false);
	y += 1;
	printText(data.rupe, 'center', 10.5, false);

	// 5. Montante Block
	y += 3;
	printText('Montante:', 'left', 10.5, false);
	y += 1;
	printText(` ${data.valor}  ${data.moeda}`, 'left', 11, false);

	// 6. Footer Copia & Codigo QR (Centralizado)
	y += 4.5;
	printText(data.tipoCopia, 'center', 10.5, false);
	y += 1;
	printText(data.rodape, 'center', 10.5, false);

	return doc;
}

/**
 * Downloads the RUPE thermal receipt PDF.
 */
export async function downloadRupeThermalPDF(
	data: RupeReceiptData,
	filename = 'talao_rupe.pdf',
	options: ThermalReceiptOptions = {}
): Promise<void> {
	const doc = await gerarRupeTalaoTermico(data, options);
	doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

/**
 * Direct print dialog for RUPE receipt via invisible iframe.
 */
export async function printRupeThermalPDF(
	data: RupeReceiptData,
	options: ThermalReceiptOptions = {}
): Promise<void> {
	const doc = await gerarRupeTalaoTermico(data, options);
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
 * Converts the BAI logo image into an ESC/POS raster bit-image command (GS v 0) for thermal printing.
 * Padded to 384 dots (48 bytes per line) to be perfectly centered on 58mm thermal printers.
 */
export async function convertImageToEscPosRaster(
	imgSrc: string = BAI_LOGO_BASE64,
	targetWidth = 280,
	fullPaperDots = 384
): Promise<number[]> {
	if (cachedEscPosRaster && cachedEscPosRaster.length > 0) {
		return cachedEscPosRaster;
	}
	if (typeof document === 'undefined') return [];

	return new Promise((resolve) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';

		const processImage = () => {
			try {
				if (!img.naturalWidth || !img.naturalHeight) {
					resolve([]);
					return;
				}

				// Calculate dimensions
				const logoDots = Math.floor(targetWidth / 8) * 8; // e.g. 280
				const logoBytesPerLine = logoDots / 8; // 35 bytes
				const aspectRatio = img.naturalHeight / img.naturalWidth;
				const height = Math.round(logoDots * aspectRatio);

				const canvas = document.createElement('canvas');
				canvas.width = logoDots;
				canvas.height = height;
				const ctx = canvas.getContext('2d');
				if (!ctx) {
					resolve([]);
					return;
				}

				// Draw pure white background then image
				ctx.fillStyle = '#FFFFFF';
				ctx.fillRect(0, 0, logoDots, height);
				ctx.drawImage(img, 0, 0, logoDots, height);

				const imgData = ctx.getImageData(0, 0, logoDots, height);
				const data = imgData.data;

				// Calculate centering padding for 384-dot (48-byte) line width on 58mm paper
				const totalBytesPerLine = Math.floor(fullPaperDots / 8); // 48 bytes
				const leftPaddingBytes = Math.max(0, Math.floor((totalBytesPerLine - logoBytesPerLine) / 2));
				const rightPaddingBytes = Math.max(0, totalBytesPerLine - logoBytesPerLine - leftPaddingBytes);

				const xL = totalBytesPerLine % 256;
				const xH = Math.floor(totalBytesPerLine / 256);
				const yL = height % 256;
				const yH = Math.floor(height / 256);

				// GS v 0 0 xL xH yL yH (Standard ESC/POS Raster Bit Image)
				const rasterCmd: number[] = [0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH];

				for (let y = 0; y < height; y++) {
					// 1. Left white space padding
					for (let p = 0; p < leftPaddingBytes; p++) {
						rasterCmd.push(0x00);
					}

					// 2. Logo bit pixels
					for (let x = 0; x < logoDots; x += 8) {
						let byte = 0;
						for (let b = 0; b < 8; b++) {
							const pxIndex = (y * logoDots + (x + b)) * 4;
							const r = data[pxIndex];
							const g = data[pxIndex + 1];
							const bVal = data[pxIndex + 2];
							const luminance = 0.299 * r + 0.587 * g + 0.114 * bVal;
							if (luminance < 165) {
								byte |= 1 << (7 - b); // 1 = black ink dot
							}
						}
						rasterCmd.push(byte);
					}

					// 3. Right white space padding
					for (let p = 0; p < rightPaddingBytes; p++) {
						rasterCmd.push(0x00);
					}
				}

				cachedEscPosRaster = rasterCmd;
				resolve(rasterCmd);
			} catch (e) {
				console.error('Error generating raster logo:', e);
				resolve([]);
			}
		};

		img.onload = processImage;
		img.onerror = () => resolve([]);
		img.src = imgSrc;

		if (img.complete && img.naturalWidth > 0) {
			processImage();
		}
	});
}

/**
 * Builds binary ESC/POS payload for RUPE receipt on Quatenus / BIXOLON SPP-R200III.
 */
export function buildRupeBixolonEscPosPayload(
	data: RupeReceiptData,
	rasterLogoBytes?: number[]
): Uint8Array {
	const enc = new TextEncoder();
	const bytes: number[] = [];

	const addBytes = (arr: number[]) => {
		for (const b of arr) bytes.push(b);
	};

	const addText = (str: string) => {
		const clean = cleanAscii(str);
		const encoded = enc.encode(clean);
		for (const b of encoded) bytes.push(b);
	};

	// 1. Initialize Printer (ESC @)
	addBytes([0x1b, 0x40]);

	// 2. Select Character Code Table (Standard ASCII / CP437)
	addBytes([0x1b, 0x74, 0x00]);

	// Standard line spacing
	addBytes([0x1b, 0x32]);

	// --- 1. BAI HEADER (Logo Gráfico Real) ---
	addBytes([0x1b, 0x61, 0x01]); // Centralizar

	const logoToUse = (rasterLogoBytes && rasterLogoBytes.length > 0)
		? rasterLogoBytes
		: (cachedEscPosRaster && cachedEscPosRaster.length > 0 ? cachedEscPosRaster : null);

	if (logoToUse && logoToUse.length > 0) {
		addBytes(logoToUse);
		addBytes([0x1b, 0x64, 0x01]); // 1 linha de avanço após a logo
	} else {
		// Fallback sem placeholders artificiais
		addBytes([0x1b, 0x64, 0x01]);
	}

	// --- 2. MINISTERIO DAS FINANCAS (Alinhado à Esquerda) ---
	addBytes([0x1b, 0x61, 0x00]); // Alinhar à Esquerda
	addText(`${data.entidadeLinha1}\n`);
	addText(`${data.entidadeLinha2}\n`);

	// --- 3. METADADOS DO TPA / PAGAMENTO (Alinhado à Esquerda) ---
	addText(`${data.centralPagamento1}\n`);
	addText(`${data.centralPagamento2}\n`);
	addText(`NIF: ${data.nif}\n`);
	addText(`Ident. TPA: ${data.identTpa}\n`);
	addText(`${data.dataHora}\n`);
	addText(`${data.periodoTransacao}\n`);
	addText(`TC: ${data.tc}\n`);
	addText(`${data.aid}\n`);
	addText(`${data.tipoCartao}\n`);
	addText(`Id.Estab.:${data.idEstabelecimento}\n\n`);
	addText(`${data.tipoOperacao}\n\n`);

	// --- 4. RUPE (Centralizado) ---
	addBytes([0x1b, 0x61, 0x01]); // Centralizar
	addText('RUPE\n\n');
	addText(`${data.rupe}\n\n`);

	// --- 5. MONTANTE (Alinhado à Esquerda) ---
	addBytes([0x1b, 0x61, 0x00]); // Alinhar à Esquerda
	addText('Montante:\n\n');
	addText(` ${data.valor}  ${data.moeda}\n\n\n`);

	// --- 6. FOOTER (Centralizado) ---
	addBytes([0x1b, 0x61, 0x01]); // Centralizar
	addText(`${data.tipoCopia}\n\n`);
	addText(`${data.rodape}\n`);

	// --- 7. AVANÇO DE PAPEL E CORTE ---
	addBytes([0x1b, 0x64, 0x04]); // Avança 4 linhas
	addBytes([0x1d, 0x56, 0x41, 0x10]); // Corte parcial

	return new Uint8Array(bytes);
}

/**
 * Direct print via Web Bluetooth (BLE) for RUPE on Quatenus / BIXOLON SPP-R200III.
 */
export async function printRupeViaBluetooth(data: RupeReceiptData): Promise<{ success: boolean; message: string }> {
	const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
	if (!nav || !nav.bluetooth) {
		return {
			success: false,
			message: 'A Web Bluetooth API não é suportada neste navegador. Use Google Chrome ou Microsoft Edge.'
		};
	}

	try {
		const device = await nav.bluetooth.requestDevice({
			filters: [
				{ namePrefix: 'SPP-R200' },
				{ namePrefix: 'BIXOLON' },
				{ namePrefix: 'QTN' },
				{ namePrefix: 'QUATENUS' },
				{ namePrefix: 'POS' }
			],
			optionalServices: BIXOLON_BLE_SERVICES
		});

		if (!device.gatt) {
			return { success: false, message: 'Dispositivo sem suporte a GATT Server.' };
		}

		const server = await device.gatt.connect();
		let targetCharacteristic: any = null;

		for (const serviceUuid of BIXOLON_BLE_SERVICES) {
			try {
				const service = await server.getPrimaryService(serviceUuid);
				const characteristics = await service.getCharacteristics();

				for (const char of characteristics) {
					if (char.properties.write || char.properties.writeWithoutResponse) {
						targetCharacteristic = char;
						break;
					}
				}
				if (targetCharacteristic) break;
			} catch {
				// Continue search
			}
		}

		if (!targetCharacteristic) {
			device.gatt.disconnect();
			return {
				success: false,
				message: 'Porta de comunicação da impressora não encontrada. Verifique se o BLE está ativo.'
			};
		}

		// Convert actual BAI logo to thermal raster bitmap
		const rasterLogo = await convertImageToEscPosRaster(BAI_LOGO_URL, 280);
		const payload = buildRupeBixolonEscPosPayload(data, rasterLogo);

		const CHUNK_SIZE = 100;
		for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
			const chunk = payload.slice(i, i + CHUNK_SIZE);
			if (targetCharacteristic.properties.writeWithoutResponse) {
				await targetCharacteristic.writeValueWithoutResponse(chunk);
			} else {
				await targetCharacteristic.writeValue(chunk);
			}
			await new Promise((resolve) => setTimeout(resolve, 30));
		}

		setTimeout(() => {
			device.gatt?.disconnect();
		}, 1000);

		return {
			success: true,
			message: `Talão RUPE impresso com sucesso no terminal ${device.name || 'Quatenus / BIXOLON'}!`
		};
	} catch (err: any) {
		if (err.name === 'NotFoundError') {
			return { success: false, message: 'Busca cancelada: Nenhuma impressora selecionada.' };
		}
		return {
			success: false,
			message: `Erro na comunicação Bluetooth: ${err.message || err}`
		};
	}
}

/**
 * Direct print via Web Serial API for RUPE on Quatenus / BIXOLON SPP-R200III.
 */
export async function printRupeViaSerial(
	data: RupeReceiptData,
	baudRate = 115200
): Promise<{ success: boolean; message: string }> {
	if (!('serial' in navigator)) {
		return {
			success: false,
			message: 'Web Serial API não suportada. Use Google Chrome ou Edge no Computador.'
		};
	}

	try {
		const port = await (navigator as any).serial.requestPort();
		await port.open({ baudRate });

		const writer = port.writable.getWriter();
		// Convert actual BAI logo to thermal raster bitmap
		const rasterLogo = await convertImageToEscPosRaster(BAI_LOGO_URL, 280);
		const payload = buildRupeBixolonEscPosPayload(data, rasterLogo);

		await writer.write(payload);
		writer.releaseLock();
		await port.close();

		return {
			success: true,
			message: 'Talão RUPE impresso com sucesso via Porta Serial / USB!'
		};
	} catch (err: any) {
		if (err.name === 'NotFoundError') {
			return { success: false, message: 'Seleção cancelada: Nenhuma porta COM escolhida.' };
		}
		return {
			success: false,
			message: `Erro na porta serial: ${err.message || err}`
		};
	}
}
