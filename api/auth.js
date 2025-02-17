import jwt from 'jsonwebtoken';

export default function authenticateToken(req) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        throw new Error('No authorization header');
    }

    const token = authHeader.split(' ')[1];  

    if (!token) {
        throw new Error('No token found');
    }

    try {
        const user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        return user;
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
}
