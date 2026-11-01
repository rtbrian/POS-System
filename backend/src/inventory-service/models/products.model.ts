export interface Product {
  id: number;
  business_id: number;
  name: string;
  price: number | string;
  stock: number;
  description: string | null;
  category: string | null;
}

export interface ProductInput {
  name: string;
  price: number;
  stock: number;
  category?: string | null;
  description?: string | null;
}

export interface ProductFilters {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  stockStatus?: 'low' | 'out';
}

export interface ProductPage {
  data: Product[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
