export interface IReply {
  _id: string;
  user: { _id: string; name: string };
  comment: string;
  createdAt: string;
}

export interface IReview {
  _id: string;
  product: string;
  user: { _id: string; name: string };
  rating: number;
  comment: string;
  replies: IReply[];
  createdAt: string;
  updatedAt: string;
}
