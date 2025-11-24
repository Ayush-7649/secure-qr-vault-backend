// /server/middleware/auth.js
import jwt from 'jsonwebtoken';

// ✅ Verify JWT and attach user info to req.user
// EXPORT FIX: Added the 'export' keyword
export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied: token missing' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Ensure you use 'userId' here as it's what the controllers expect
        req.user = { userId: decoded.userId, role: decoded.role }; 
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Access denied: invalid or expired token' });
    }
}

// ✅ Role-based access control middleware
// EXPORT FIX: Added the 'export' keyword
export function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        next();
    };
}

// 🛑 REMOVED: module.exports = { authenticateToken, authorizeRoles };
// The functions are now exported inline using 'export function'