<script lang="ts">
	import { onMount } from 'svelte';
	import * as pdfjs from 'pdfjs-dist';
	import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

	let {
		pdfUrl,
		pageNumber,
		scale = 2.5
	}: {
		pdfUrl: string;
		pageNumber: number;
		scale?: number;
	} = $props();

	let canvasEl = $state<HTMLCanvasElement | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		if (!canvasEl) return;

		try {
			pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
			const loadingTask = pdfjs.getDocument({ url: pdfUrl, withCredentials: true });
			const pdf = await loadingTask.promise;
			const page = await pdf.getPage(pageNumber);

			const baseViewport = page.getViewport({ scale: 1 });
			const targetWidth = Math.min(window.innerWidth * 0.92, 480);
			const computedScale = (targetWidth / baseViewport.width) * scale;
			const viewport = page.getViewport({ scale: computedScale });

			const canvas = canvasEl;
			const context = canvas.getContext('2d');
			if (!context) throw new Error('Canvas non disponibile');

			canvas.width = viewport.width;
			canvas.height = viewport.height;

			await page.render({ canvasContext: context, viewport, canvas }).promise;
			loading = false;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Errore caricamento PDF';
			loading = false;
		}
	});
</script>

<div class="pdf-viewer">
	{#if loading}
		<p class="muted">Caricamento buono…</p>
	{/if}
	{#if error}
		<p class="error">{error}</p>
	{/if}
	<canvas bind:this={canvasEl} class:hidden={loading || !!error}></canvas>
</div>

<style>
	.pdf-viewer {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		min-height: 50vh;
	}

	canvas {
		max-width: 100%;
		height: auto;
		background: white;
		box-shadow: 0 2px 16px rgb(0 0 0 / 8%);
		border-radius: 8px;
	}

	canvas.hidden {
		display: none;
	}

	.muted {
		color: var(--muted);
	}

	.error {
		color: var(--danger);
		text-align: center;
		padding: 1rem;
	}
</style>
