// /server/db/mongo.js

import mongoose from 'mongoose'; // ⬅️ FIX: Use import instead of require

const connectDB = async () => {
    try {
        // Mongoose automatically handles connection pools and deprecated options now
        await mongoose.connect(process.env.MONGO_URI); 
        
        console.log('✅ MongoDB connected');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        // Exit the process on database failure
        process.exit(1); 
    }
};

export default connectDB; // ⬅️ FIX: Use export default instead of module.exports