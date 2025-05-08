/**
 * Maip App 
 * @since 1.0.0
 * @version 1.0.0
 *
 * @author  Sasky Samonte
 * 
 * @package express https://www.npmjs.com/package/express
 * @package mongoose https://www.npmjs.com/package/mongoose
 * @package cors https://www.npmjs.com/package/cors
 *
 */

require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const http = require("http");
const mongoose = require("mongoose");
const helmet = require("helmet");
const xss = require("xss");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");

const environment = process.env.ENVIRONMENT || "localhost";

// V1 Routes
const userRoute = require("./routes/v1/UserRoute.js");

// Initialize Express app and server
const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1); 

// --- Security Middleware ---

// Secure HTTP headers
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"]
    }
}));

// Body parser
app.use(express.json());
app.use(cookieParser());

// XSS Sanitizer Middleware
app.use((req, res, next) => {
    const sanitize = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = xss(obj[key]);
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitize(obj[key]); // recursively sanitize nested objects
            }
        }
    };

    if (req.body) sanitize(req.body);
    if (req.query) sanitize(req.query);
    if (req.params) sanitize(req.params);

    next();
});

// --- CORS Configuration ---
const allowedOrigins = [
    "http://localhost:3001", 
    "https://testapp.saskysamonte.com" 
];

app.use(
    cors({
        origin: function (origin, callback) {
            if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true, // Allow credentials like cookies or headers
    })
);

// --- Sessions with Secure Cookie Store ---
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl:
                environment === "production"
                    ? process.env.MONGO_DB_URI_PROD
                    : process.env.MONGO_DB_URI_DEV,
            ttl: 14 * 24 * 60 * 60, // 14 days session timeout
        }),
        cookie: { secure: environment === "production" }, // Ensure secure cookie in production
    })
);

// --- API Version Validation Middleware ---
const versionValidator = (req, res, next) => {
    const supportedVersions = ["v1"];
    if (!supportedVersions.includes(req.params.version)) {
        return res.status(404).json({ message: "API version not supported" });
    }
    next();
};

// --- Define Routes ---
app.use("/api/:version/users", versionValidator, userRoute);

// --- MongoDB Connection ---
let mongoURI =
  environment === "production"
    ? process.env.MONGO_DB_URI_PROD
    : process.env.MONGO_DB_URI_DEV;

mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("Connected to database!");
    const port = process.env.PORT || 3002;
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1);
  });
