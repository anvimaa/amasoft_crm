/**
 * Converte valores numéricos em texto por extenso (Kwanzas / pt-AO).
 */

const UNIDADES = [
	'',
	'Um',
	'Dois',
	'Três',
	'Quatro',
	'Cinco',
	'Seis',
	'Sete',
	'Oito',
	'Nove'
];

const DEZ_A_DEZENOVE = [
	'Dez',
	'Onze',
	'Doze',
	'Treze',
	'Quatorze',
	'Quinze',
	'Dezesseis',
	'Dezessete',
	'Dezoito',
	'Dezenove'
];

const DEZENAS = [
	'',
	'',
	'Vinte',
	'Trinta',
	'Quarenta',
	'Cinquenta',
	'Sessenta',
	'Setenta',
	'Oitenta',
	'Noventa'
];

const CENTENAS = [
	'',
	'Cento',
	'Duzentos',
	'Trezentos',
	'Quatrocentos',
	'Quinhentos',
	'Seiscentos',
	'Setecentos',
	'Oitocentos',
	'Novecentos'
];

function converterCentena(n: number): string {
	if (n === 0) return '';
	if (n === 100) return 'Cem';

	const c = Math.floor(n / 100);
	const d = Math.floor((n % 100) / 10);
	const u = n % 10;

	const partes: string[] = [];

	if (c > 0) {
		partes.push(CENTENAS[c]);
	}

	if (d === 1) {
		partes.push(DEZ_A_DEZENOVE[u]);
	} else {
		if (d > 1) {
			partes.push(DEZENAS[d]);
		}
		if (u > 0) {
			partes.push(UNIDADES[u]);
		}
	}

	return partes.join(' e ');
}

export function valorPorExtensoKwanzas(valorInput: number | string): string {
	if (typeof valorInput === 'string') {
		// Converte string "7.398,00" ou "7398.00" para número float
		const limpo = valorInput.replace(/\./g, '').replace(',', '.').trim();
		const num = parseFloat(limpo);
		if (isNaN(num)) return 'Zero Kwanzas';
		return converterNumero(num);
	}
	return converterNumero(valorInput);
}

function converterNumero(num: number): string {
	if (num <= 0) return 'Zero Kwanzas';

	const inteiro = Math.floor(num);
	const centimos = Math.round((num - inteiro) * 100);

	const grupos: { valor: number; singular: string; plural: string }[] = [];

	// Milhões
	const milhoes = Math.floor((inteiro % 1_000_000_000) / 1_000_000);
	if (milhoes > 0) {
		grupos.push({ valor: milhoes, singular: 'Milhão', plural: 'Milhões' });
	}

	// Milhares
	const milhares = Math.floor((inteiro % 1_000_000) / 1000);
	if (milhares > 0) {
		grupos.push({ valor: milhares, singular: 'Mil', plural: 'Mil' });
	}

	// Unidades / Centenas
	const unidades = inteiro % 1000;
	if (unidades > 0) {
		grupos.push({ valor: unidades, singular: '', plural: '' });
	}

	const partesTexto: string[] = [];

	for (let i = 0; i < grupos.length; i++) {
		const g = grupos[i];
		let textoGrupo = converterCentena(g.valor);

		if (g.singular === 'Mil') {
			if (g.valor === 1) {
				textoGrupo = 'Mil';
			} else {
				textoGrupo += ' Mil';
			}
		} else if (g.singular) {
			textoGrupo += g.valor === 1 ? ` ${g.singular}` : ` ${g.plural}`;
		}

		if (textoGrupo) {
			partesTexto.push(textoGrupo);
		}
	}

	let resultado = partesTexto.join(', ');

	// Ajuste do último " e " se for milhar + dezena/unidade simples
	const ultimoIndexVirgula = resultado.lastIndexOf(', ');
	if (ultimoIndexVirgula !== -1 && unidades > 0 && unidades < 100) {
		resultado =
			resultado.substring(0, ultimoIndexVirgula) +
			' e ' +
			resultado.substring(ultimoIndexVirgula + 2);
	}

	if (inteiro === 1 && grupos.length === 1 && grupos[0].valor === 1) {
		resultado += ' Kwanza';
	} else {
		resultado += ' Kwanzas';
	}

	if (centimos > 0) {
		const textoCentimos = converterCentena(centimos);
		resultado += ` e ${textoCentimos} ${centimos === 1 ? 'Cêntimo' : 'Cêntimos'}`;
	}

	return resultado;
}
