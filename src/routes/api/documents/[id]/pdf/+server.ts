import { error } from '@sveltejs/kit';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { UPLOAD_DIR } from '$lib/config';
import { getDocument } from '$lib/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, params }) => {
	const documentId = parseInt(params.id, 10);
	if (Number.isNaN(documentId)) error(404, 'Non trovato');

	const doc = getDocument(locals.user!.id, documentId);
	if (!doc) error(404, 'Non trovato');

	const path = join(UPLOAD_DIR, doc.stored_filename);
	if (!existsSync(path)) error(404, 'File PDF non trovato');

	const buffer = readFileSync(path);
	return new Response(buffer, {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': 'inline',
			'Cache-Control': 'private, max-age=3600'
		}
	});
};
