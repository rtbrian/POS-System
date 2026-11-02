import { api } from './api';

export type FinancePeriod = 'today' | '7days' | '30days' | '90days';
export type PaymentMethod = 'cash' | 'mobile_money' | 'card' | 'bank_transfer' | 'other';
export type AccountType = 'receivables' | 'payables';

export interface SaleRecord {
  id: string;
  customerName: string | null;
  createdAt: string;
  total: string;
  itemCount: number;
}

export interface SalesAnalytics {
  period: FinancePeriod;
  transactionCount: number;
  grossSales: string;
  averageOrder: string;
  sales: SaleRecord[];
}

export interface AccountRecord {
  id: string;
  counterpartyName: string;
  counterpartyType: 'customer' | 'supplier' | 'other';
  description: string;
  createdAt: string;
  amount: string;
  paid: string;
  balance: string;
}

export interface CreateSaleInput {
  customerName?: string;
  paymentType: 'paid' | 'credit';
  paymentMethod?: PaymentMethod;
  items: Array<{ productId: number; quantity: number }>;
}

export interface CreatePayableInput {
  payeeName: string;
  payeeType: 'supplier' | 'other';
  description: string;
  amount: number;
  amountPaid: number;
  paymentMethod?: PaymentMethod;
}

export const getSalesAnalytics = async (period: FinancePeriod): Promise<SalesAnalytics> => {
  const response = await api.get<SalesAnalytics>('/sales/analytics', { params: { period } });
  return response.data;
};

export const createSale = async (
  sale: CreateSaleInput,
  idempotencyKey: string,
): Promise<SaleRecord> => {
  const response = await api.post<SaleRecord>('/sales', sale, {
    headers: { 'Idempotency-Key': idempotencyKey },
  });
  return response.data;
};

export const recordSalePayment = async (
  id: string,
  amount: number,
  paymentMethod: PaymentMethod,
  idempotencyKey: string,
): Promise<void> => {
  await api.post(`/sales/${id}/payments`, { amount, paymentMethod }, {
    headers: { 'Idempotency-Key': idempotencyKey },
  });
};

export const getAccounts = async (type: AccountType): Promise<AccountRecord[]> => {
  const response = await api.get<{ data: AccountRecord[] }>('/accounts', { params: { type } });
  return response.data.data;
};

export const createPayable = async (
  payable: CreatePayableInput,
  idempotencyKey: string,
): Promise<AccountRecord> => {
  const response = await api.post<AccountRecord>('/accounts/payables', payable, {
    headers: { 'Idempotency-Key': idempotencyKey },
  });
  return response.data;
};

export const recordPayablePayment = async (
  id: string,
  amount: number,
  paymentMethod: PaymentMethod,
  idempotencyKey: string,
): Promise<void> => {
  await api.post(`/accounts/payables/${id}/payments`, { amount, paymentMethod }, {
    headers: { 'Idempotency-Key': idempotencyKey },
  });
};

export const downloadAccountsCsv = async (type: AccountType): Promise<void> => {
  const response = await api.get<Blob>('/accounts/export.csv', {
    params: { type },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `frima-auto-${type}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
