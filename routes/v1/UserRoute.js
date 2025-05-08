/**
 * User Route
 *
 * @since 1.0.0
 * @version 1.0.0
 *
 * @author  Sasky Samonte
 * 
 * @package express https://www.npmjs.com/package/express
 * @package express-rate-limit https://www.npmjs.com/package/express-rate-limit
 *
 */

const express = require("express");
const rateLimit = require("express-rate-limit");
const authenticate = require("../../middlewares/authenticate.js");
const {
    authLogin,
    authRegister,
    authRefreshToken,
    authLogout,
    getProfile,
    updateProfile,
} = require("../../controllers/UserController.js");
const router = express.Router();

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15, // Max 5 login attempts per IP
    message: {
        status: 429,
        error: "Too many login attempts. Please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

router.get("/profile", authenticate, getProfile);

router.post("/auth/login", authLogin);
router.post("/auth/register", authRegister);
router.post("/auth/refresh-token", authRefreshToken);
router.post("/auth/logout", authenticate, authLogout);

router.put("/profile", authenticate, updateProfile);

module.exports = router;