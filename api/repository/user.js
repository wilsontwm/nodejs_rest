
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const hex = require('../kit/hex');

exports.getUsers = ({id, name, email, limit, cursor}) => {
    return new Promise((resolve, reject) => {
        let query = {};
        if(id) {
            query._id = mongoose.Types.ObjectId(id);
        }
        if(name) {
            query.name = {
                $regex: '.*' + name + '.*',
                $options: 'i'
            }
        }
        if(email) {
            query.email = {
                $regex: '.*' + email + '.*',
                $options: 'i'
            }
        }

        if(!limit || limit <= 0) {
            lim = 10
        }

        let skip = 0;
        if(cursor) {
            skip = Number(hex.hexToUtf8(cursor));
        }

        User.find(query, {password: 0}, { skip: skip, limit: parseInt(limit) + 1 }).exec()
        .then(result => {
            lim = parseInt(limit)
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

exports.getUserByID = (id) => {
    return new Promise((resolve, reject) => {
        User.findOne({_id: mongoose.Types.ObjectId(id)}).exec()
        .then(result => {
            resolve(result);            
        }).catch(err => {
            reject(err);
        });
    });
}

exports.getUserByEmail = (email) => {
    return new Promise((resolve, reject) => {
        User.findOne({email: email}).exec()
        .then(result => {
            resolve(result);            
        }).catch(err => {
            reject(err);
        });
    });
}

exports.createUser = ({name, email, password, isAdmin}) => {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, 10, (err, hash) => {
            if(err) {
                reject(err)
            } 

            const user = new User({
                _id:  new mongoose.Types.ObjectId(),
                name: name,
                email: email,
                password: hash,
                isAdministrator: isAdmin,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });

            user.save()
            .then(result => {
                return resolve(result);
            })
            .catch(err => {
                return reject(err);
            });

        });
    });
}

exports.updateUser = (user) => {
    return new Promise((resolve, reject) => {
        user.save()
        .then(result => {
            return resolve(result);
        })
        .catch(err => {
            return reject(err);
        });
    });
}