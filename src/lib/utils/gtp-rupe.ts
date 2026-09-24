import type { GtpRupeData } from '../types/gtp-rupe';
import { valorPorExtensoKwanzas } from './numero-extenso';
import QRCode from 'qrcode';

export function generateRandom11Digits(): string {
	// Gera exatamente 11 dígitos numéricos
	const min = 10000000000;
	const max = 99999999999;
	return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

export const RUPE_FIXED_PREFIX = '6020126020';

export const SUGGESTED_RUPE_VALUES = [
	'2.122,00',
	'7.398,00',
	'14.795,00',
	'17.600,00',
	'26.400,00',
	'44.000,00',
	'100.232,00'
];

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

/**
 * Gera DataURL do QR Code com o RUPE sem espaços
 */
export async function generateRupeQrCodeDataUrl(rawRupe: string): Promise<string> {
	const cleanRupe = (rawRupe || '').replace(/\D/g, '');
	if (!cleanRupe) return '';
	try {
		return await QRCode.toDataURL(cleanRupe, {
			margin: 1,
			width: 300,
			errorCorrectionLevel: 'M',
			color: {
				dark: '#000000',
				light: '#ffffff'
			}
		});
	} catch (e) {
		console.error('Erro ao gerar QR code do RUPE:', e);
		return '';
	}
}

/**
 * Formata valores para a Guia de Liquidação GTP RUPE com separador de milhar por ponto e duas casas decimais com vírgula
 * Ex: 26.400,00, 7.398,00, 14.795,00, 100.232,00
 */
export function formatGuiaRupeValue(val: number | string): string {
	if (val === undefined || val === null) return '0,00';
	if (typeof val === 'number') {
		const parts = val.toFixed(2).split('.');
		const integerWithDots = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
		return `${integerWithDots},${parts[1]}`;
	}
	const str = String(val).trim();
	if (!str) return '0,00';

	// Remove pontos de milhar existentes
	const withoutDots = str.replace(/\./g, '');
	if (withoutDots.includes(',')) {
		const [intPart, decPart = '00'] = withoutDots.split(',');
		const onlyInt = intPart.replace(/\D/g, '') || '0';
		const onlyDec = (decPart.replace(/\D/g, '') + '00').slice(0, 2);
		const formattedInt = onlyInt.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
		return `${formattedInt},${onlyDec}`;
	}

	const onlyDigits = withoutDots.replace(/\D/g, '') || '0';
	const formattedInt = onlyDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
	return `${formattedInt},00`;
}

export function formatAoaCurrency(val: number | string): string {
	return formatGuiaRupeValue(val);
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

export async function fetchLatestGtpRupeFromApi(): Promise<GtpRupeData | null> {
	try {
		const res = await fetch('/api/gtp-rupe');
		if (!res.ok) return null;
		const data = await res.json();
		if (data && typeof data.rupe === 'string') {
			return data;
		}
	} catch (e) {
		console.error('Erro ao carregar último RUPE da API:', e);
	}
	return null;
}

export async function saveLatestGtpRupeToApi(data: GtpRupeData): Promise<boolean> {
	try {
		const res = await fetch('/api/gtp-rupe', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});
		return res.ok;
	} catch (e) {
		console.error('Erro ao guardar RUPE na API:', e);
		return false;
	}
}

/**
 * Injeta dinamicamente os dados no modelo SVG oficial do GTP RUPE
 */
export function renderGtpRupeSvg(templateSvg: string, data: GtpRupeData, qrDataUrl?: string): string {
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

	// 10. 3.3 Valor da Receita & 3.4 Valor Total (Alinhados mesmo no final à direita)
	const valorReceitaFormatado = formatAoaCurrency(data.valorReceita || data.valorTotal);
	const valorTotalFormatado = formatAoaCurrency(data.valorTotal);

	// 3.3 Valor da Receita (y=11322)
	svg = svg.replace(
		/<tspan class="TextPosition" x="17515" y="11322"><tspan[^>]*>[^<]*7\.398,00<\/tspan><\/tspan>/,
		`<tspan class="TextPosition" x="19800" y="11322" text-anchor="end"><tspan font-family="Helvetica, sans-serif" font-size="247px" font-weight="700" fill="rgb(0,0,0)" stroke="none" text-anchor="end">${valorReceitaFormatado}</tspan></tspan>`
	);

	// 3.4 Valor Total (y=12222)
	svg = svg.replace(
		/<tspan class="TextPosition" x="17515" y="12222"><tspan[^>]*>[^<]*7\.398,00<\/tspan><\/tspan>/,
		`<tspan class="TextPosition" x="19800" y="12222" text-anchor="end"><tspan font-family="Helvetica, sans-serif" font-size="247px" font-weight="700" fill="rgb(0,0,0)" stroke="none" text-anchor="end">${valorTotalFormatado}</tspan></tspan>`
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

	// 15. QR Code dinâmico com o RUPE sem espaços NO TOPO (junto ao RUPE em destaque)
	if (qrDataUrl) {
		const topQrRegex = /<g class="com\.sun\.star\.drawing\.PolyPolygonShape">\s*<g id="id13">[\s\S]*?(?=<g class="com\.sun\.star\.drawing\.PolyPolygonShape">\s*<g id="id231">)/;
		svg = svg.replace(
			topQrRegex,
			`<g class="Graphic">\n       <g id="topQrCode">\n        <rect class="BoundingBox" stroke="none" fill="none" x="18750" y="3350" width="1050" height="1050"/>\n        <image x="18750" y="3350" width="1050" height="1050" preserveAspectRatio="none" xlink:href="${qrDataUrl}"/>\n       </g>\n      </g>\n      `
		);
	}

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
