import type { GtpRupeData } from '../types/gtp-rupe';
import { valorPorExtensoKwanzas } from './numero-extenso';

export function generateRandom11Digits(): string {
	// Gera exatamente 11 dígitos numéricos
	const min = 10000000000;
	const max = 99999999999;
	return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

export const RUPE_FIXED_PREFIX = '6020126020';

export function generateRandomRupe(): string {
	// Formato padrão RUPE: 6020126020 (602 012 602 0) fixo + 10 dígitos aleatórios = 20 dígitos no total
	let result = RUPE_FIXED_PREFIX;
	for (let i = 0; i < 10; i++) {
		result += Math.floor(Math.random() * 10).toString();
	}
	return result;
}

export function formatRupe(rawRupe: string): string {
	const clean = (rawRupe || '').replace(/\D/g, '');
	if (clean.length === 0) return '';
	// Divide em blocos: 3 3 3 3 3 3 2 (total 20 dígitos)
	const parts = [
		clean.substring(0, 3),
		clean.substring(3, 6),
		clean.substring(6, 9),
		clean.substring(9, 12),
		clean.substring(12, 15),
		clean.substring(15, 18),
		clean.substring(18, 20)
	].filter(Boolean);
	return parts.join(' ');
}

export function formatAoaCurrency(val: number | string): string {
	if (typeof val === 'number') {
		return val.toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}
	const clean = val.replace(/\./g, '').replace(',', '.').trim();
	const num = parseFloat(clean);
	if (isNaN(num)) return '0,00';
	return num.toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function getTodayDateStr(): string {
	const now = new Date();
	const day = String(now.getDate()).padStart(2, '0');
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const year = now.getFullYear();
	return `${day}/${month}/${year}`;
}

export function getTodayDateTimeStr(): string {
	const now = new Date();
	const day = String(now.getDate()).padStart(2, '0');
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const year = now.getFullYear();
	const hours = String(now.getHours()).padStart(2, '0');
	const minutes = String(now.getMinutes()).padStart(2, '0');
	const seconds = String(now.getSeconds()).padStart(2, '0');
	return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

export function getMesAnoReferencia(): string {
	const now = new Date();
	return `${now.getMonth() + 1}/${now.getFullYear()}`;
}

export function getVencimentoDateStr(daysAhead: number = 30): string {
	const now = new Date();
	now.setDate(now.getDate() + daysAhead);
	const day = String(now.getDate()).padStart(2, '0');
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const year = now.getFullYear();
	return `${day}/${month}/${year}`;
}

export function createDefaultGtpRupeData(): GtpRupeData {
	const numLiquidacaoEGpt = generateRandom11Digits();
	const protocoloAuto = generateRandom11Digits();
	const dataEmissao = getTodayDateStr();
	const dataVencimento = getVencimentoDateStr(30);
	const valor = '7.398,00';

	return {
		rupe: '60201260203073134198',
		dataHoraEmissao: getTodayDateTimeStr(),
		portalOrigem: 'Portal da Administração Municipal',
		portalRodape: 'Portal do Contribuinte',

		numeroLiquidacao: numLiquidacaoEGpt, // 1.1 e GPT são o mesmo valor gerado de 11 dígitos
		dataEmissao,
		mesAnoReferencia: getMesAnoReferencia(),
		dataVencimento,
		referenciaExterna: '',
		formaLiquidacao: 'Auto Liquidação',
		tipoLiquidacao: 'Definitiva',

		nif: '021287366UE050',
		nomeContribuinte: 'Nsimba Pedro',
		reparticaoFiscal: '301 - Rf Uíge',

		codigoReceita: '04S',
		nomeReceita: 'Receitas De Serviços Diversos',
		valorReceita: valor,
		valorTotal: valor,
		moeda: 'AKZ',
		valorExtenso: valorPorExtensoKwanzas(valor),

		protocolo: protocoloAuto,
		documentoDescricao: 'Comparticipação Do Serviço De Energia.'
	};
}

let cachedSvgTemplate: string | null = null;

export async function fetchGtpRupeTemplate(): Promise<string> {
	if (cachedSvgTemplate) return cachedSvgTemplate;
	try {
		const res = await fetch('/GTP_RUPE.svg');
		if (!res.ok) throw new Error(`Falha ao carregar SVG: ${res.status}`);
		const text = await res.text();
		cachedSvgTemplate = text;
		return text;
	} catch (e) {
		console.error('Erro ao carregar /GTP_RUPE.svg:', e);
		return '';
	}
}

/**
 * Injeta dinamicamente os dados no modelo SVG oficial do GTP RUPE
 */
export function renderGtpRupeSvg(templateSvg: string, data: GtpRupeData): string {
	if (!templateSvg) return '';

	const rupeFormatado = formatRupe(data.rupe);
	const valorFormatado = formatAoaCurrency(data.valorTotal);
	const valorPadding = valorFormatado.padStart(20, ' ');
	const valorExtensoTexto = data.valorExtenso || valorPorExtensoKwanzas(data.valorTotal);

	let svg = templateSvg;

	// 1. Data e Hora do Topo
	svg = svg.replace(
		/>\s*\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}\s*<\/tspan>/g,
		`>${data.dataHoraEmissao}</tspan>`
	);

	// 2. RUPE no Topo
	svg = svg.replace(
		/>\s*602\s+012\s+602\s+030\s+731\s+341\s+98\s*<\/tspan>/,
		`>${rupeFormatado}</tspan>`
	);

	// 3. 1.1 Número (11 dígitos)
	svg = svg.replace(
		/>\s*373622322332\s*<\/tspan>/,
		`>${data.numeroLiquidacao}</tspan>`
	);

	// 4. 1.2 Data de Emissão
	svg = svg.replace(
		/>\s*23\/09\/2026\s*<\/tspan>/,
		`>${data.dataEmissao}</tspan>`
	);

	// 5. 1.3 Mês/Ano de Referência
	svg = svg.replace(
		/>\s*9\/2026\s*<\/tspan>/,
		`>${data.mesAnoReferencia}</tspan>`
	);

	// 6. 1.4 Data de Vencimento
	svg = svg.replace(
		/>\s*22\/10\/2026\s*<\/tspan>/,
		`>${data.dataVencimento}</tspan>`
	);

	// 7. 1.6 Forma de Liquidação & 1.7 Tipo de Liquidação
	svg = svg.replace(
		/>\s*Auto Liquidação\s*<\/tspan>/,
		`>${data.formaLiquidacao}</tspan>`
	);
	svg = svg.replace(
		/>\s*Definitiva\s*<\/tspan>/,
		`>${data.tipoLiquidacao}</tspan>`
	);

	// 8. 2.1 NIF & 2.2 Nome/Designação & 2.3 Repartição Fiscal
	svg = svg.replace(
		/>\s*021287366UE050\s*<\/tspan>/,
		`>${data.nif}</tspan>`
	);
	svg = svg.replace(
		/>\s*Nsimba Pedro\s*<\/tspan>/,
		`>${data.nomeContribuinte}</tspan>`
	);
	svg = svg.replace(
		/>\s*301 - Rf Uíge\s*<\/tspan>/,
		`>${data.reparticaoFiscal}</tspan>`
	);

	// 9. 3.1 Código da Receita & 3.2 Nome da Receita
	svg = svg.replace(
		/>\s*04S\s*<\/tspan>/,
		`>${data.codigoReceita}</tspan>`
	);
	svg = svg.replace(
		/>\s*Receitas De Serviços Diversos\s*<\/tspan>/,
		`>${data.nomeReceita}</tspan>`
	);

	// 10. 3.3 Valor da Receita & 3.4 Valor Total
	svg = svg.replace(
		/>\s*7\.398,00\s*<\/tspan>/g,
		`>${valorPadding}</tspan>`
	);

	// 11. 3.5 Valor Total por Extenso
	svg = svg.replace(
		/>\s*Sete Mil\s+Kwanzas\s*<\/tspan>/,
		`>${valorExtensoTexto}</tspan>`
	);

	// 12. 4.1 Observações (com Vencimento, Protocolo e Descrição do Documento)
	const observacaoLinha1 = `A solicitação do serviço será cancelada automaticamente caso a DLI não seja paga até a data do vencimento ${data.dataVencimento}. Protocolo: ${data.protocolo}. Documento:`;
	svg = svg.replace(
		/>\s*A solicitação do serviço será cancelada automaticamente caso a DLI não seja paga até a data do vencimento[^<]*<\/tspan>/,
		`>${observacaoLinha1}</tspan>`
	);

	svg = svg.replace(
		/>\s*Comparticipação Do Serviço De Energia\.\s*<\/tspan>/,
		`>${data.documentoDescricao}</tspan>`
	);

	// 13. Multicaixa Referência para Pagamento e Valor
	svg = svg.replace(
		/602 012 602 030 731 341 98\s+/,
		`${rupeFormatado}    `
	);
	svg = svg.replace(
		/7\.398,00 AKZ/,
		`${valorFormatado} ${data.moeda}`
	);

	// 14. Home Banking ou Balcão do Banco: GPT (mesmo que 1.1)
	svg = svg.replace(
		/>\s*443298728382\s*<\/tspan>/,
		`>${data.numeroLiquidacao}</tspan>`
	);

	return svg;
}

/**
 * Descarrega o ficheiro SVG direto no navegador
 */
export function downloadSvgFile(svgContent: string, filename: string = 'guia_rupe.svg') {
	const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Imprime o documento SVG em folha A4 com alta resolução
 */
export function printSvgDocument(svgContent: string) {
	const printWindow = window.open('', '_blank');
	if (!printWindow) return;

	printWindow.document.write(`
		<!DOCTYPE html>
		<html>
		<head>
			<title>Nota de Liquidação RUPE</title>
			<style>
				@page {
					size: A4 portrait;
					margin: 0;
				}
				body, html {
					margin: 0;
					padding: 0;
					width: 100%;
					height: 100%;
					background: #fff;
					display: flex;
					justify-content: center;
					align-items: flex-start;
				}
				svg {
					width: 210mm;
					height: 297mm;
					max-width: 100%;
					display: block;
				}
				@media print {
					body, html {
						width: 210mm;
						height: 297mm;
					}
					svg {
						width: 210mm;
						height: 297mm;
					}
				}
			</style>
		</head>
		<body>
			${svgContent}
			<script>
				window.onload = function() {
					window.print();
					setTimeout(function() {
						window.close();
					}, 1000);
				};
			</script>
		</body>
		</html>
	`);
	printWindow.document.close();
}

/**
 * Exporta o SVG como PDF A4 vetorial de alta definição
 */
export async function downloadGtpRupePdf(svgContent: string, filename: string = 'guia_rupe.pdf') {
	// Renderiza o SVG em canvas com resolução A4 300 DPI e gera PDF de folha completa
	const { jsPDF } = await import('jspdf');

	return new Promise<void>((resolve, reject) => {
		try {
			const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
			const url = URL.createObjectURL(svgBlob);
			const img = new Image();

			img.onload = () => {
				try {
					const canvas = document.createElement('canvas');
					// A4 em 300 DPI: 2480 x 3508 px
					canvas.width = 2480;
					canvas.height = 3508;
					const ctx = canvas.getContext('2d');
					if (!ctx) {
						reject(new Error('Canvas context não disponível'));
						return;
					}
					ctx.fillStyle = '#FFFFFF';
					ctx.fillRect(0, 0, canvas.width, canvas.height);
					ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

					const imgData = canvas.toDataURL('image/jpeg', 0.98);
					const pdf = new jsPDF({
						orientation: 'portrait',
						unit: 'mm',
						format: 'a4'
					});

					pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
					pdf.save(filename);
					URL.revokeObjectURL(url);
					resolve();
				} catch (err) {
					URL.revokeObjectURL(url);
					reject(err);
				}
			};

			img.onerror = (e) => {
				URL.revokeObjectURL(url);
				reject(e);
			};

			img.src = url;
		} catch (err) {
			reject(err);
		}
	});
}
