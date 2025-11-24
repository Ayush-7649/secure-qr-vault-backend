// /server/routes/vaultRoutes.js
// Clean, production-safe Vault API routes

import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  saveCredential,
  getCredentials,
  generateQR,
  viewToken,
} from "../controllers/vaultController.js";

const router = express.Router();

/* ------------------------------------------------------
   PUBLIC ROUTE — used by QR viewer
   GET /api/vault/view/:token
------------------------------------------------------ */
router.get("/view/:token", async (req, res, next) => {
  try {
    if (!req.params?.token) {
      return res.status(400).json({ message: "Token required" });
    }
    return viewToken(req, res, next);
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------
   PROTECTED ROUTES — require JWT
------------------------------------------------------ */

// Save credential
// POST /api/vault/save
router.post("/save", authenticateToken, async (req, res, next) => {
  try {
    return saveCredential(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Get all credentials for logged-in user
// GET /api/vault/
router.get("/", authenticateToken, async (req, res, next) => {
  try {
    return getCredentials(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Generate QR for a credential
// POST /api/vault/generate-qr
router.post("/generate-qr", authenticateToken, async (req, res, next) => {
  try {
    return generateQR(req, res, next);
  } catch (err) {
    next(err);
  }
});

export default router;
