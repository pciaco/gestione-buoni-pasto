import type { VoucherRow } from '$lib/types';

export type AmountTotals = {
	availableEur: number;
	usedEur: number;
	availableWithoutValue: number;
	usedWithoutValue: number;
};

/** Somma gli importi per buono usando value_eur letto dal PDF (può variare per buono). */
export function computeAmountTotals(vouchers: VoucherRow[]): AmountTotals {
	let availableEur = 0;
	let usedEur = 0;
	let availableWithoutValue = 0;
	let usedWithoutValue = 0;

	for (const v of vouchers) {
		if (v.status === 'available') {
			if (v.value_eur != null) availableEur += v.value_eur;
			else availableWithoutValue++;
		} else {
			if (v.value_eur != null) usedEur += v.value_eur;
			else usedWithoutValue++;
		}
	}

	return { availableEur, usedEur, availableWithoutValue, usedWithoutValue };
}

export function formatEuro(amount: number): string {
	return new Intl.NumberFormat('it-IT', {
		style: 'currency',
		currency: 'EUR',
		maximumFractionDigits: 2
	}).format(amount);
}
