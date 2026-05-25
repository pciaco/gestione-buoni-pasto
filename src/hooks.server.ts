import { getUserFromCookies } from '$lib/auth';
import { redirect, type Handle } from '@sveltejs/kit';

const PUBLIC_PREFIXES = ['/login'];

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	const isPublic = PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));

	event.locals.user = getUserFromCookies(event.cookies);

	if (!event.locals.user && !isPublic) {
		const redirectTo = encodeURIComponent(path + event.url.search);
		throw redirect(303, `/login?redirectTo=${redirectTo}`);
	}

	if (event.locals.user && path === '/login') {
		throw redirect(303, '/');
	}

	return resolve(event);
};
