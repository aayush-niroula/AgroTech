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
  incrementChatCount,
  recordProductViewBehavior,
  getPersonalizedRecommendations,
} from '../controllers/product.controller';
import { upload } from '../middleware/multer';
import { authMiddleware } from '../middleware/authMiddleware';

const productRoutes = express.Router();

// Specific routes first to avoid conflicts with dynamic routes
productRoutes.get('/search', async (req: Request, res: Response) => {
  getProducts(req, res); // FIXED: Moved before /:id to prevent misrouting
});
productRoutes.get('/recommendations', async (req: Request, res: Response) => {
  getRecommendedProducts(req, res);
});
productRoutes.get('/personalized', authMiddleware, async (req: Request, res: Response) => {
  getPersonalizedRecommendations(req, res);
});

// Dynamic and other routes
productRoutes.post('/', authMiddleware, upload.single('image'), async (req: Request, res: Response) => {
  createProduct(req, res); // FIXED: Added authMiddleware
});
productRoutes.get('/', async (req: Request, res: Response) => {
  getAllProducts(req, res);
});
productRoutes.get('/:id', async (req: Request, res: Response) => {
  getProductById(req, res);
});
productRoutes.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  updateProduct(req, res); // FIXED: Added authMiddleware
});
productRoutes.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  deleteProduct(req, res); // FIXED: Added authMiddleware
});
productRoutes.post('/:productId/view', async (req: Request, res: Response) => {
  incrementProductView(req, res);
});
productRoutes.post('/:productId/favorite', authMiddleware, async (req: Request, res: Response) => {
  toggleFavorite(req, res);
});
productRoutes.post('/:productId/chatCount', authMiddleware, async (req: Request, res: Response) => {
  incrementChatCount(req, res); // FIXED: Added authMiddleware
});
productRoutes.post('/:productId/record-view', authMiddleware, async (req: Request, res: Response) => {
  recordProductViewBehavior(req, res);
});

export default productRoutes;