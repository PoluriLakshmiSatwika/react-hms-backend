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
import assignmentRoutes from "./routes/assignmentRoutes.js";
// ✅ Load environment variables ONCE
dotenv.config({ path: "./.env" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json());
app.use(express.json());
// ❌ remove this line → app.use(cors());

// ✅ Allowed origins
const allowedOrigins = [
  "https://polurilakshmisatwika.github.io",
  "https://react-hms-backend-2.onrender.com",
  "http://localhost:3000",
];

// ✅ Configure CORS properly
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
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ✅ Connect MongoDB
mongoose
  .connect(process.env.MONGO_URL, { dbName: "hms" })
  .then(() => {
    console.log("✅ Database connected successfully to HMS");
    app.listen(process.env.PORT || 8000, () => {
      console.log(`🚀 Server is running on port ${process.env.PORT || 8000}`);
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
app.use("/api/appointments", appointmentRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/assignments", assignmentRoutes);
// ✅ Test Route
app.get("/", (req, res) => {
  res.send("Backend is running!");
});
