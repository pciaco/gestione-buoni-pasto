<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';

	let { children, data } = $props();

	const isCassa = $derived(page.url.pathname.startsWith('/cassa'));
	const isHome = $derived(page.url.pathname === '/');
	const isStorico = $derived(page.url.pathname.startsWith('/storico'));
</script>

<svelte:head>
	<title>Buoni Pasto</title>
	<meta name="theme-color" content="#0066cc" />
</svelte:head>

{#if data.user && !isCassa}
	<header class="header">
		<a href="/" class="brand">Buoni Pasto</a>
		<nav class="nav">
			<a href="/" class:active={isHome}>Home</a>
			<a href="/storico" class:active={isStorico}>Storico</a>
		</nav>
		<div class="header-right">
			<span class="user">{data.user.username}</span>
			<form method="POST" action="/logout">
				<button type="submit" class="btn-link">Esci</button>
			</form>
		</div>
	</header>
{/if}

<main class="main" class:cassa-main={isCassa}>
	{@render children()}
</main>

<style>
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		flex-wrap: wrap;
		padding: 0.75rem 1rem;
		background: var(--surface);
		border-bottom: 1px solid var(--border);
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.brand {
		font-weight: 700;
		color: var(--text);
		text-decoration: none;
		font-size: 1.05rem;
	}

	.nav {
		display: flex;
		gap: 0.25rem;
		flex: 1;
		justify-content: center;
	}

	.nav a {
		padding: 0.35rem 0.75rem;
		border-radius: 999px;
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--muted);
	}

	.nav a.active {
		background: #e3f2fd;
		color: var(--primary);
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.9rem;
	}

	.user {
		color: var(--muted);
	}

	.btn-link {
		background: none;
		border: none;
		color: var(--primary);
		cursor: pointer;
		font-size: 0.9rem;
		padding: 0;
	}

	.main {
		max-width: 640px;
		margin: 0 auto;
		padding: 1rem;
		padding-bottom: 2rem;
	}

	.main.cassa-main {
		max-width: none;
		padding: 0;
		margin: 0;
	}
</style>
