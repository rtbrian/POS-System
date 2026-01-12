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


// 3. DELETE PRODUCT
export const deleteProduct = async (id: number) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id); // ⚠️ VERY IMPORTANT: Delete only the row where id matches

  if (error) {
    console.error("Supabase Delete Error:", error.message);
    throw error;
  }
};

// 4. UPDATE PRODUCT
export const updateProduct = async (id: number, updates: Partial<Product>) => {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) {
    console.error("Supabase Update Error:", error.message);
    throw error;
  }
  return data;
};