import { Request, Response } from 'express';
import { InventoryService } from '../services/inventory.services';

// 1. Get Products
export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await InventoryService.getProducts();
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching products' });
  }
};

// 2. Create Product
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, price, stock } = req.body;

    // Validation
    if (!name || !price || stock === undefined) {
      return res.status(400).json({ message: 'Name, price, and stock are required' });
    }

    // Call Service (Passes 3 arguments)
    const newProduct = await InventoryService.createProduct(name, price, stock);
    
    res.status(201).json(newProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating product' });
  }
};