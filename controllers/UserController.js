/**
 * User Controller
 *
 * Handles authentication (register, login, refresh token, logout, profile) and user-related operations.
 *
 * @since 1.0.0
 * @version 1.0.0
 *
 * @author  Sasky Samonte
 * 
 * @package bcryptjs https://www.npmjs.com/package/bcryptjs
 * @package jsonwebtoken https://www.npmjs.com/package/jsonwebtoken
 * @package uuid https://www.npmjs.com/package/uuid
 */


const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const UserModel = require("../models/user/UserModel");
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_SECRET_REFRESH = process.env.JWT_SECRET_REFRESH;

const getCsrfToken = (req, res) => {
    return res.status(200).json({ csrfToken: req.csrfToken() });
};

const generateAccessToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
};

const generateRefreshToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET_REFRESH, { expiresIn: "1d" });
};

const authLogin = async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            message: "Request body is empty",
            status: 400,
        });
    }

    const { login, password } = req.body;

    const missing_fields = [];

    if (!login) missing_fields.push("login");
    if (!password) missing_fields.push("password");

    if (missing_fields.length > 0) {
        console.error("Missing arguments:", missing_fields);
        return res.status(400).json({
            message: "One or more arguments are missing",
            missing_fields,
            status: 400,
        });
    }

    try {
        const user = await UserModel.findOne({ username: login });

        if (!user) {
            return res
                .status(401)
                .json({ message: "Your user ID and/or password does not match.", status: 401 });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res
                .status(401)
                .json({ message: "Your user ID and/or password does not match.", status: 401 });
        }

        const accessToken = generateAccessToken({
            username: user.username,
        });
        const refreshToken = generateRefreshToken({
            username: user.username,
        });

        user.refreshToken = refreshToken;
        await user.save();
        return res.status(200).json({
            message: "Login successful",
            status: 200,
            accessToken,
            refreshToken,
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Error logging in", status: 500 });
    }
};

const authRegister = async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            message: "Request body is empty",
            status: 400,
        });
    }

    const { username, password, confirm_password } = req.body;

    const missing_fields = [];

    if (!username) missing_fields.push("username");
    if (!password) missing_fields.push("password");
    if (!confirm_password) missing_fields.push("confirm_password");

    if (missing_fields.length > 0) {
        return res.status(400).json({
            message: "One or more arguments are missing",
            missing_fields,
            status: 400,
        });
    }

    if (password && confirm_password && password !== confirm_password) {
        return res.status(400).json({
            message: "Your passwords do not match.",
            status: 400,
        });
    }

    try {
        // Check if username already exists
        const existingUser = await UserModel.findOne({ username });

        if (existingUser) {
            return res.status(400).json({
                message: "User ID already exists",
                status: 400,
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user instance
        const newUser = new UserModel({
            username,
            password: hashedPassword,
            userId: uuidv4(),
        });

        // Save the new user to the database
        await newUser.save();

        // Generate access and refresh tokens
        const accessToken = generateAccessToken({
            username: newUser.username,
        });

        const refreshToken = generateRefreshToken({
            username: newUser.username,
        });

        // Save the refresh token to the user
        newUser.refreshToken = refreshToken;
        await newUser.save();

        // Return the success response
        return res.status(201).json({
            message: "User registered successfully",
            status: 201,
            accessToken,
            refreshToken,
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Error registering user",
            status: 500,
        });
    }
};


const authRefreshToken = async (req, res) => {
    const { refresh_token } = req.body;

    if (!refresh_token) {
        return res.status(403).json({ message: "Refresh token is required." });
    }

    try {
        const decoded = jwt.verify(refresh_token, JWT_SECRET_REFRESH);

        // Find user by refresh token
        const user = await UserModel.findOne({
            username: decoded.username,
            refreshToken: refresh_token,
        });
        if (!user) {
            return res
                .status(403)
                .json({ message: "Invalid refresh token.", status: 400 });
        }

        // Generate a new access token
        const newAccessToken = generateAccessToken({
            username: decoded.username,
        });

        res.json({ accessToken: newAccessToken });
    } catch (err) {
        console.error(err);
        res
            .status(403)
            .json({ message: "Invalid or expired refresh token.", status: 400 });
    }
};

const authLogout = async (req, res) => {
    try {
        const user = await UserModel.findById(req.user._id);
        if (user) {
            user.token = null;
            await user.save();
        }
        // Respond with success
        res.json({ message: "Successfully logged out" });
    } catch (err) {
        console.log(err);
        res.status(500).send("Error logging out");
    }
};

const getProfile = async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1]?.trim();
    if (!token) {
        return res
            .status(401)
            .json({ message: "Access denied. No access token provided." });
    }

    try {
        // Verify the access token
        const decoded = jwt.verify(token, JWT_SECRET);
        // console.log("Access token decoded:", decoded);

        const user = await UserModel.findOne({ username: decoded.username })
            .select("-_id -__v -password")
            .lean();

        if (!user) {
            return res
                .status(401)
                .json({ message: "Invalid access token. User not found." });
        }

        return res.status(200).json({
            status: 200,
            message: "User profile retrieved successfully.",
            profile: {
                user_id: user.userId,
                salutation: user.salutation,
                display_name: user.displayName,
                avatar: user.avatar,
                first_name: user.firstName,
                last_name: user.lastName,
                username: user.username,
                email_address: user.emailAddress,
                profile_picture: user.profilePicture,
                gender: user.gender,
                date_of_birth: user.dateOfBirth,
                home_address: {
                    street: user.homeAddress.street,
                    city: user.homeAddress.city,
                    state: user.homeAddress.state,
                    postal_code: user.homeAddress.postalCode,
                    country: user.homeAddress.country,
                },
                marital_status: user.maritalStatus,
                created_at: user.createdAt,
                updated_at: user.updatedAt,
            },
        });

    } catch (error) {
        console.error("Error verifying user:", error);
        return res
            .status(500)
            .json({ message: "Invalid or expired refresh token.", status: 500 });
    }
};

