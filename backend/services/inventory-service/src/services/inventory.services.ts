import { query } from 'shared/src/database/postgres.client';
import { Product } from '../models/products.model';

export class InventoryService {
  
  // 1. Create a new Product
  static async createProduct(product: Product): Promise<Product> {
    // ⚠️ We made this one line to avoid "invisible character" errors
    const sql = 'INSERT INTO products (business_id, name, description, price, stock_quantity, category, barcode) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';
    
    const params = [
      product.business_id,
      product.name,
      product.description || null,   // Safety: Convert undefined to null
      product.price,
      product.stock_quantity,
      product.category || null,      // Safety: Convert undefined to null
      product.barcode || null        // Safety: Convert undefined to null
    ];

    try {
      const result = await query(sql, params);
      return result.rows[0];
    } catch (error) {
      console.error("SQL Error:", error); // This will show us the exact issue if it fails again
      throw error;
    }
  }

  // 2. Get all products for a specific business
  static async getProducts(businessId: number): Promise<Product[]> {
    const result = await query(
      'SELECT * FROM products WHERE business_id = $1 ORDER BY created_at DESC', 
      [businessId]
    );
    return result.rows;
  }
}