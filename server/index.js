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
const FRONTEND_URL_RAW = (process.env.FRONTEND_URL || "").trim();
const PORT = process.env.PORT || 5000;

/* ------------------------------------------------------
   Sanitize FRONTEND_URL (handle cases where user pasted "FRONTEND_URL = https://...")
------------------------------------------------------ */
const FRONTEND_URL = FRONTEND_URL_RAW.replace(/^\s*FRONTEND_URL\s*=\s*/i, "").trim();

/* ------------------------------------------------------
   CORS POLICY (Simple, Clean, Localhost + Deployment)
------------------------------------------------------ */
const allowedOrigins = [
  "http://localhost:5173",      // Vite front-end (dev)
  "http://localhost:4173",      // fallback port
  "http://localhost:5000",      // backend local
];

// If FRONTEND_URL env var is provided and not empty, prefer that (sanitized above)
if (FRONTEND_URL) {
  allowedOrigins.push(FRONTEND_URL);
}

// Explicitly allow Vercel frontend as a fallback (safe to include)
allowedOrigins.push("https://secure-qr-vault-frontend.vercel.app");

console.log("CORS — allowed origins:", allowedOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Do NOT throw an error here. Return false so the cors middleware
    // does not set CORS headers for disallowed origins (browser will block).
    return callback(null, false);
  },
  credentials: true, // set true only if you use cookies/sessions cross-site
  exposedHeaders: ["Authorization"],
};

// Use '/*' for wildcard so path parser won't throw; handle preflight via cors middleware
app.options("/*", cors(corsOptions));
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
    // mount routes after successful DB connection
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
      } else {
        console.log("ℹ️ FRONTEND_URL not set; Vercel frontend is allowed by default in allowedOrigins.");
      }
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err && err.message ? err.message : err);
    process.exit(1);
  });
