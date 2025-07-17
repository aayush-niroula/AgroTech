import { Router} from "express";
import { Request, Response } from "express";

import { registerUser, loginUser, getUserProfile } from "../controllers/user.controller";

export const userRoutes=Router();

userRoutes.post('/register', async (req: Request, res: Response) => {
  await registerUser(req, res);
});

userRoutes.post('/login', async (req: Request, res: Response) => {
  await loginUser(req, res);
});
userRoutes.get('/:userId',async (req: Request, res: Response) => {
  await getUserProfile(req, res);
} )


