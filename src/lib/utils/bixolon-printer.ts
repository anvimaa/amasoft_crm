import type { ReceiptData } from '../types/receipt';

// UUIDs for BIXOLON SPP-R200III and generic ESC/POS Bluetooth printers
export const BIXOLON_BLE_SERVICES = [
	'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // BIXOLON Primary Custom Service
	'000018f0-0000-1000-8000-00805f9b34fb', // Standard BLE Printer Service
	'49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent Serial
	'0000ff00-0000-1000-8000-00805f9b34fb', // Generic SPP over BLE
	'0000ae00-0000-1000-8000-00805f9b34fb'  // Alternative BLE Serial
];

/**
 * Builds the binary ESC/POS payload optimized for BIXOLON SPP-R200III / Quatenus 58mm.
 */
/**
 * Strips accented characters and non-ASCII glyphs to prevent ESC/POS corruption on thermal printers.
 */
function cleanAscii(str: string): string {
	return (str || '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^\x00-\x7F]/g, '');
}

/**
 * Builds the binary ESC/POS payload optimized for BIXOLON SPP-R200III / Quatenus 58mm.
 */
export function buildBixolonEscPosPayload(data: ReceiptData): Uint8Array {
	const enc = new TextEncoder();
	const bytes: number[] = [];

	const addBytes = (arr: number[]) => {
		for (const b of arr) bytes.push(b);
	};

	const addText = (str: string) => {
		// Clean text for receipt (replaces accented characters to prevent corruption)
		const clean = cleanAscii(str);
		const encoded = enc.encode(clean);
		for (const b of encoded) bytes.push(b);
	};

	// 1. Initialize Printer (ESC @)
	addBytes([0x1b, 0x40]);

	// 2. Select Character Code Table (Standard ASCII / CP437)
	addBytes([0x1b, 0x74, 0x00]);

	// Line spacing standard (1/6 inch = ~4.23mm)
	addBytes([0x1b, 0x32]);

	// --- 3. HEADER (Centralizado, Negrito, Sublinhado) ---
	addBytes([0x1b, 0x61, 0x01]); // Centralizar
	addBytes([0x1b, 0x45, 0x01]); // Negrito ON
	addBytes([0x1b, 0x2d, 0x02]); // Sublinhado duplo (2-dot)

	if (data.tipo) {
		addText(`${data.tipo}\n`);
	}
	if (data.titulo) {
		addText(`${data.titulo}\n`);
	}

	addBytes([0x1b, 0x2d, 0x00]); // Sublinhado OFF
	addBytes([0x1b, 0x45, 0x00]); // Negrito OFF

	// --- 4. REQUERENTE / TITULAR ---
	addBytes([0x1b, 0x61, 0x00]); // Alinhar à Esquerda

	// Nome do Requerente
	addBytes([0x1b, 0x45, 0x01]); // Negrito ON
	addBytes([0x1b, 0x2d, 0x01]); // Sublinhado ON
	addText('Nome do Requerente:\n');
	addBytes([0x1b, 0x2d, 0x00]); // Sublinhado OFF
	addBytes([0x1b, 0x45, 0x00]); // Negrito OFF
	addText(`${data.nome || '-'}\n`);

	// Data de Nascimento
	addBytes([0x1b, 0x45, 0x01]);
	addBytes([0x1b, 0x2d, 0x01]);
	addText('Data de Nascimento:\n');
	addBytes([0x1b, 0x2d, 0x00]);
	addBytes([0x1b, 0x45, 0x00]);
	addText(`${data.dataNascimento || '-'}\n`);

	// Tipo de Doc. Utilizado
	addBytes([0x1b, 0x45, 0x01]);
	addBytes([0x1b, 0x2d, 0x01]);
	addText('Tipo de Doc. Utilizado:\n');
	addBytes([0x1b, 0x2d, 0x00]);
	addBytes([0x1b, 0x45, 0x00]);
	addText(`${data.tipoDoc || '-'}\n`);

	// Numero
	addBytes([0x1b, 0x45, 0x01]);
	addBytes([0x1b, 0x2d, 0x01]);
	addText('Numero:\n');
	addBytes([0x1b, 0x2d, 0x00]);
	addBytes([0x1b, 0x45, 0x00]);
	addText(`${data.numeroDoc || '-'}\n`);

	// --- 5. MORADA DE RESIDENTE ---
	addBytes([0x1b, 0x45, 0x01]);
	addBytes([0x1b, 0x2d, 0x01]);
	addText('Dados de Morada de Residente:\n');
	addBytes([0x1b, 0x2d, 0x00]);
	addBytes([0x1b, 0x45, 0x00]);

	addText(`Provincia: ${data.provincia || '-'}\n`);
	addText(`Municipio: ${data.municipio || '-'}\n`);
	addText(`Morada: ${data.morada || '-'}\n`);
	addText(`Area de Residencia: ${data.areaResidencia || '-'}\n`);

	addBytes([0x1b, 0x45, 0x01]);
	addBytes([0x1b, 0x2d, 0x01]);
	addText('Ponto de Referencia:\n');
	addBytes([0x1b, 0x2d, 0x00]);
	addBytes([0x1b, 0x45, 0x00]);
	addText(`${data.pontoReferencia || '-'}\n`);

	// --- 6. METADADOS DO SISTEMA ---
	addText(`DATA: ${data.dataEmissao || '-'}\n`);
	addText(`BUAP: ${data.buap || '-'}\n`);
	addText(`OPERADOR: ${data.operador || '-'}\n`);
	addText(`TERMINAL: ${data.terminal || '-'}\n`);
	addText(`TRANSACCAO: ${data.transaccao || '-'}\n`);

	// --- 7. INSTRUÇÕES DO QR CODE ---
	addBytes([0x1b, 0x61, 0x01]); // Centralizar
	addText('Utilize o telemovel para ler\n');
	addText('o codigo abaixo\n\n');

	// --- 8. QR CODE HARDWARE BIXOLON / ESC-POS ---
	const qrPayload = data.qrPayload || `${data.numeroDoc}|${data.transaccao}`;
	const payloadBytes = enc.encode(qrPayload);

	// 8.1 Modelo 2 do QR Code: [GS ( k 04 00 31 41 32 00]
	addBytes([0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]);

	// 8.2 Tamanho do Módulo (0x08 = 8 pontos por módulo => ~30-34mm de largura total)
	addBytes([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x08]);

	// 8.3 Nível de Recuperação de Erros (M = 49 / 0x31): [GS ( k 03 00 31 45 31]
	addBytes([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31]);

	// 8.4 Armazenar Dados no Buffer da Bixolon: [GS ( k pL pH 31 50 30 d1...dk]
	const pL = (payloadBytes.length + 3) % 256;
	const pH = Math.floor((payloadBytes.length + 3) / 256);
	addBytes([0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30]);
	for (const b of payloadBytes) {
		bytes.push(b);
	}

	// 8.5 Imprimir QR Code: [GS ( k 03 00 31 51 30]
	addBytes([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]);

	// --- 9. AVANÇO DE PAPEL E FINALIZAÇÃO ---
	addBytes([0x1b, 0x64, 0x04]); // Avança 4 linhas para corte manual / saída
	addBytes([0x1d, 0x56, 0x41, 0x10]); // Comando de corte parcial (se equipado)

	return new Uint8Array(bytes);
}

/**
 * Connects and prints directly via Web Bluetooth (BLE) to Quatenus / BIXOLON SPP-R200III.
 */
export async function printViaBluetooth(data: ReceiptData): Promise<{ success: boolean; message: string }> {
	const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
	if (!nav || !nav.bluetooth) {
		return {
			success: false,
			message: 'A Web Bluetooth API não é suportada neste navegador. Use Google Chrome ou Microsoft Edge no telemóvel ou PC.'
		};
	}

	try {
		// Request Device with friendly filters for Bixolon & Quatenus
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

		// Find a write characteristic
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
				message: 'Porta de comunicação da BIXOLON não encontrada. Verifique se o BLE está ativo.'
			};
		}

		const payload = buildBixolonEscPosPayload(data);

		// Send in chunks of 100 bytes to prevent BLE buffer overflow
		const CHUNK_SIZE = 100;
		for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
			const chunk = payload.slice(i, i + CHUNK_SIZE);
			if (targetCharacteristic.properties.writeWithoutResponse) {
				await targetCharacteristic.writeValueWithoutResponse(chunk);
			} else {
				await targetCharacteristic.writeValue(chunk);
			}
			// Small delay for printer buffer
			await new Promise((resolve) => setTimeout(resolve, 30));
		}

		// Disconnect gracefully after print
		setTimeout(() => {
			device.gatt?.disconnect();
		}, 1000);

		return {
			success: true,
			message: `Talão impresso com sucesso no terminal ${device.name || 'Quatenus / BIXOLON'}!`
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
 * Connects and prints via Web Serial API (Bluetooth COM port / USB Serial on PC).
 */
export async function printViaSerial(
	data: ReceiptData,
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
		const payload = buildBixolonEscPosPayload(data);

		await writer.write(payload);
		writer.releaseLock();
		await port.close();

		return {
			success: true,
			message: 'Talão impresso com sucesso via Porta Serial/Bluetooth COM!'
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
