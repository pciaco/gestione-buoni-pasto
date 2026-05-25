export type User = {
	id: number;
	username: string;
};

export type DocumentRow = {
	id: number;
	original_filename: string;
	uploaded_at: string;
	voucher_count: number;
	used_count: number;
};

export type VoucherRow = {
	id: number;
	document_id: number;
	page_number: number;
	code: string;
	value_eur: number | null;
	expiry: string | null;
	status: 'available' | 'used';
	used_at: string | null;
};
