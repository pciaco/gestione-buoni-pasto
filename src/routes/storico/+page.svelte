<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<h1>Storico</h1>
<p class="intro">PDF di cui tutti i buoni sono stati utilizzati. Puoi rivederli e ripristinare un buono se necessario.</p>

{#if data.documents.length === 0}
	<p class="muted empty">Nessun file nello storico.</p>
{:else}
	<ul class="doc-list">
		{#each data.documents as doc}
			<li>
				<a href="/document/{doc.id}?from=storico&filter=used" class="card doc-card">
					<div class="doc-title">{doc.original_filename}</div>
					<div class="doc-meta">
						<span class="badge badge-used">Completato</span>
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

	.doc-list {
		list-style: none;
		padding: 0;
		margin: 0;
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
