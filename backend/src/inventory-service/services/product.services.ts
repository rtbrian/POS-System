import { query } from '../../postgres.client';
import { Product, ProductFilters, ProductInput, ProductPage } from '../models/products.model';

export class ProductService {
  static async getAllProducts(businessId: number, filters: ProductFilters): Promise<ProductPage> {
    const conditions = ['business_id = $1'];
    const values: Array<string | number> = [businessId];

    if (filters.search) {
      values.push(`%${filters.search}%`);
      conditions.push(`name ILIKE $${values.length}`);
    }
    if (filters.category) {
      values.push(filters.category);
      conditions.push(`category = $${values.length}`);
    }
    if (filters.stockStatus === 'out') {
      conditions.push('stock_quantity = 0');
    } else if (filters.stockStatus === 'low') {
      conditions.push('stock_quantity BETWEEN 1 AND 10');
    }

    const where = conditions.join(' AND ');
    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM products WHERE ${where}`,
      values,
    );
    const total = countResult.rows[0].total as number;
    const offset = (filters.page - 1) * filters.limit;
    const pageValues = [...values, filters.limit, offset];
    const result = await query(
      `SELECT id, business_id, name, price, stock_quantity AS stock, category, description
       FROM products
       WHERE ${where}
       ORDER BY id ASC
       LIMIT $${pageValues.length - 1} OFFSET $${pageValues.length}`,
      pageValues,
    );

    return {
      data: result.rows as Product[],
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  static async createProduct(businessId: number, data: ProductInput): Promise<Product> {
    const result = await query(
      `INSERT INTO products (business_id, name, price, stock_quantity, category, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, business_id, name, price, stock_quantity AS stock, category, description`,
      [
        businessId,
        data.name,
        data.price,
        data.stock,
        data.category ?? null,
        data.description ?? null,
      ],
    );
    return result.rows[0] as Product;
  }

  static async deleteProduct(id: number, businessId: number): Promise<boolean> {
    const result = await query(
      'DELETE FROM products WHERE id = $1 AND business_id = $2',
      [id, businessId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  static async updateProduct(
    id: number,
    businessId: number,
    data: ProductInput,
  ): Promise<Product | undefined> {
    const columns = {
      name: 'name',
      price: 'price',
      stock: 'stock_quantity',
      category: 'category',
      description: 'description',
    } as const;
    const updates: string[] = [];
    const values: Array<string | number | null> = [];

    for (const key of Object.keys(columns) as Array<keyof typeof columns>) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        values.push(data[key] ?? null);
        updates.push(`${columns[key]} = $${values.length}`);
      }
    }

    values.push(id, businessId);
    const result = await query(
      `UPDATE products
       SET ${updates.join(', ')}
       WHERE id = $${values.length - 1} AND business_id = $${values.length}
       RETURNING id, business_id, name, price, stock_quantity AS stock, category, description`,
      values,
    );
    return result.rows[0] as Product | undefined;
  }
}
