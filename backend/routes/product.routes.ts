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
  toggleFavorite,
  incrementProductInterest,
  incrementChatCount,
  getBehaviorBasedRecommendations,
  recordProductViewBehavior,
} from '../controllers/product.controller';
import { upload } from '../middleware/multer';
import { authMiddleware } from '../middleware/authMiddleware';


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
productRoutes.post('/:productId/view' ,async(req:Request,res:Response)=>{
    incrementProductView(req,res)
})
productRoutes.post('/:productId/favorite',authMiddleware,async(req:Request,res:Response)=>{
    toggleFavorite(req,res)
})
productRoutes.post('/:productId/interest',authMiddleware,async(req:Request,res:Response)=>{
    incrementProductInterest(req,res)
})
productRoutes.post('/:productId/chatCount',async(req:Request,res:Response)=>{
    incrementChatCount(req,res)
})
productRoutes.get('/recommendations/behavior',authMiddleware,async(req:Request,res:Response)=>{
    getBehaviorBasedRecommendations(req,res)
})
productRoutes.post('/:productId/record-view',authMiddleware, async(req:Request,res:Response)=>{
    recordProductViewBehavior(req,res)
})


export default productRoutes;