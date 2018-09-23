const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: {
        type: String,
        required: true
    },
    email: {
        type: String, 
        required: true, 
        unique: true, 
        match: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
    },
    password: {
        type: String,
        required: true
    },
    // isAdministrator is used to define super admin users eg. application owners
    isAdministrator: {
        type: Boolean,
        default: false
    },
    activationCode: {
        type: String,
        default: null
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    },
    bio: {
        type: String
    },
    profilePicture: {
        type: String
    }
});

// Virtual attributes
userSchema
.virtual('isActivated')
.get(function() {
    return this.activationCode === null;
});

module.exports = mongoose.model('User', userSchema);