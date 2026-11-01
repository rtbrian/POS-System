import { api } from './api';

export interface Product {
  id: number;
  name: string;
  price: number | string;
  stock: number;
  description: string | null;
  category: string | null;
  business_id: number;
}

export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  stockStatus?: 'low' | 'out';
}

export interface ProductPage {
  data: Product[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type ProductInput = Pick<Product, 'name' | 'price' | 'stock'> &
  Partial<Pick<Product, 'category' | 'description'>>;

export const getProducts = async (filters: ProductQuery = {}): Promise<ProductPage> => {
  const response = await api.get<ProductPage>('/products', { params: filters });
  return response.data;
};

export const createProduct = async (product: ProductInput): Promise<Product> => {
  const response = await api.post<Product>('/products', product);
  return response.data;
};

export const deleteProduct = async (id: number): Promise<void> => {
  await api.delete(`/products/${id}`);
};

export const updateProduct = async (
  id: number,
  updates: Partial<ProductInput>,
): Promise<Product> => {
  const response = await api.put<Product>(`/products/${id}`, updates);
  return response.data;
};
