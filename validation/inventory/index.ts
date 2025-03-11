import { z } from "zod";

export const inventorySchema = z.object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string().min(2, "Name must be at least 2 characters"),
    quantity: z.number().int().min(1, "Quantity must be at least 1").transform(Number),
    price: z.number().positive("Price must be greater than 0").transform(Number),
});

export type InventoryInput = z.infer<typeof inventorySchema>;