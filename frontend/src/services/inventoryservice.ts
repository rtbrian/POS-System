// import { inventoryApi } from './api';

// export interface Product {
//   id: number;
//   name: string;
//   price: number;
//   stock: number;
//   description?: string; // Made optional (?)
//   category?: string;    // Added category (?)
// }

// export const getProducts = async () => {
//   try {
//     const response = await inventoryApi.get('/products');
//     return response.data;
//   } catch (error) {
//     console.error("Failed to fetch products", error);
//     return [];
//   }
// };

// // 👇 UPDATED: Now accepts 5 arguments
// export const createProduct = async (
//   name: string, 
//   price: number, 
//   stock: number, 
//   category?: string, 
//   description?: string
// ) => {
//   try {
//     // Send all 5 fields to the backend
//     const response = await inventoryApi.post('/products', { 
//       name, 
//       price, 
//       stock, 
//       category, 
//       description 
//     });
//     return response.data;
//   } catch (error) {
//     throw error;
//   }
// };

// src/services/inventoryservice.ts


import { supabase } from '../supabase'; // Ensure you created src/supabase.ts

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  description?: string;
  category?: string;
}

// 1. GET PRODUCTS (Direct from Supabase)
export const getProducts = async () => {
  const { data, error } = await supabase
    .from('products') // ⚠️ Make sure your table is named 'products' in Supabase
    .select('*')
    .order('id', { ascending: true }); // Optional: sorts by ID

  if (error) {
    console.error("Supabase Load Error:", error.message);
    return [];
  }
  return data || [];
};

// 2. CREATE PRODUCT (Direct to Supabase)
export const createProduct = async (
  name: string, 
  price: number, 
  stock: number, 
  category?: string, 
  description?: string
) => {
  const { data, error } = await supabase
    .from('products')
    .insert([
      { name, price, stock, category, description }
    ])
    .select(); // .select() is needed to return the created object

  if (error) {
    console.error("Supabase Create Error:", error.message);
    throw error;
  }
  return data;
};