const updateProfile = async (req, res) => {
    const { first_name, last_name, email_address, gender, date_of_birth, salutation, home_address, marital_status, avatar } = req.body;
    
    const updatedFields = {};

    if (!first_name && !last_name && !email_address && !gender && !date_of_birth && !salutation && !home_address && !marital_status && !avatar) {
        return res.status(400).json({
            message: "No fields to update provided.",
            status: 400,
        });
    }

    if (first_name) updatedFields.firstName = first_name;
    if (last_name) updatedFields.lastName = last_name;
    if (email_address) updatedFields.emailAddress = email_address;
    if (gender) updatedFields.gender = gender;
    if (date_of_birth) updatedFields.dateOfBirth = new Date(date_of_birth);
    if (salutation) updatedFields.salutation = salutation;
    if (home_address) updatedFields.homeAddress = home_address;
    if (marital_status) updatedFields.maritalStatus = marital_status;
    if (avatar) updatedFields.avatar = avatar;

    try {
        const token = req.headers.authorization?.split(" ")[1]?.trim();
        if (!token) {
            return res.status(401).json({ message: "Access denied. No access token provided." });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await UserModel.findOne({ username: decoded.username });

        if (!user) {
            return res.status(404).json({ message: "User not found.", status: 404 });
        }

        Object.assign(user, updatedFields);
        user.updatedAt = Date.now(); 
        await user.save();

        return res.status(200).json({
            status: 200,
            message: "Profile updated successfully.",
            profile: {
                user_id: user.userId,
                first_name: user.firstName,
                last_name: user.lastName,
                display_name: user.displayName,
                email_address: user.emailAddress,
                gender: user.gender,
                date_of_birth: user.dateOfBirth,
                salutation: user.salutation,
                home_address: {
                    street: user.homeAddress.street,
                    city: user.homeAddress.city,
                    state: user.homeAddress.state,
                    postal_code: user.homeAddress.postalCode,
                    country: user.homeAddress.country,
                },
                marital_status: user.maritalStatus,
                avatar: user.avatar,
                updated_at: user.updatedAt,
            },
        });

    } catch (error) {
        console.error("Error updating profile:", error);
        return res.status(500).json({ message: "Error updating profile.", status: 500 });
    }
};

module.exports = {
    authLogin,
    authRegister,
    authRefreshToken,
    authLogout,
    getCsrfToken,
    getProfile,
    updateProfile
};
