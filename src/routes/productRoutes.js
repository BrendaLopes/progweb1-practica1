import { Router } from "express";
import { list, create, getOne, update, remove } from "../controllers/product.controller.js";
import { authenticateJWT } from "../middleware/authenticateJWT.js";

const router = Router();

router.get("/", authenticateJWT(), list);
router.get("/:id", authenticateJWT(), getOne);

router.post("/", authenticateJWT("admin"), create);
router.put("/:id", authenticateJWT("admin"), update);
router.delete("/:id", authenticateJWT("admin"), remove);

export default router;
