import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getStreamToken, getChatToken, saveMessage, debugAuth } from "../controllers/chat.controller.js";

const router = express.Router();

// Debug route for checking auth
router.get("/debug", debugAuth);

// Token routes 
router.get("/token", protectRoute, getChatToken);

// Message routes
router.post("/messages", protectRoute, saveMessage);

export default router;
