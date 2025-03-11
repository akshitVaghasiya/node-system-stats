import { Router } from "express";
import { addInventoryFn, getInventoryFn, editInventoryFn, deleteInventoryFn } from "../../controller/inventory/inventory";

const router = Router();

router.post("/", addInventoryFn);
router.get("/", getInventoryFn);
router.put("/:id", editInventoryFn);
router.delete("/:id", deleteInventoryFn);

export default router;