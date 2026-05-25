export function maskCode(code: string): string {
	return code.length >= 4 ? `···${code.slice(-4)}` : code;
}

export function formatDate(iso: string): string {
	try {
		return new Date(iso).toLocaleString('it-IT', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	} catch {
		return iso;
	}
}
