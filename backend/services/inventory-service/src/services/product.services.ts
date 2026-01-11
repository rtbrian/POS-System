import pool from '../scripts/database'; // Point to your Supabase connection
import { Product } from '../models/products.model';

export class ProductService {
  
  // 1. Get all products
  static async getAllProducts(): Promise<Product[]> {
    const result = await pool.query(
      `SELECT id, business_id, name, price, stock_quantity as stock, category 
       FROM products 
       ORDER BY created_at DESC`
    );
    return result.rows;
  }

  // 2. Create a new product
  static async createProduct(data: Product): Promise<Product> {
    const sql = `
      INSERT INTO products (business_id, name, price, stock_quantity, category) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id, business_id, name, price, stock_quantity as stock, category
    `;
    
    // Default business_id to 1 if missing
    const params = [
      data.business_id || 1, 
      data.name, 
      data.price, 
      data.stock,
      data.category || null
    ];

    const result = await pool.query(sql, params);
    return result.rows[0];
  }
}