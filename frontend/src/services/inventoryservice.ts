import { inventoryApi } from './api';

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  description?: string; // Made optional (?)
  category?: string;    // Added category (?)
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

// 👇 UPDATED: Now accepts 5 arguments
export const createProduct = async (
  name: string, 
  price: number, 
  stock: number, 
  category?: string, 
  description?: string
) => {
  try {
    // Send all 5 fields to the backend
    const response = await inventoryApi.post('/products', { 
      name, 
      price, 
      stock, 
      category, 
      description 
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};