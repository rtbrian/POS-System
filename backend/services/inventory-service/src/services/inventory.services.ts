// 👇 CHANGE THIS LINE
import pool from '../scripts/database'; 

export class InventoryService {
  
  // 1. Get all products
  static async getProducts() {
    const result = await pool.query(
      'SELECT id, name, price, stock_quantity as stock FROM products ORDER BY id DESC'
    );
    return result.rows;
  }

  // 2. Create a new Product
  static async createProduct(name: string, price: number, stock: number) {
    const sql = `
      INSERT INTO products (business_id, name, price, stock_quantity) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, name, price, stock_quantity as stock
    `;
    
    // We hardcode business_id = 1 for now
    const params = [1, name, price, stock]; 

    try {
      const result = await pool.query(sql, params);
      return result.rows[0];
    } catch (error) {
      console.error("SQL Error:", error);
      throw error;
    }
  }
}