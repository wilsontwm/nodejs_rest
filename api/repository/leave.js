
const mongoose = require('mongoose');
const Leave = require('../models/leave');
const hex = require('../kit/hex');

exports.getLeaves = ({userID, startAt, endAt, limit, cursor}) => {
    return new Promise((resolve, reject) => {
        let query = {};
        if(userID) {
            query.userId = mongoose.Types.ObjectId(userID);
        }
        if(startAt) {
            query.startAt = {
                $gte: Date.parse(startAt)
            }
        }
        if(endAt) {
            query.endAt = {
                $lte: Date.parse(endAt),
            }
        }

        lim = 10
        if(!!limit && limit > 0) {
            lim = parseInt(limit)
        }

        let skip = 0;
        if(cursor) {
            skip = Number(hex.hexToUtf8(cursor));
        }

        Leave.find(query, {}, { skip: skip, limit: lim + 1 }).exec()
        .then(result => {
            if(result.length > lim) {
                result = result.slice(0, lim)
                resolve({items: result, count: result.length, cursor: hex.utf8ToHex(String(skip+lim))}); 
            } else {
                resolve({items: result, count: result.length, cursor: ''}); 
            }    
        }).catch(err => {
            reject(err);
        });
    });
}

exports.getLeaveByID = (id) => {
    return new Promise((resolve, reject) => {
        Leave.findOne({_id: mongoose.Types.ObjectId(id)}).exec()
        .then(result => {
            resolve(result);            
        }).catch(err => {
            reject(err);
        });
    });
}

exports.createLeave = ({userID, noOfDays, startAt, endAt}) => {
    return new Promise((resolve, reject) => {
       
        const leave = new Leave({
            _id:  new mongoose.Types.ObjectId(),
            userId: userID,
            startAt: startAt,
            endAt: endAt,
            noOfDays: noOfDays,
            status: "PENDING",
            createdAt: Date.now(),
            updatedAt: Date.now()
        });

        leave.save()
        .then(result => {
            return resolve(result);
        })
        .catch(err => {
            return reject(err);
        });

    });
}

exports.updateLeave = (leave) => {
    return new Promise((resolve, reject) => {
        leave.save()
        .then(result => {
            return resolve(result);
        })
        .catch(err => {
            return reject(err);
        });
    });
}