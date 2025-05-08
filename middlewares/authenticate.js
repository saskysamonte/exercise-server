/**
 * Authentication Middleware
 *
 * @since 1.0.0
 * @version 1.0.0
 * 
 * @author Sasky Samonte
 * 
 * @package https://www.npmjs.com/package/jsonwebtoken
 */ 
 

const jwt = require('jsonwebtoken');
const UserModel = require('../models/user/UserModel');
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_SECRET_REFRESH = process.env.JWT_SECRET_REFRESH;


const authenticate = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]?.trim();

    if (!token) {
        return res.status(401).json({ message: "Access denied. No access token provided." });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await UserModel.findOne({ username: decoded.username });

        if (!user) {
            return res.status(401).json({ message: "Invalid access token. User not found." });
        }

        req.user = user; 
        return next(); 
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            console.log('Access token expired, attempting refresh token process.');
            const refreshToken = req.headers['APP-REFRESH-TOKEN']; 

            if (!refreshToken) {
                return res.status(401).json({ message: "Refresh token missing." });
            }

            try {
                // Verify the refresh token
                const decodedRefresh = jwt.verify(refreshToken, JWT_SECRET_REFRESH);
                // console.log('Refresh token decoded:', decodedRefresh);

                // Check if the user exists
                const user = await UserModel.findOne({ username: decodedRefresh.username });
                if (!user || user.refreshToken !== refreshToken) {
                    console.log('User not found or refresh token mismatch.');
                    return res.status(401).json({ message: "Invalid user or refresh token." });
                }

                // Generate a new access token
                const newAccessToken = jwt.sign(
                    { username: user.username, email: user.email },
                    JWT_SECRET,
                    { expiresIn: '1h' } 
                );

                // Send the new access token in the response header
                res.setHeader('APP-NEW-ACCESS-TOKEN', newAccessToken);
                res.setHeader('APP-REFRESH-TOKEN', newAccessToken);
                console.log('New access token generated and sent.');
                req.user = user; 
                return next(); 
            } catch (refreshErr) {
                console.error('Error verifying refresh token:', refreshErr);
                return res.status(401).json({ message: "Invalid or expired refresh token." });
            }
        }
        // Handle any other JWT errors
        console.error('Invalid token:', err);
        return res.status(401).json({ message: "Invalid or malformed token." });
    }
};

module.exports = authenticate;