export interface Register{
  name: string;
  email: string;
  password?: string;
  avatarUrl?: string;
}
declare global {
  namespace Express {
    interface Request {
      userId?: string;  // Add the userId property here
    }
  }
}