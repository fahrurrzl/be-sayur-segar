import express from "express";
import authController from "../controller/auth.controller";
import authMiddleware from "../middleware/auth.middleware";
import sellerController from "../controller/seller.controller";
import productController from "../controller/product.controller";
import { uploadSingle } from "../middleware/media.middleware";
import mediaController from "../controller/media.controller";
import categoryController from "../controller/category.controller";
import roleMiddleware from "../middleware/role.middleware";
import cartController from "../controller/cart.controller";
import orderController from "../controller/order.controller";
import walletController from "../controller/wallet.controller";
const router = express.Router();

// Auth
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.post("/auth/login-admin", authController.loginAdmin);
router.get("/auth/me", authMiddleware, authController.me);
router.put("/auth/update", authMiddleware, authController.update);

// Seller
router.post("/seller", authMiddleware, sellerController.create);
router.get("/seller", sellerController.index);
router.get("/seller/me", authMiddleware, sellerController.me);
router.put("/seller", authMiddleware, sellerController.update);
router.get("/seller/:id", sellerController.show);
router.delete("/seller", authMiddleware, sellerController.delete);

// Product
router.post("/product", authMiddleware, productController.create);
router.get("/product", productController.index);
router.get("/product/:id", productController.show);
router.put("/product/:id", authMiddleware, productController.update);
router.delete("/product/:id", authMiddleware, productController.delete);

// Media
router.post(
  "/media/upload",
  [authMiddleware, uploadSingle("image")],
  mediaController.upload
);
router.delete("/media/delete", authMiddleware, mediaController.delete);

// Category
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

// Cart
router.post("/cart", authMiddleware, cartController.create);
router.get("/cart", authMiddleware, cartController.index);
router.delete("/cart", authMiddleware, cartController.destroy);
router.put("/cart/increase", authMiddleware, cartController.increase);
router.put("/cart/decrease", authMiddleware, cartController.decrease);

// Order
router.post("/order", authMiddleware, orderController.create);
router.post("/order/webhook", orderController.webhook);
router.get("/order", authMiddleware, orderController.index);
router.get("/order/seller", authMiddleware, orderController.sellerIndex);
router.get("/order/user", authMiddleware, orderController.userIndex);

// Wallet
router.post("/wallet", authMiddleware, walletController.create);

export default router;
