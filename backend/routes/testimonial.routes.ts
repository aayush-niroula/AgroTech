import express, { Request, Response } from "express";

import { authMiddleware } from "../middleware/authMiddleware";
import { createTestimonial, deleteTestimonial, getTestimonialById, getTestimonials, updateTestimonial } from "../controllers/testimonial.controller";

const testimonialRoutes = express.Router();

testimonialRoutes.get("/", async (req: Request, res: Response) => {
  getTestimonials(req, res);
});

testimonialRoutes.get("/:id", async (req: Request, res: Response) => {
  getTestimonialById(req, res);
});


testimonialRoutes.post("/", authMiddleware, async (req: Request, res: Response) => {
  createTestimonial(req, res);
});
testimonialRoutes.put("/:id", authMiddleware, async (req: Request, res: Response) => {
  updateTestimonial(req, res);
});


testimonialRoutes.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  deleteTestimonial(req, res);
});

export default testimonialRoutes;
