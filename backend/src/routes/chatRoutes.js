import { Router } from "express";
import { authenticateJWT } from "../middlewares/authenticateJWT.js";

const router = Router();
router.get("/status", authenticateJWT(), (_req, res) => res.json({ ok: true, room: "global" }));
export default router;
