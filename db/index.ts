import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT)
});

pool.query("select 1", (err, res)=> {
    if(err) {
        console.log("database connection error", err);
    }else{
        console.log("database connected");
    }
});

export default pool;