// /server/utils/encryption.js
import crypto from "crypto";

// ⚠️ IMPORTANT: Must be 64-character hex (32 bytes) - Fetch this from .env
const ENCRYPTION_KEY_HEX = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY_HEX || ENCRYPTION_KEY_HEX.length !== 64) {
    console.error(
        "❌ SECURITY ERROR: ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Check your .env file."
    );
    process.exit(1);
}

const ENCRYPTION_KEY = Buffer.from(ENCRYPTION_KEY_HEX, "hex");

const IV_LENGTH = 16; // AES-256-GCM

/**
 * Encrypts text using AES-256-GCM, returning the content, IV, and Auth Tag.
 */
export function encrypt(text) {
    if (text === null || text === undefined) return null;

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);

    let encrypted = cipher.update(String(text), "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return {
        content: encrypted,
        iv: iv.toString("hex"),
        authTag: authTag.toString("hex"),
    };
}

/**
 * Decrypts AES-256-GCM encrypted object.
 */
export function decrypt(encryptedObject) {
    const { content, iv, authTag } = encryptedObject;

    if (!content || !iv || !authTag) {
        throw new Error(
            "Decryption Error: Missing content, IV, or authentication tag"
        );
    }

    const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        ENCRYPTION_KEY,
        Buffer.from(iv, "hex")
    );

    decipher.setAuthTag(Buffer.from(authTag, "hex"));

    let decrypted = decipher.update(content, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}