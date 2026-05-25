<script lang="ts">
	import { formatEuro } from '$lib/amounts';
	import { maskCode } from '$lib/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const filterSuffix = $derived(data.fromStorico ? '&from=storico' : '');
</script>

<h1>{data.document.name}</h1>
{#if data.isArchived}
	<p class="archived-note">Tutti i buoni di questo file sono stati usati.</p>
{/if}

<div class="summary card">
	<p class="stats">
		<strong>{data.stats.available}</strong> disponibili · {data.stats.used} usati · {data.stats.total} totali
	</p>
	<div class="amounts">
		<div class="amount-row">
			<span class="amount-label">Importo disponibile</span>
			<span class="amount-value available">{formatEuro(data.amounts.availableEur)}</span>
			{#if data.amounts.availableWithoutValue > 0}
				<span class="amount-hint"
					>({data.amounts.availableWithoutValue} buon{data.amounts.availableWithoutValue === 1
						? 'o'
						: 'i'} senza importo nel PDF)</span
				>
			{/if}
		</div>
		<div class="amount-row">
			<span class="amount-label">Importo utilizzato</span>
			<span class="amount-value used">{formatEuro(data.amounts.usedEur)}</span>
			{#if data.amounts.usedWithoutValue > 0}
				<span class="amount-hint"
					>({data.amounts.usedWithoutValue} buon{data.amounts.usedWithoutValue === 1 ? 'o' : 'i'} senza
					importo nel PDF)</span
				>
			{/if}
		</div>
	</div>
</div>

<div class="filters">
	<a
		href="?filter=available{filterSuffix}"
		class:active={data.filter === 'available'}
		class="filter-btn">Disponibili</a
	>
	<a href="?filter=used{filterSuffix}" class:active={data.filter === 'used'} class="filter-btn">Usati</a>
	<a href="?filter=all{filterSuffix}" class:active={data.filter === 'all'} class="filter-btn">Tutti</a>
</div>

{#if data.vouchers.length === 0}
	<p class="muted empty">Nessun buono in questa vista.</p>
{:else}
	<ul class="voucher-list">
		{#each data.vouchers as v}
			<li class="card voucher-card" class:used={v.status === 'used'}>
				<div class="voucher-info">
					<span class="page">Buono {v.page_number}</span>
					<span class="code">{maskCode(v.code)}</span>
					{#if v.value_eur != null}
						<span class="value">{formatEuro(v.value_eur)}</span>
					{/if}
					{#if v.expiry}
						<span class="muted expiry">scad. {v.expiry}</span>
					{/if}
					<span class="badge" class:badge-available={v.status === 'available'} class:badge-used={v.status === 'used'}>
						{v.status === 'available' ? 'Disponibile' : 'Usato'}
					</span>
				</div>
				<div class="actions">
					{#if v.status === 'available'}
						<a href="/cassa/{v.id}" class="btn btn-primary">Mostra alla cassa</a>
					{:else}
						<form method="POST" action="/cassa/{v.id}?/restore">
							<button type="submit" class="btn btn-secondary">Ripristina</button>
						</form>
					{/if}
				</div>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.archived-note {
		color: var(--muted);
		font-size: 0.9rem;
		margin: 0 0 0.75rem;
		text-align: center;
	}

	h1 {
		font-size: 1.15rem;
		margin: 0 0 0.75rem;
		word-break: break-word;
		text-align: center;
	}

	.summary {
		margin-bottom: 1rem;
	}

	.stats {
		color: var(--muted);
		margin: 0 0 0.85rem;
	}

	.amounts {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	.amount-row {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.35rem 0.75rem;
	}

	.amount-label {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text);
		min-width: 10rem;
	}

	.amount-value {
		font-size: 1.15rem;
		font-weight: 700;
	}

	.amount-value.available {
		color: var(--success);
	}

	.amount-value.used {
		color: var(--muted);
	}

	.amount-hint {
		font-size: 0.8rem;
		color: var(--muted);
		width: 100%;
	}

	.filters {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.filter-btn {
		padding: 0.4rem 0.85rem;
		border-radius: 999px;
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 600;
		background: var(--surface);
		border: 1px solid var(--border);
		color: var(--text);
	}

	.filter-btn.active {
		background: var(--primary);
		border-color: var(--primary);
		color: white;
	}

	.voucher-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.voucher-card {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.voucher-card.used {
		opacity: 0.85;
	}

	.voucher-info {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}

	.page {
		font-weight: 700;
	}

	.code {
		font-family: ui-monospace, monospace;
	}

	.value {
		font-weight: 600;
		color: var(--success);
	}

	.expiry {
		font-size: 0.85rem;
	}

	.actions .btn {
		width: 100%;
	}

	.empty {
		text-align: center;
		padding: 2rem;
	}

	.muted {
		color: var(--muted);
	}
</style>
