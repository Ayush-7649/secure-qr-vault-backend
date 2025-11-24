// /server/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";

// DB Connection
import * as DBModule from "./db/mongo.js";
const connectDB = DBModule.default || DBModule;

// Auth routes
import * as AuthModule from "./routes/auth.js";
const authRoutes = AuthModule.default || AuthModule;

// Vault routes (QR generation + view)
import vaultRoutes from "./routes/vaultRoutes.js";

const app = express();

const NODE_ENV = process.env.NODE_ENV || "development";
const PUBLIC_URL = (process.env.PUBLIC_URL || "").trim();
const FRONTEND_URL = (process.env.FRONTEND_URL || "").trim();
const PORT = process.env.PORT || 5000;

/* ------------------------------------------------------
   CORS POLICY (Simple, Clean, Localhost + Deployment)
------------------------------------------------------ */
const allowedOrigins = [
  "http://localhost:5173",      // Vite front-end (dev)
  "http://localhost:4173",      // In case Vite uses fallback port
  "http://localhost:5000",      // Backend
];

// If frontend deployed, allow that too:
if (FRONTEND_URL) {
  allowedOrigins.push(FRONTEND_URL);
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Allow Postman, curl, etc.

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS: Origin not allowed → " + origin));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

/* ------------------------------------------------------
   Root Route
------------------------------------------------------ */
app.get("/", (req, res) => {
  res.send("🔐 Secure QR Vault backend is running");
});

/* ------------------------------------------------------
   Connect DB & Start Server
------------------------------------------------------ */
connectDB()
  .then(() => {
    app.use("/api/auth", authRoutes);
    app.use("/api/vault", vaultRoutes);

    app.listen(PORT, () => {
      console.log(`🚀 Backend running on http://localhost:${PORT}`);
      if (PUBLIC_URL) {
        console.log(`🔗 PUBLIC_URL = ${PUBLIC_URL}`);
      } else {
        console.log("⚠️ PUBLIC_URL is not set. Using localhost for QR links.");
      }
      if (FRONTEND_URL) {
        console.log(`🖥️ FRONTEND_URL allowed → ${FRONTEND_URL}`);
      }
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });
