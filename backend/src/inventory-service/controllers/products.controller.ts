import { Request, Response } from 'express';
import { ProductService } from '../services/product.services';

// 1. GET ALL PRODUCTS
export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await ProductService.getAllProducts();
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// 2. CREATE PRODUCT
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, price, stock, category, description } = req.body;

    // Basic Validation
    if (!name || !price || stock === undefined) {
      return res.status(400).json({ message: 'Name, Price, and Stock are required' });
    }

    const newProduct = await ProductService.createProduct({
      name,
      price,
      stock,
      category,
      description,
      business_id: 1 // Default to 1
    });

    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// 3. DELETE PRODUCT (New!)
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    await ProductService.deleteProduct(id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// 4. UPDATE PRODUCT (New!)
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    // Pass the entire body as updates (e.g. { stock: 45 })
    const updatedProduct = await ProductService.updateProduct(id, req.body);
    
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};