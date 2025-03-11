import pool from "../../db";
// import { Item } from "../../interfaces/inventory/inventory.interface";
import { InventoryInput } from "../../validation/inventory";

export const addInventory = async (item: InventoryInput) => {
    try {
        const query = "insert into inventory (name, quantity, price) values ($1, $2, $3) returning *";
        const values = [item.name, item.quantity, item.price];
        const result: any = await pool.query(query, values);
        console.log("res--->", result);

        console.log("Adding item to inventory:", item);
        return {
            message: "data inserted successfully.",
            item: result.rows[0],
        }
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to insert data");
    }
}

export const getInventory = async () => {
    try {
        const query = "select * from inventory";
        const query2 = "select count(*) as rowCount from inventory";
        const result: any = await pool.query(query);
        const rowCount: any = await pool.query(query2);
        // console.log("row--->", rowCount.rows[0].rowcount);
        // console.log("res--->", rowCount);

        return {
            message: "inventory data fetched successfully",
            count: rowCount.rows[0].rowcount,
            items: result.rows,
        };

    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to insert data");
    }
}

export const editInventory = async (item: InventoryInput, id: unknown) => {
    try {
        const query = "update inventory set name = $1, quantity = $2, price = $3 where id = $4 RETURNING *";
        const values = [item.name, item.quantity, item.price, id];
        const result: any = await pool.query(query, values);
        // console.log("res--->", result);

        return {
            message: "data updated successfully",
            item: result.rows[0],
        };
    } catch (error) {
        throw new Error("Failed to update data");
        // return "error";
    }
}

export const deleteInventory = async (id: unknown) => {
    try {
        const query = "delete from inventory where id = $1 returning *";
        const values = [id];
        const result: any = await pool.query(query, values);
        // console.log("res--->", result);

        return {
            message: "data deleted successfully",
            item: result.rows[0],
        };
    } catch (error) {
        throw new Error("Failed to delete data");
        // return "error";
    }
}