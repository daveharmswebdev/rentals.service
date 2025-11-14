export type ReceiptType = 'service' | 'store';

export interface Receipt {
  id: number;
  home_id: number;
  total: number;
  type: ReceiptType;
  vendor_name: string;
  paid_date: string; // ISO date string
  description?: string;
  category?: string;
  receipt_url?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface CreateReceiptDto {
  home_id: number;
  total: number;
  type: ReceiptType;
  vendor_name: string;
  paid_date: string; // ISO date string
  description?: string;
  category?: string;
  receipt_url?: string;
  created_by?: string;
}

export interface UpdateReceiptDto {
  home_id?: number;
  total?: number;
  type?: ReceiptType;
  vendor_name?: string;
  paid_date?: string; // ISO date string
  description?: string;
  category?: string;
  receipt_url?: string;
  updated_by?: string;
}
