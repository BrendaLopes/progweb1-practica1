import { Router } from "express";
import authRoutes from "./authRoutes.js";
import productRoutes from "./productRoutes.js";
import chatRoutes from "./chatRoutes.js";

const router = Router();

router.get("/health", (_req, res) =>
  res.json({ ok: true, author: "Brenda Lopes", subject: "ProgWeb I" })
);

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/chat", chatRoutes);

export default router;
