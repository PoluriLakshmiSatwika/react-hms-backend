import jwt from "jsonwebtoken";
import Nurse from "../models/Nurse.js";


export const protectNurse = async (req, res, next) => {
  let token = req.headers.authorization?.split(" ")[1];

  if (!token)
    return res.status(401).json({ success: false, message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.nurse = await Nurse.findById(decoded.id).select("-password");

    if (!req.nurse)
      return res.status(404).json({ success: false, message: "Nurse not found" });

    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};
export const verifyToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next(); // Proceed to next middleware or route
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
