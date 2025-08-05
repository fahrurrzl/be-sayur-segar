import express from "express";
import authController from "../controller/auth.controller";
import authMiddleware from "../middleware/auth.middleware";
import sellerController from "../controller/seller.controller";
const router = express.Router();

router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.get("/auth/me", authMiddleware, authController.me);

router.post("/seller", authMiddleware, sellerController.create);
router.get("/seller", sellerController.index);
router.get("/seller/me", authMiddleware, sellerController.me);
router.put("/seller", authMiddleware, sellerController.update);
router.get("/seller/:id", sellerController.show);
router.delete("/seller", authMiddleware, sellerController.delete);

export default router;
