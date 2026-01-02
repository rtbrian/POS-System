import { Request, Response } from 'express';
import { InventoryService } from '../services/inventory.services';

export const createProduct = async (req: Request, res: Response) => {
  try {
    // In a real app, we get business_id from the User Token (req.user)
    // For now, we will assume Business ID = 1
    const businessId = 1; 
    
    const product = await InventoryService.createProduct({
      ...req.body,
      business_id: businessId
    });

    res.status(201).json({ message: 'Product created', product });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const businessId = 1; // Hardcoded for now
    const products = await InventoryService.getProducts(businessId);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};