// /server/models/QRToken.js
import mongoose from "mongoose";

// Token expires after 5 minutes (300 seconds)
const QR_TOKEN_EXPIRY_SECONDS = 300;

const QRTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  credentialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "VaultItem",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: QR_TOKEN_EXPIRY_SECONDS, // TTL index here only
  },
});

// ❌ REMOVED the duplicate QRTokenSchema.index({ createdAt: 1 }) line

export default mongoose.model("QRToken", QRTokenSchema);
