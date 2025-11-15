import jwt from "jsonwebtoken";
import Nurse from "../models/Nurse.js";


export const protectNurse = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.nurse = await Nurse.findById(decoded.id).select("-password");
      next();
    } catch (err) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }
  }
  if (!token) {
    return res.status(401).json({ success: false, message: "Token missing" });
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
