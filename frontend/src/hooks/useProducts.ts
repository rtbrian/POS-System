import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createProduct,
  deleteProduct,
  getProducts,
} from '../services/inventoryservice';
import type { ProductInput, ProductQuery } from '../services/inventoryservice';

export const productsQueryKey = ['products'] as const;

export const useProducts = (filters: ProductQuery = {}) =>
  useQuery({
    queryKey: [...productsQueryKey, filters],
    queryFn: () => getProducts(filters),
  });

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (product: ProductInput) => createProduct(product),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productsQueryKey }),
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productsQueryKey }),
  });
};
