
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
            default: 'mr'
        },
        firstName: { type: String, default: '-'  },
        lastName: { type: String, default: '-' },
    },
    personalPreferences: {
  hobbies: {
    type: [String],
    default: ['-']
  },
  interests: {
    type: [String],
    default: ['-']
  },
  sports: {
    type: [String],
    default: ['-']
  },
  musics: {
    type: [String],
    default: ['-']
  },
  movies: {
    type: [String],
    default: ['']
  },
},
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
