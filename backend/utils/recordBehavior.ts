import { UserBehavior } from "../models/product.model";


export const recordBehavior = async ({
  userId,
  productId,
  actionType,
}: {
  userId: string;
  productId: string;
  actionType: "view" | "favorite" | "chat";
}) => {
  try {
    await UserBehavior.create({ userId, productId, actionType });
  } catch (error) {
    console.error("Error recording behavior:", error);
  }
};
