// /server/db/mongo.js
import mongoose from 'mongoose';

export default async function connectDB() {
  const raw = process.env.MONGO_URI || 'MONGO_URI_NOT_SET';

  function mask(uri) {
    try {
      // mask password between ://user: and @
      return uri.replace(/(\/\/.*:)(.*?)(@)/, (m, a, b, c) => a + '***MASKED***' + c);
    } catch (e) {
      return 'MASK_ERROR';
    }
  }

  console.log('🔎 DEBUG — MONGO_URI (masked):', mask(raw));
  console.log('🔎 DEBUG — Node Version:', process.version);
  console.log('🔎 DEBUG — Working Directory:', process.cwd());

  try {
    // shorter timeout so errors appear quickly in logs
    await mongoose.connect(raw, { connectTimeoutMS: 10000 });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ Mongo connect failed (message):', err && err.message ? err.message : err);
    console.error('❌ Mongo connect failed (stack):', err && err.stack ? err.stack : err);
    // rethrow so index.js sees it and process exits as before
    throw err;
  }
}
