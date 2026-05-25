<script lang="ts">
	import { onMount } from 'svelte';
	import BarcodeDisplay from '$lib/components/BarcodeDisplay.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let confirmUsed = $state(false);

	onMount(() => {
		let wakeLock: WakeLockSentinel | null = null;
		(async () => {
			try {
				if ('wakeLock' in navigator) {
					wakeLock = await navigator.wakeLock.request('screen');
				}
			} catch {
				/* ignore */
			}
		})();
		return () => {
			wakeLock?.release();
		};
	});
</script>

<div class="cassa">
	<header class="cassa-header">
		<a href="/document/{data.voucher.document_id}" class="back-btn">
			<span class="back-icon" aria-hidden="true">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
					<path d="M15 18l-6-6 6-6" />
				</svg>
			</span>
			Indietro
		</a>
		<div class="meta">
			<span class="meta-label">Buono</span>
			<span class="meta-value">{data.voucher.page_number}</span>
		</div>
	</header>

	<div class="barcode-area">
		<p class="hint">Mostra questo barcode alla cassa</p>
		<BarcodeDisplay
			code={data.voucher.code}
			valueEur={data.voucher.value_eur}
			expiry={data.voucher.expiry}
		/>
	</div>

	<footer class="cassa-footer">
		{#if form?.actionError}
			<div class="alert alert-error">{form.actionError}</div>
		{/if}

		{#if !confirmUsed}
			<button type="button" class="btn btn-success btn-block" onclick={() => (confirmUsed = true)}>
				Segna come usato
			</button>
			<p class="footer-note">Usa questo pulsante solo dopo che la cassa ha scansionato il buono.</p>
		{:else}
			<p class="confirm-text">Confermi di aver usato questo buono alla cassa?</p>
			<form method="POST" action="?/markUsed">
				<button type="submit" class="btn btn-success btn-block">Sì, segnalo come usato</button>
			</form>
			<button type="button" class="btn btn-secondary btn-block" onclick={() => (confirmUsed = false)}>
				Annulla
			</button>
		{/if}
	</footer>
</div>

<style>
	.cassa {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		background: #fff;
		margin: -1rem;
		padding: 0;
	}

	.cassa-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.65rem 1rem;
		border-bottom: 1px solid var(--border);
		background: var(--surface);
		box-shadow: 0 1px 0 rgb(0 0 0 / 4%);
	}

	.back-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.5rem 0.9rem 0.5rem 0.65rem;
		border-radius: 999px;
		border: 1px solid var(--border);
		background: var(--bg);
		color: var(--text);
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 600;
		line-height: 1;
		transition:
			background 0.15s,
			border-color 0.15s,
			box-shadow 0.15s;
		-webkit-tap-highlight-color: transparent;
	}

	.back-btn:hover {
		background: #e8f0fa;
		border-color: #b8d4f0;
		color: var(--primary);
	}

	.back-btn:active {
		transform: scale(0.98);
	}

	.back-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--primary);
	}

	.meta {
		display: flex;
		align-items: baseline;
		gap: 0.35rem;
		padding: 0.4rem 0.75rem;
		border-radius: 999px;
		background: var(--bg);
		border: 1px solid var(--border);
	}

	.meta-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--muted);
	}

	.meta-value {
		font-size: 1rem;
		font-weight: 700;
		color: var(--text);
	}

	.barcode-area {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 1.25rem 1rem;
		background: #fff;
	}

	.hint {
		margin: 0 0 1.25rem;
		color: var(--muted);
		font-size: 0.95rem;
		text-align: center;
	}

	.cassa-footer {
		padding: 1rem;
		background: var(--bg);
		border-top: 1px solid var(--border);
	}

	.footer-note,
	.confirm-text {
		font-size: 0.85rem;
		color: var(--muted);
		text-align: center;
		margin: 0.5rem 0 0;
	}

	.confirm-text {
		margin-bottom: 0.75rem;
		font-weight: 600;
		color: var(--text);
	}
</style>
