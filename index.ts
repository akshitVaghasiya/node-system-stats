import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import routes from "./api";
import cors from "cors";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

app.use(express.json());

app.use("/api", routes);

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript");
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});