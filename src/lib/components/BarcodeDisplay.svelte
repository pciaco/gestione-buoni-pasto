<script lang="ts">
	import { onMount } from 'svelte';
	import JsBarcode from 'jsbarcode';

	let {
		code,
		valueEur = null,
		expiry = null
	}: {
		code: string;
		valueEur?: number | null;
		expiry?: string | null;
	} = $props();

	let canvasEl = $state<HTMLCanvasElement | null>(null);
	let error = $state<string | null>(null);

	onMount(() => {
		if (!canvasEl || !code) return;

		try {
			JsBarcode(canvasEl, code, {
				format: 'CODE128',
				width: 2.8,
				height: 120,
				margin: 16,
				fontSize: 18,
				fontOptions: 'bold',
				textMargin: 10,
				displayValue: true,
				background: '#ffffff',
				lineColor: '#000000'
			});
		} catch (e) {
			error = e instanceof Error ? e.message : 'Impossibile generare il barcode';
		}
	});
</script>

<div class="voucher-card">
	{#if valueEur != null || expiry}
		<div class="meta-row">
			{#if valueEur != null}
				<div class="meta-cell">
					<span class="label">Valore</span>
					<span class="value">€ {valueEur}</span>
				</div>
			{/if}
			{#if expiry}
				<div class="meta-cell">
					<span class="label">Scadenza</span>
					<span class="value">{expiry}</span>
				</div>
			{/if}
		</div>
	{/if}

	<div class="barcode-block">
		<span class="barcode-label">Barcode</span>
		{#if error}
			<p class="error">{error}</p>
		{:else}
			<canvas bind:this={canvasEl} aria-label="Barcode buono {code}"></canvas>
		{/if}
	</div>
</div>

<style>
	.voucher-card {
		width: 100%;
		max-width: 360px;
		border: 3px solid #00a651;
		border-radius: 4px;
		background: #fff;
		overflow: hidden;
		box-shadow: 0 4px 20px rgb(0 0 0 / 10%);
	}

	.meta-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		border-bottom: 2px solid #00a651;
	}

	.meta-cell {
		padding: 0.65rem 0.75rem;
		border-right: 2px solid #00a651;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.meta-cell:last-child {
		border-right: none;
	}

	.label {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		color: #333;
		letter-spacing: 0.03em;
	}

	.meta-cell .value {
		font-size: 1rem;
		font-weight: 700;
		color: #000;
	}

	.barcode-block {
		padding: 1rem 0.75rem 1.25rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.barcode-label {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		align-self: flex-start;
		color: #333;
	}

	canvas {
		width: 100%;
		max-width: 320px;
		height: auto;
	}

	.error {
		color: var(--danger);
		text-align: center;
		margin: 0;
	}
</style>
