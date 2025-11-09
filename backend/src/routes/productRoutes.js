import { Router } from "express";
import { list, create, getOne, update, remove } from "../controllers/product.controller.js";
import { authenticateJWT } from "../middlewares/authenticateJWT.js";

const router = Router();
router.get("/", list);
router.get("/:id", getOne);

router.post("/", authenticateJWT("admin"), create);
router.put("/:id", authenticateJWT("admin"), update);
router.delete("/:id", authenticateJWT("admin"), remove);

export default router;
