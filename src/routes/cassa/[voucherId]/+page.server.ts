import { error, fail, redirect } from '@sveltejs/kit';
import { getVoucher, markVoucherAvailable, markVoucherUsed } from '$lib/db';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const voucherId = parseInt(params.voucherId, 10);
	if (Number.isNaN(voucherId)) error(404, 'Buono non trovato');

	const voucher = getVoucher(locals.user!.id, voucherId);
	if (!voucher) error(404, 'Buono non trovato');

	return {
		voucher: {
			id: voucher.id,
			document_id: voucher.document_id,
			page_number: voucher.page_number,
			code: voucher.code,
			value_eur: voucher.value_eur,
			expiry: voucher.expiry,
			status: voucher.status,
			document_filename: voucher.document_filename
		}
	};
};

export const actions: Actions = {
	markUsed: async ({ locals, params }) => {
		const voucherId = parseInt(params.voucherId, 10);
		if (!markVoucherUsed(locals.user!.id, voucherId)) {
			return fail(400, { actionError: 'Impossibile segnare come usato.' });
		}
		const v = getVoucher(locals.user!.id, voucherId);
		const docUrl = v ? `/document/${v.document_id}?filter=available` : '/';
		throw redirect(303, docUrl);
	},
	restore: async ({ locals, params }) => {
		const voucherId = parseInt(params.voucherId, 10);
		const v = getVoucher(locals.user!.id, voucherId);
		if (!v || !markVoucherAvailable(locals.user!.id, voucherId)) {
			return fail(400, { actionError: 'Impossibile ripristinare.' });
		}
		throw redirect(303, `/document/${v.document_id}?filter=used`);
	}
};
