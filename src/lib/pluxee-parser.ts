export type ParsedVoucher = {
	page_number: number;
	code: string;
	value_eur: number | null;
	expiry: string | null;
};

/** Estrae buoni Pluxee dal testo del PDF (CODICE a 14 cifre). */
export function parsePluxeeText(text: string): ParsedVoucher[] {
	const codes: string[] = [];
	const codeRe = /CODICE\s*\n(\d{14})/g;
	let match: RegExpExecArray | null;
	while ((match = codeRe.exec(text)) !== null) {
		codes.push(match[1]);
	}

	if (codes.length === 0) {
		const fallbackRe = /BARCODE\s*\n(\d{14})/g;
		while ((match = fallbackRe.exec(text)) !== null) {
			codes.push(match[1]);
		}
	}

	const meta: Array<{ value_eur: number; expiry: string }> = [];
	const metaRe = /€\s*(\d+(?:[.,]\d{1,2})?)\s+(\d{2}\/\d{2}\/\d{4})/g;
	while ((match = metaRe.exec(text)) !== null) {
		const raw = match[1].replace(',', '.');
		meta.push({ value_eur: parseFloat(raw), expiry: match[2] });
	}

	return codes.map((code, index) => ({
		page_number: index + 1,
		code,
		value_eur: meta[index]?.value_eur ?? null,
		expiry: meta[index]?.expiry ?? null
	}));
}
