export interface Register{
  name: string;
  email: string;
  password?: string;
  avatarUrl?: string;
}
declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        name?: string;
        email?: string;
      };
    }
  }
}