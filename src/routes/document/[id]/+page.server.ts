import { error } from '@sveltejs/kit';
import { computeAmountTotals } from '$lib/amounts';
import { getDocument, listVouchers } from '$lib/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const documentId = parseInt(params.id, 10);
	if (Number.isNaN(documentId)) error(404, 'Documento non trovato');

	const doc = getDocument(locals.user!.id, documentId);
	if (!doc) error(404, 'Documento non trovato');

	const filter = url.searchParams.get('filter') ?? 'available';
	const vouchers = listVouchers(
		locals.user!.id,
		documentId,
		filter === 'all' || filter === 'used' ? (filter === 'used' ? 'used' : undefined) : 'available'
	);

	const all = listVouchers(locals.user!.id, documentId);
	const availableCount = all.filter((v) => v.status === 'available').length;

	const fromStorico = url.searchParams.get('from') === 'storico';
	const amounts = computeAmountTotals(all);

	return {
		document: { id: doc.id, name: doc.original_filename },
		vouchers,
		filter,
		fromStorico,
		isArchived: availableCount === 0 && all.length > 0,
		stats: { total: all.length, available: availableCount, used: all.length - availableCount },
		amounts
	};
};
