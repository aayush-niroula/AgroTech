import express, { Request, Response } from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller';

const productRoutes = express.Router();

productRoutes.post('/', async(req:Request,res:Response)=>{
    createProduct(req,res)
});
productRoutes.get('/', getAllProducts);
productRoutes.get('/:id', async(req:Request,res:Response)=>{
    getProductById(req,res)
});
productRoutes.put('/:id', async(req:Request,res:Response)=>{
    updateProduct(req,res)
});
productRoutes.delete('/:id', async(req:Request,res:Response)=>{
    deleteProduct(req,res)
});

export default productRoutes;