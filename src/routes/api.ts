import express from "express";
import dummyController from "../controller/dummy.controller";
const router = express.Router();

router.get("/", dummyController.dummy);

export default router;
