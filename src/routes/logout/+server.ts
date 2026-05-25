import { redirect } from '@sveltejs/kit';
import { endSession } from '$lib/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	endSession(cookies);
	throw redirect(303, '/login');
};
