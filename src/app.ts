import express, { Application } from "express";
import cors from "cors"
import router from "./router/index.router";





const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use("/",router)





export default app;