
/**
 * User Model
 *
 * @since 1.0.0
 * @version 1.0.0
 *
 * @author  Sasky Samonte
 * 
 * @package mongoose https://www.npmjs.com/package/mongoose
 *
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    firstName: { type: String },
    lastName: { type: String },
    displayName: { type: String },
    avatar: { type: String, default: 'https://avatar.iran.liara.run/public/37' },
    salutation: {
        type: String,
        enum: ['mr', 'ms', 'mrs'],
    },
    emailAddress: {
        type: String,
        unique: true,
        sparse: true 
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: { type: String, required: true },
    gender: {
        type: String,
        enum: ['male', 'female'],
    },
    dateOfBirth: { type: Date },
    homeAddress: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        postalCode: { type: String },
        country: { type: String },
    },
    maritalStatus: {
        type: String,
        enum: ['single', 'married', 'divorced', 'widowed'],
    },
    spouse: {
        salutation: {
            type: String,
            enum: ['mr', 'ms', 'mrs'],
        },
        firstName: { type: String },
        lastName: { type: String },
    },
    personalPreferences: {
        hobbies: [{ type: String }],
        interests: [{ type: String }],
        sports: [{ type: String }],
        musics: [{ type: String }],
        movies: [{ type: String }],
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
