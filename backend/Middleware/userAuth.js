import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    const authHeaders = req.headers.authorization

    if(!authHeaders || !authHeaders.startsWith('Bearer ')){
        return res.status(401).json({
            message: '🔒 You need to be logged in. Please provide a valid token.'
        })
    }
    const tokens = authHeaders.split(' ')[1];
    try{
        const decoded = jwt.verify(tokens, process.env.JWT_SECRET);
        req.User = decoded;
        next();
    }
    catch(err){
        res.status(401).json({
            message: "⛔ Your session has expired. Please log in again.",
        });
    }
}