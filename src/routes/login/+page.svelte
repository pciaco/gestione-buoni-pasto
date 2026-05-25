<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	let loading = $state(false);
</script>

<div class="login-wrap">
	<div class="card login-card">
		<h1>Buoni Pasto</h1>
		<p class="subtitle">Accedi per gestire i tuoi buoni Pluxee</p>

		{#if form?.error}
			<div class="alert alert-error">{form.error}</div>
		{/if}

		<form
			method="POST"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					await update();
					loading = false;
				};
			}}
		>
			<input type="hidden" name="redirectTo" value={data.redirectTo} />

			<div class="field">
				<label for="username">Username</label>
				<input
					id="username"
					name="username"
					type="text"
					autocomplete="username"
					required
					value={form?.username ?? ''}
				/>
			</div>

			<div class="field">
				<label for="password">Password</label>
				<input id="password" name="password" type="password" autocomplete="current-password" required />
			</div>

			<button type="submit" class="btn btn-primary btn-block" disabled={loading}>
				{loading ? 'Accesso…' : 'Accedi'}
			</button>
		</form>
	</div>
</div>

<style>
	.login-wrap {
		min-height: 80vh;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.login-card {
		width: 100%;
		max-width: 400px;
	}

	h1 {
		margin: 0 0 0.25rem;
		font-size: 1.5rem;
	}

	.subtitle {
		color: var(--muted);
		margin: 0 0 1.5rem;
	}

	.field {
		margin-bottom: 1rem;
	}
</style>
