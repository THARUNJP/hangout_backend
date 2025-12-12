import { Router } from "express";
import { healthz } from "../controller/health.router";
const router = Router();

router.get("/",healthz)

export default router;
