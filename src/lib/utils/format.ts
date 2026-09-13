export function formatKz(value: number): string {
	return new Intl.NumberFormat('pt-AO', {
		maximumFractionDigits: 0
	}).format(value) + ' Kz';
}
