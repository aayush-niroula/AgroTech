import { Request, Response } from "express";
import Testimonial from "../models/testimonial.model";


export const getTestimonials = async (req: Request, res: Response) => {
  try {
    const testimonials = await Testimonial.find().populate('userId','name role')
    res.status(200).json({ success: true, data: testimonials });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


export const getTestimonialById = async (req: Request, res: Response) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial)
      return res.status(404).json({ success: false, message: "Not Found" });
    res.status(200).json({ success: true, data: testimonial });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


export const createTestimonial = async (req: Request, res: Response) => {
  try {
    const userId = req.userId; 
    const { name, role, content, rating, location } = req.body;
    const newTestimonial = await Testimonial.create({
      userId,
      name,
      role,
      content,
      rating,
      location,
    });
    res.status(201).json({ success: true, data: newTestimonial });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


export const deleteTestimonial = async (req: Request, res: Response) => {
  try {
    const userId = req.userId; 
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial)
      return res.status(404).json({ success: false, message: "Not Found" });

    if (testimonial.userId.toString() !== userId)
      return res.status(403).json({ success: false, message: "Forbidden" });

    await testimonial.deleteOne();
    res.status(200).json({ success: true, message: "Testimonial deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


export const updateTestimonial = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial)
      return res.status(404).json({ success: false, message: "Not Found" });

    if (testimonial.userId.toString() !== userId)
      return res.status(403).json({ success: false, message: "Forbidden" });

    const { name, role, content, rating, location } = req.body;
    testimonial.name = name || testimonial.name;
    testimonial.role = role || testimonial.role;
    testimonial.content = content || testimonial.content;
    testimonial.rating = rating || testimonial.rating;
    testimonial.location = location || testimonial.location;

    await testimonial.save();
    res.status(200).json({ success: true, data: testimonial });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
