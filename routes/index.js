import express from "express";
import { addUrl } from "../controllers/tasksController.js";

const router = express.Router();

router.post("/add-url", addUrl);

export default router;
