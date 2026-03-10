const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

const isAuthenticated = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ error: 'Authentication required' });

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

const isAdmin = async (req, res, next) => {
    try {
        if (req.user && req.user.isAdmin) {
            // Legacy hardcoded admin support
            return next();
        }

        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied: Administrators only' });
        }

        // Attach full user object if needed later
        req.dbUser = user;
        next();
    } catch (error) {
        res.status(500).json({ error: 'Server error checking admin privileges' });
    }
};

module.exports = { isAuthenticated, isAdmin };
