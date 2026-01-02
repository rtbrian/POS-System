import { inventoryApi } from './api';

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

export const getProducts = async () => {
  try {
    const response = await inventoryApi.get('/products');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch products", error);
    return [];
  }
};

export const createProduct = async (name: string, price: number, stock: number) => {
    try {
      const response = await inventoryApi.post('/products', { name, price, stock });
      return response.data;
    } catch (error) {
      throw error;
    }
  };