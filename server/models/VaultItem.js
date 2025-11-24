// /server/models/VaultItem.js

import mongoose from 'mongoose';

// Define the schema for storing encrypted credentials
const VaultItemSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: { 
        type: String,
        required: true,
        trim: true
    },
    // --- Secure Encryption Structure ---
    username: {
        content: { type: String, required: true },
        iv: { type: String, required: true },
        authTag: { type: String, required: true }
    },
    password: {
        content: { type: String, required: true },
        iv: { type: String, required: true },
        authTag: { type: String, required: true }
    },
    notes: {
        content: { type: String }, 
        iv: { type: String },
        authTag: { type: String }
    },
    expiry: { 
        type: Date,
        default: null
    }
}, { timestamps: true });

// Change from module.exports to export default for ES module compatibility
export default mongoose.model('VaultItem', VaultItemSchema);