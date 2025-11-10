import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import nurseRoutes from "./routes/nurseRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import passwordRoutes from "./routes/passwordRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";

// ✅ Load environment variables ONCE
dotenv.config({ path: "./.env" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

// ✅ Debug log
console.log("🔍 Loaded MONGO_URL:", process.env.MONGO_URL);

const PORT = process.env.PORT || 8000;
const MONGOURL = process.env.MONGO_URL;

// ✅ Allowed origins
const allowedOrigins = [
  "https://polurilakshmisatwika.github.io",
  "https://react-hms-backend-2.onrender.com",
  "http://localhost:3000",
];

// ✅ Configure CORS
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// ✅ Connect MongoDB
mongoose
  .connect(MONGOURL, { dbName: "hms" }) // 👈 This line forces 'hms' explicitly
  .then(() => {
    console.log("✅ Database connected successfully to HMS");
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  })
  .catch((error) => console.log("❌ Database connection failed:", error));

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/nurse", nurseRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/appointment", appointmentRoutes);
app.use("/api/password", passwordRoutes);

// ✅ Test Route
app.get("/", (req, res) => {
  res.send("Backend is running!");
});
