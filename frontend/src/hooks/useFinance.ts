import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPayable,
  createSale,
  getAccounts,
  getSalesAnalytics,
  recordPayablePayment,
  recordSalePayment,
} from '../services/financeService';
import type {
  AccountType,
  CreatePayableInput,
  CreateSaleInput,
  FinancePeriod,
  PaymentMethod,
} from '../services/financeService';

export const salesAnalyticsQueryKey = ['sales-analytics'] as const;
export const accountsQueryKey = ['accounts'] as const;

export const useSalesAnalytics = (period: FinancePeriod) =>
  useQuery({
    queryKey: [...salesAnalyticsQueryKey, period],
    queryFn: () => getSalesAnalytics(period),
  });

export const useAccounts = (type: AccountType) =>
  useQuery({
    queryKey: [...accountsQueryKey, type],
    queryFn: () => getAccounts(type),
  });

export const useCreateSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sale, idempotencyKey }: { sale: CreateSaleInput; idempotencyKey: string }) =>
      createSale(sale, idempotencyKey),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: salesAnalyticsQueryKey }),
        queryClient.invalidateQueries({ queryKey: accountsQueryKey }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
      ]);
    },
  });
};

export const useCreatePayable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payable, idempotencyKey }: {
      payable: CreatePayableInput;
      idempotencyKey: string;
    }) => createPayable(payable, idempotencyKey),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountsQueryKey }),
  });
};

export const useRecordPayment = (type: AccountType) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount, paymentMethod, idempotencyKey }: {
      id: string;
      amount: number;
      paymentMethod: PaymentMethod;
      idempotencyKey: string;
    }) => type === 'receivables'
      ? recordSalePayment(id, amount, paymentMethod, idempotencyKey)
      : recordPayablePayment(id, amount, paymentMethod, idempotencyKey),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: accountsQueryKey }),
        queryClient.invalidateQueries({ queryKey: salesAnalyticsQueryKey }),
      ]);
    },
  });
};
