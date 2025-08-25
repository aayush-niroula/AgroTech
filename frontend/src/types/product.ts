

export interface Seller {
  _id: string;
  name: string;
  email: string;
  password?: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface Location {
  type: 'Point';
  coordinates: [number, number];
}

export interface IProduct {
  _id: string;
  title: string;
  description: string;
  price: number;
  brand: string;
  category: string;
  favorites: number;
  imageUrl: string;
  location: Location;
  quantity: number;
  rating: number;
  sellerId: string | Seller;
  soldCount: number;
  updatedAt: string;
  createdAt: string;
  views: number;
  weight: number;
  reviewCount:number;
  __v: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
