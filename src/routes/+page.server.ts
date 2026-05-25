import { fail } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { UPLOAD_DIR } from '$lib/config';
import { insertDocument, insertVouchers, listActiveDocuments } from '$lib/db';
import { extractVouchersFromPdf } from '$lib/pdf';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	return { documents: listActiveDocuments(locals.user!.id) };
};

export const actions: Actions = {
	upload: async ({ request, locals }) => {
		const form = await request.formData();
		const file = form.get('pdf');

		if (!file || !(file instanceof File)) {
			return fail(400, { uploadError: 'Seleziona un file PDF.' });
		}

		if (!file.name.toLowerCase().endsWith('.pdf')) {
			return fail(400, { uploadError: 'Il file deve essere un PDF.' });
		}

		const buffer = Buffer.from(await file.arrayBuffer());

		let vouchers;
		try {
			vouchers = await extractVouchersFromPdf(buffer);
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Errore lettura PDF';
			return fail(400, { uploadError: message });
		}

		const storedFilename = `${randomUUID()}.pdf`;
		const storedPath = join(UPLOAD_DIR, storedFilename);
		writeFileSync(storedPath, buffer);

		const userId = locals.user!.id;
		const documentId = insertDocument(userId, file.name, storedFilename);
		insertVouchers(userId, documentId, vouchers);

		return { uploadSuccess: `${vouchers.length} buoni importati da "${file.name}".` };
	}
};
