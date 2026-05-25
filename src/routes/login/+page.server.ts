import { fail, redirect } from '@sveltejs/kit';
import { startSession, verifyPassword } from '$lib/auth';
import { findUserByUsername } from '$lib/db';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) throw redirect(303, '/');
	return { redirectTo: url.searchParams.get('redirectTo') ?? '/' };
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const form = await request.formData();
		const username = String(form.get('username') ?? '').trim();
		const password = String(form.get('password') ?? '');
		const redirectTo = String(form.get('redirectTo') ?? '/') || '/';

		if (!username || !password) {
			return fail(400, { error: 'Inserisci username e password.', username });
		}

		const user = findUserByUsername(username);
		if (!user || !verifyPassword(password, user.password_hash)) {
			return fail(401, { error: 'Credenziali non valide.', username });
		}

		startSession(cookies, user.id);

		const safeRedirect = redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/';
		throw redirect(303, safeRedirect);
	}
};
