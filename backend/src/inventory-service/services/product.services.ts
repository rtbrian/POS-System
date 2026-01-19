// 👇 FIXED IMPORT: This looks correct
import { query } from '../../postgres.client';

export class ProductService {
  
  // 1. Get all products
  static async getAllProducts() {
    // ✅ Correct: Uses 'query'
    const result = await query(
      `SELECT id, business_id, name, price, stock_quantity as stock, category, description 
       FROM products 
       ORDER BY id ASC`
    );
    return result.rows;
  }

  // 2. Create a new product
  static async createProduct(data: any) {
    const sql = `
      INSERT INTO products (business_id, name, price, stock_quantity, category, description) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id, name, price, stock_quantity as stock, category, description
    `;
    
    const params = [
      data.business_id || 1, 
      data.name, 
      data.price, 
      data.stock,
      data.category || null,
      data.description || null
    ];

    // 👇 FIXED: Changed 'pool.query' to 'query'
    const result = await query(sql, params);
    return result.rows[0];
  }

  // 3. DELETE Product
  static async deleteProduct(id: number) {
    const sql = 'DELETE FROM products WHERE id = $1';
    // 👇 FIXED: Changed 'pool.query' to 'query'
    await query(sql, [id]);
    return { message: 'Product deleted' };
  }

  // 4. UPDATE Product
  static async updateProduct(id: number, data: any) {
    const sql = `
      UPDATE products 
      SET name = COALESCE($1, name),
          price = COALESCE($2, price),
          stock_quantity = COALESCE($3, stock_quantity),
          category = COALESCE($4, category),
          description = COALESCE($5, description)
      WHERE id = $6
      RETURNING id, name, price, stock_quantity as stock, category, description
    `;

    const params = [
      data.name, 
      data.price, 
      data.stock, 
      data.category,
      data.description,
      id
    ];

    // 👇 FIXED: Changed 'pool.query' to 'query'
    const result = await query(sql, params);
    return result.rows[0];
  }
}