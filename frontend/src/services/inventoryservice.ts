// 👇 We import 'api' (Axios) instead of 'supabase'
import { api } from './api';

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  description?: string;
  category?: string;
  business_id?: number; // Added to match your backend model
}

// 1. GET PRODUCTS (Call Backend)
export const getProducts = async (): Promise<Product[]> => {
  try {
    const response = await api.get('/products');
    return response.data;
  } catch (error) {
    console.error("Backend Load Error:", error);
    return [];
  }
};

// 2. CREATE PRODUCT (Call Backend)
export const createProduct = async (
  name: string, 
  price: number, 
  stock: number, 
  category?: string, 
  description?: string
) => {
  const response = await api.post('/products', { 
    name, 
    price, 
    stock, 
    category, 
    description 
  });
  return response.data;
};

// 3. DELETE PRODUCT (Call Backend)
export const deleteProduct = async (id: number) => {
  await api.delete(`/products/${id}`);
};

// 4. UPDATE PRODUCT (Call Backend)
export const updateProduct = async (id: number, updates: Partial<Product>) => {
  const response = await api.put(`/products/${id}`, updates);
  return response.data;
};