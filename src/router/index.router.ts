import { Router } from "express";
import seesionRouter from "./session.router"
import healtRouter from "./health.router"

const router = Router();



router.use("/session",seesionRouter)
router.use("/healthz",healtRouter)









export default router
