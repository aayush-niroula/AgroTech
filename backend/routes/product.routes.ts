import express, { Request, Response } from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getRecommendedProducts,
  getProducts,
  incrementProductView,
} from '../controllers/product.controller';
import { upload } from '../middleware/multer';

const productRoutes = express.Router();

productRoutes.post('/',upload.single('image'), async(req:Request,res:Response)=>{
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
productRoutes.get('/search' ,async(req:Request,res:Response)=>{
    getProducts(req,res)
})
productRoutes.get('/recommendations' ,async(req:Request,res:Response)=>{
    getRecommendedProducts(req,res)
})
productRoutes.get('/:productId/view' ,async(req:Request,res:Response)=>{
    incrementProductView(req,res)
})

export default productRoutes;