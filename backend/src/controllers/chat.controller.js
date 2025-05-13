import { generateStreamToken } from "../lib/stream.js";
import mongoose from "mongoose";

// Debug endpoint to check auth headers and cookies
export function debugAuth(req, res) {
  const authHeader = req.headers.authorization;
  const jwtCookie = req.cookies.jwt;

  res.status(200).json({
    hasAuthHeader: authHeader ? true : false,
    hasCookie: jwtCookie ? true : false
  });
}

// Get Stream Chat token for normal chat functionality (migrated from Go)
export async function getChatToken(req, res) {
  try {
    const token = generateStreamToken(req.user.id);
    
    res.status(200).json({ token });
  } catch (error) {
    console.log("Error in getChatToken controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Save chat message (migrated from Go)
export async function saveMessage(req, res) {
  try {
    const { content, roomId } = req.body;
    
    if (!content || !roomId) {
      return res.status(400).json({ message: "Content and roomId are required" });
    }
    
    // Create a message object
    const message = {
      _id: new mongoose.Types.ObjectId(),
      content,
      userId: req.user.id,
      roomId,
      createdAt: new Date()
    };
    
    // For now, we're just returning success
    // In a future update, this could save to MongoDB
    
    res.status(201).json(message);
  } catch (error) {
    console.log("Error in saveMessage controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// This function is used for video calls
export async function getStreamToken(req, res) {
  try {
    const token = generateStreamToken(req.user.id);

    res.status(200).json({ token });
  } catch (error) {
    console.log("Error in getStreamToken controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
