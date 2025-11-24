// /server/controllers/vaultController.js

// Model imports with fallback for ES/CommonJS compatibility
import * as VaultModel from "../models/VaultItem.js";
import * as QRTokenModel from "../models/QRToken.js";
const VaultItem = VaultModel.default || VaultModel;
const QRToken = QRTokenModel.default || QRTokenModel;

import { encrypt, decrypt } from "../utils/encryption.js";
import crypto from "crypto";
import qrcode from "qrcode";

// Token expiry (5 minutes)
const QR_TOKEN_EXPIRY_SECONDS = 300;

// Generate a short URL-safe token
const generateShortToken = () => crypto.randomBytes(16).toString("base64url");

/* ------------------------------------------------------
   SAVE CREDENTIAL
   POST /api/vault/save
------------------------------------------------------ */
export const saveCredential = async (req, res) => {
  const userId = req.user.userId;
  const { title, username, password, notes, expiry } = req.body;

  try {
    if (!title || !username || !password) {
      return res
        .status(400)
        .json({ message: "Title, username, and password are required." });
    }

    const newCredential = new VaultItem({
      userId,
      title,
      username: encrypt(username),
      password: encrypt(password),
      notes: notes ? encrypt(notes) : { content: "", iv: "", authTag: "" },
      expiry: expiry || null,
    });

    await newCredential.save();

    res.status(201).json({
      message: "Credential saved successfully.",
      credentialId: newCredential._id,
    });
  } catch (err) {
    console.error("Save credential failed:", err);
    res
      .status(500)
      .json({ message: "Failed to save credential.", error: err.message });
  }
};

/* ------------------------------------------------------
   GET USER CREDENTIAL LIST (METADATA)
   GET /api/vault/
------------------------------------------------------ */
export const getCredentials = async (req, res) => {
  try {
    const userId = req.user.userId;

    const credentials = await VaultItem.find({ userId }).select(
      "title expiry createdAt"
    );

    res.status(200).json(credentials);
  } catch (err) {
    console.error("Fetch credentials failed:", err);
    res.status(500).json({ message: "Failed to fetch credentials." });
  }
};

/* ------------------------------------------------------
   GENERATE QR TOKEN + IMAGE
   POST /api/vault/generate-qr
------------------------------------------------------ */
export const generateQR = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { credentialId } = req.body;

    // User must own this credential
    const credential = await VaultItem.findOne({ _id: credentialId, userId });
    if (!credential) {
      return res
        .status(404)
        .json({ message: "Credential not found or access denied." });
    }

    // Create unique short-lived token
    const shortToken = generateShortToken();
    const expiresAt = new Date(Date.now() + QR_TOKEN_EXPIRY_SECONDS * 1000);

    // Save the token
    await new QRToken({
      token: shortToken,
      credentialId,
      userId,
      singleUse: true,
      expiresAt,
    }).save();

    // IMPORTANT: Use PUBLIC_URL for deployment + localhost
    const baseUrl = process.env.PUBLIC_URL || "http://localhost:5000";
    const viewUrl = `${baseUrl}/api/vault/view/${shortToken}`;

    // Generate QR image
    const qrCodeDataURL = await qrcode.toDataURL(viewUrl);

    res.status(200).json({
      message: "QR generated successfully",
      qrCode: qrCodeDataURL,
      url: viewUrl,
      expiresAt,
      expirySeconds: QR_TOKEN_EXPIRY_SECONDS,
    });
  } catch (err) {
    console.error("QR Generation failed:", err);
    res
      .status(500)
      .json({ message: "QR generation failed", error: err.message });
  }
};

/* ------------------------------------------------------
   VIEW TOKEN (PUBLIC)
   GET /api/vault/view/:token
------------------------------------------------------ */
export const viewToken = async (req, res) => {
  try {
    const { token } = req.params;

    const qrToken = await QRToken.findOne({ token }).populate("credentialId");

    if (!qrToken) {
      return res
        .status(404)
        .json({ message: "Token invalid, already used, or expired." });
    }

    const credential = qrToken.credentialId;

    // Decrypt values
    const decrypted = {
      title: credential.title,
      username: decrypt(credential.username),
      password: decrypt(credential.password),
      notes: credential.notes?.content ? decrypt(credential.notes) : "",
      expiry: credential.expiry,
    };

    // Single-use token: delete after viewing
    await QRToken.deleteOne({ _id: qrToken._id });

    res.status(200).json(decrypted);
  } catch (err) {
    console.error("View token failed:", err);
    res.status(500).json({
      message: "Failed to open token.",
      error: err.message,
    });
  }
};
