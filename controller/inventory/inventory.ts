import { Request, Response } from "express";
import { addInventory, getInventory, editInventory, deleteInventory } from "../../services/inventory/inventory"
import { inventorySchema } from "../../validation/inventory";
import { Item } from "../../interfaces/inventory/inventory.interface";

export const addInventoryFn = async (req: Request, res: Response) => {
    try {
        let obj = req.body;
        const parsedData: Item = inventorySchema.parse(obj);
        const data = await addInventory(parsedData);
        res.status(200).json({ success: true, data: data });
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ error: error });
        } else {
            res.status(500).json({ error: "error not inserted" });
        }
    }
}

export const getInventoryFn = async (req: Request, res: Response) => {
    try {
        const data: any = await getInventory();
        res.status(200).json({ success: true, data: data });
    } catch (error) {
        res.status(500).json({ error: "error not inserted" });
    }
}

export const editInventoryFn = async (req: Request, res: Response): Promise<void> => {
    try {
        const parsedData = inventorySchema.parse(req.body);
        // const parsedData: Item = inventorySchema.parse(req.body);
        const id = req.params.id;
        const data: unknown = await editInventory(parsedData, id);
        res.status(200).json({ success: true, data: data });
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ error: error });
        } else {
            res.status(500).json({ error: "error not updated" });
        }
    }
}

export const deleteInventoryFn = async (req: Request, res: Response): Promise<void> => {
    try {
        // const parsedData = inventorySchema.parse(req.body);
        const id = req.params.id;
        const data: unknown = await deleteInventory(id);
        res.status(200).json({ success: true, data: data });
    } catch (error) {
        res.status(500).json({ error: "error not inserted" });
    }
}