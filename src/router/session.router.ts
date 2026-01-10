import { Router } from "express";
import {
  createSession,
  validateSessionByCode,
} from "../controller/session.controller";
const router = Router();

router.post("/create", createSession);
router.get("/:code", validateSessionByCode);

export default router;
