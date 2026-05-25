<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let dragging = $state(false);
	let fileInput: HTMLInputElement;

	function onDrop(e: DragEvent) {
		e.preventDefault();
		dragging = false;
		const file = e.dataTransfer?.files?.[0];
		if (file && fileInput) {
			const dt = new DataTransfer();
			dt.items.add(file);
			fileInput.files = dt.files;
			fileInput.closest('form')?.requestSubmit();
		}
	}
</script>

<h1>I tuoi PDF</h1>
<p class="intro">Carica il PDF Pluxee, poi mostra il barcode alla cassa e segna il buono come usato.</p>

{#if form?.uploadSuccess}
	<div class="alert alert-success">{form.uploadSuccess}</div>
{/if}
{#if form?.uploadError}
	<div class="alert alert-error">{form.uploadError}</div>
{/if}

<section class="upload card">
	<h2>Carica PDF</h2>
	<form
		method="POST"
		action="?/upload"
		enctype="multipart/form-data"
		class:dragging
		ondragover={(e) => {
			e.preventDefault();
			dragging = true;
		}}
		ondragleave={() => (dragging = false)}
		ondrop={onDrop}
	>
		<div class="dropzone">
			<p>Trascina qui il PDF oppure</p>
			<label class="btn btn-secondary">
				Scegli file
				<input bind:this={fileInput} type="file" name="pdf" accept="application/pdf,.pdf" required />
			</label>
		</div>
		<button type="submit" class="btn btn-primary btn-block">Importa buoni</button>
	</form>
</section>

{#if data.documents.length === 0}
	<p class="muted empty">Nessun PDF con buoni disponibili. I file esauriti sono in <a href="/storico">Storico</a>.</p>
{:else}
	<ul class="doc-list">
		{#each data.documents as doc}
			<li>
				<a href="/document/{doc.id}" class="card doc-card">
					<div class="doc-title">{doc.original_filename}</div>
					<div class="doc-meta">
						<span class="badge badge-available">
							{doc.voucher_count - doc.used_count} disponibili
						</span>
						<span class="muted">{doc.used_count}/{doc.voucher_count} usati</span>
					</div>
					<div class="muted small">{new Date(doc.uploaded_at).toLocaleString('it-IT')}</div>
				</a>
			</li>
		{/each}
	</ul>
{/if}

<style>
	h1 {
		margin: 0 0 0.35rem;
		font-size: 1.4rem;
	}

	.intro {
		color: var(--muted);
		margin: 0 0 1.25rem;
	}

	.upload h2 {
		margin: 0 0 1rem;
		font-size: 1.1rem;
	}

	.dropzone {
		text-align: center;
		padding: 1.5rem 1rem;
		border: 2px dashed var(--border);
		border-radius: var(--radius);
		margin-bottom: 1rem;
	}

	form.dragging .dropzone {
		border-color: var(--primary);
		background: #e3f2fd;
	}

	.dropzone input[type='file'] {
		display: none;
	}

	.doc-list {
		list-style: none;
		padding: 0;
		margin: 1.5rem 0 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.doc-card {
		display: block;
		text-decoration: none;
		color: inherit;
	}

	.doc-title {
		font-weight: 600;
		margin-bottom: 0.35rem;
		word-break: break-word;
	}

	.doc-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
		margin-bottom: 0.25rem;
	}

	.small {
		font-size: 0.85rem;
	}

	.muted {
		color: var(--muted);
	}

	.empty {
		text-align: center;
		padding: 2rem;
	}
</style>
