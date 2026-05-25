import { listArchivedDocuments } from '$lib/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	return { documents: listArchivedDocuments(locals.user!.id) };
};
