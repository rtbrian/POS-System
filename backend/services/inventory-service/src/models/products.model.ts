export interface Product {
    id?: number;
    business_id: number;
    name: string;
    description?: string;
    price: number;
    stock_quantity: number;
    category?: string;
    barcode?: string;
    created_at?: Date;
  }