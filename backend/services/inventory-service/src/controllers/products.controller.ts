import { Request, Response } from 'express';
import { ProductService } from '../services/product.services';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await ProductService.getAllProducts();
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, price, stock, category } = req.body;

    // Basic Validation
    if (!name || !price || stock === undefined) {
      return res.status(400).json({ message: 'Name, Price, and Stock are required' });
    }

    const newProduct = await ProductService.createProduct({
      name,
      price,
      stock,
      category,
      business_id: 1 // Default to 1
    });

    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};