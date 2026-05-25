import { PDFParse } from 'pdf-parse';
import { parsePluxeeText, type ParsedVoucher } from '$lib/pluxee-parser';

export async function extractVouchersFromPdf(buffer: Buffer): Promise<ParsedVoucher[]> {
	const parser = new PDFParse({ data: buffer });
	try {
		const result = await parser.getText();
		const vouchers = parsePluxeeText(result.text);
		if (vouchers.length === 0) {
			throw new Error(
				'Nessun buono Pluxee trovato nel PDF. Verifica che il file contenga codici CODICE a 14 cifre.'
			);
		}
		return vouchers;
	} finally {
		await parser.destroy();
	}
}
