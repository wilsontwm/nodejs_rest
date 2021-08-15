const mongoose = require('mongoose');

const leaveSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userId: {
        type: String,
        required: true
    },
    startAt:{
        type: Date,
        required: true
    },
    endAt: {
        type: Date,
        required: true
    },
    noOfDays: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date
    },
    updatedAt: {
        type: Date
    }
});

module.exports = mongoose.model('Leave', leaveSchema);