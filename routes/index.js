import express from "express";
import { addUrl, removeUrl } from "../controllers/tasksController.js";

const router = express.Router();

router.post("/add-url", addUrl);
router.post("/remove-url", removeUrl);

export default router;
