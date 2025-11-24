// /server/models/User.js

import mongoose from 'mongoose'; // ⬅️ FIX: Use import instead of require

const userSchema = new mongoose.Schema({
    name: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
        required: true
    }
}, { timestamps: true });

// ⬅️ FIX: Use export default instead of module.exports
export default mongoose.model('User', userSchema);