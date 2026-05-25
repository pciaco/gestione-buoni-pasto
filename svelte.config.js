import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		alias: {
			$lib: 'src/lib'
		},
		// Accesso via IP LAN (es. http://192.168.1.129) — checkOrigin altrimenti risponde 403 sul POST /login
		csrf: {
			checkOrigin: false
		}
	}
};

export default config;
