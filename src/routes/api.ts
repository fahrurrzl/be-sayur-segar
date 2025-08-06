import express from "express";
import authController from "../controller/auth.controller";
import authMiddleware from "../middleware/auth.middleware";
import sellerController from "../controller/seller.controller";
import productController from "../controller/product.controller";
import { uploadSingle } from "../middleware/media.middleware";
import mediaController from "../controller/media.controller";
import categoryController from "../controller/category.controller";
import roleMiddleware from "../middleware/role.middleware";
const router = express.Router();

router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.post("/auth/login-admin", authController.loginAdmin);
router.get("/auth/me", authMiddleware, authController.me);

router.post("/seller", authMiddleware, sellerController.create);
router.get("/seller", sellerController.index);
router.get("/seller/me", authMiddleware, sellerController.me);
router.put("/seller", authMiddleware, sellerController.update);
router.get("/seller/:id", sellerController.show);
router.delete("/seller", authMiddleware, sellerController.delete);

router.post("/product", authMiddleware, productController.create);
router.get("/product", productController.index);
router.get("/product/:id", productController.show);
router.put("/product/:id", authMiddleware, productController.update);
router.delete("/product/:id", authMiddleware, productController.delete);

router.post(
  "/media/upload",
  [authMiddleware, uploadSingle("image")],
  mediaController.upload
);
router.delete("/media/delete", authMiddleware, mediaController.delete);

router.post(
  "/category",
  [authMiddleware, roleMiddleware(["superadmin"])],
  categoryController.create
);
router.get("/category", categoryController.index);
router.get("/category/:id", categoryController.show);
router.put(
  "/category/:id",
  [authMiddleware, roleMiddleware(["superadmin"])],
  categoryController.update
);
router.delete(
  "/category/:id",
  [authMiddleware, roleMiddleware(["superadmin"])],
  categoryController.delete
);

export default router;
