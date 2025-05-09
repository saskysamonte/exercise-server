/**
 * Authentication Middleware
 *
 * @since 1.0.0
 * @version 1.1.0
 * 
 * @author Sasky Samonte
 * 
 * @package https://www.npmjs.com/package/jsonwebtoken
 */

const jwt = require('jsonwebtoken');
const UserModel = require('../models/user/UserModel');
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_SECRET_REFRESH = process.env.JWT_SECRET_REFRESH;

/**
 * Middleware to authenticate user based on the JWT access token.
 * If the token is expired, attempts to refresh using a refresh token.
 */
const authenticate = async (req, res, next) => {
    // Extract access token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1]?.trim();
    // console.log('Access token:', token);
    // console.log('Refresh token:', req.headers['app-refresh-token']);

    // If no token is provided
    if (!token) {
        return res.status(401).json({ message: "Access denied. No access token provided." });
    }

    try {
        // Verify the JWT access token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Fetch user from the database based on the decoded username
        const user = await UserModel.findOne({ username: decoded.username });

        // If user doesn't exist
        if (!user) {
            return res.status(401).json({ message: "Invalid access token. User not found." });
        }

        // Attach the user object to the request for downstream middleware
        req.user = user;
        
        // Proceed to the next middleware
        return next(); 
    } catch (err) {
        // If the token is expired, attempt to refresh it using a refresh token
        if (err.name === 'TokenExpiredError') {
            console.log('Access token expired, attempting refresh token process.');

            // Extract refresh token from headers
            const refreshToken = req.headers['app-refresh-token']; 

            // If no refresh token is provided
            if (!refreshToken) {
                return res.status(401).json({ message: "Refresh token missing." });
            }

            try {
                // Verify the refresh token
                const decodedRefresh = jwt.verify(refreshToken, JWT_SECRET_REFRESH);

                // Fetch user based on the decoded refresh token username
                const user = await UserModel.findOne({ username: decodedRefresh.username });

                // If user doesn't exist or the refresh token doesn't match
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

                // Send new tokens in the response headers
                res.setHeader('app-new-access-token', newAccessToken);
                res.setHeader('app-refresh-token', refreshToken);
                console.log('New access token generated and sent.');

                // Attach the user object to the request and proceed
                req.user = user; 
                return next();
            } catch (refreshErr) {
                // Handle refresh token errors
                console.error('Error verifying refresh token:', refreshErr);
                return res.status(401).json({ message: "Invalid or expired refresh token." });
            }
        }

        // Handle other JWT errors (malformed token, etc.)
        console.error('Invalid token:', err);
        return res.status(401).json({ message: "Invalid or malformed token." });
    }
};

module.exports = authenticate;
