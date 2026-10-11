import jwt from 'jsonwebtoken';

export const verifyOwner = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({
                message: '🔒 You need to be logged in. Please provide a valid token.'
            });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );
        if (decoded.role !== 'owner') {
            return res.status(403).json({
                message: '⛔ Owner access required. You do not have permission to do this.'
            });
        }
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            message: '⛔ Your session has expired. Please log in again.'
        });
    }
};