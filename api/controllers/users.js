const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const async = require('async');
const md5 = require('md5');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const mime = require('mime-types');
const mkdirp = require('mkdirp');
const fs = require('fs');
const User = require('../models/user');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        try {
            const userId = req.user.userId;
            const dir = './uploads/users/profile/' + userId + '/';
            
            // Make a new directory for the user if necessary
            mkdirp(dir, err => cb(err, dir));
        } catch (err) {
            console.log(err);
            cb(null, './uploads');
        }
    },
    filename: function(req, file, cb) {
        crypto.randomBytes(20, function(err, buf) {
            var token = buf.toString('hex');
            cb(err, token + '.' + mime.extension(file.mimetype));
        });
    }
});
const fileFilter = (req, file, cb) => {
    // Check the file type
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        const error = 'Invalid file type. Only .jpg and .png files are allowed.';
        cb(error, false);
    }
};
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // limit file size to 5MB
    },
    fileFilter: fileFilter
});
const imageUpload = upload.single('image');

function getUserByEmail(req, cb) {
    // Check if the email has already been taken
    User.findOne({email: req.body.email}).exec()
    .then(result => {
        return cb(null, result);            
    })
    .catch(err => {
        return cb(err);
    });
}

// Controllers
exports.users_signup = (req, res, next) => {   
    const tasks = [
        async.apply(getUserByEmail, req),
        function hashPassword(user, cb) {
            if(user) {
                return cb(true, {
                    message: 'Email has already been taken.'
                });
            } 
            
            bcrypt.hash(req.body.password, 10, (err, hash) => {
                if(err) {
                    return cb(err);
                } 
        
                return cb(null, hash);
            });
        },
        function createUser(hash, cb) {
            const user = new User({
                _id:  new mongoose.Types.ObjectId(),
                name: req.body.name,
                email: req.body.email,
                password: hash
            });
        
            user.save()
            .then(result => {
                return cb(null, user);
            })
            .catch(err => {
                return cb(err);
            });
        },
        function sendActivationEmail(user, cb) {
            const activationCode = md5(user._id + Date.now());
            User.updateOne({_id: user._id}, { 'activationCode': activationCode })
            .exec()
            .then(result => {
                // create reusable transporter object using the default SMTP transport
                let transporter = nodemailer.createTransport({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    secure: false, // true for 465, false for other ports
                    auth: {
                        user: 'l4spet4dpcnb6mh2@ethereal.email', // generated ethereal user
                        pass: 'YmAkUFKFJ3mJ3u1R8q' // generated ethereal password
                    },
                    tls: {
                        rejectUnauthorized: false
                    }
                });

                // setup email data with unicode symbols
                const activationURL = 'http://localhost:3000/api/users/activate/' + activationCode;
                let mailOptions = {
                    from: '"Node Mailer" <l4spet4dpcnb6mh2@ethereal.email>', // sender address
                    to: '"' + user.name + '"' + user.email, // list of receivers separated by comma
                    subject: 'Activate your account', // Subject line
                    html: '<h2>Hello world?</h2><p>Click on the link below to activate your account:<br /><a href="' + activationURL + '">' + activationURL + '</a></p>' // html body
                };

                // send mail with defined transport object
                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) {
                        return cb(err);
                    }
                    console.log('Message sent: %s', info.messageId);
                    // Preview only available when sending through an Ethereal account
                    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                    return cb(null, {
                        user: {
                            name: user.name,
                            email: user.email
                        },
                        activation: activationURL,
                        message: 'You have successfully signed up. An activation email has been sent to your email address.'
                    });
                    
                });
                
            })
            .catch(err => {
                return cb(err);
            });
        }
    ];

    async.waterfall(tasks, (err, results) => {
        if(err) {
            if(err === true) {
                return res.status(409).json({
                    results: results
                });
            }
            return next(err);            
        }
        return res.json(results);
    });
    
};

exports.users_login = (req, res, next) => {
    const tasks = [
        async.apply(getUserByEmail, req),
        function authenticateUser(user, cb) {
            if(user) {
                bcrypt.compare(req.body.password, user.password, (err, result) => {
                    if(err) return cb(err);
                    
                    if(result) {
                        // If user is not activated, then do not login
                        if(!user.isActivated) {
                            return cb(true, {
                                message: 'Login unsuccessful. You have to activate your account first.'
                            })
                        }

                        const token = jwt.sign(
                            {
                                email: user.email,
                                isAdministrator: user.isAdministrator,
                                userId: user._id
                            }, 
                            process.env.JWT_KEY,
                            {
                                expiresIn: "1h"
                            }
                        );
                        return cb(null, {
                            token: token,
                            message: 'You have successfully login.'
                        });
                    } else {
                        return cb(true, {
                            message: 'Invalid email / password.'
                        })
                    }
                });
            } else {
                return cb(true, {
                    message: 'Invalid email / password.'
                });
            }
        }
    ];

    async.waterfall(tasks, (err, results) => {
        if(err) {
            if(err === true) {
                return res.status(400).json({
                    results: results
                });
            }
            return next(err);            
        }
        return res.json(results);
    });
};

exports.users_resend_activation = (req, res, next) => {
    const tasks = [
        async.apply(getUserByEmail, req),        
        function setActivateCode(user, cb) {
            if(user) {
                const activationCode = md5(user._id + Date.now());
                user.activationCode = activationCode;

                user.save(function(err) {
                    return cb(err, activationCode, user);
                });
            } else {
                return cb(true, {
                    message: 'Invalid email address.'
                });
            }   
        },
        function sendActivationEmail(activationCode, user, cb) {
            // create reusable transporter object using the default SMTP transport
            let transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: 'l4spet4dpcnb6mh2@ethereal.email', // generated ethereal user
                    pass: 'YmAkUFKFJ3mJ3u1R8q' // generated ethereal password
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            // setup email data with unicode symbols
            const activationURL = 'http://localhost:3000/api/users/activate/' + activationCode;
            let mailOptions = {
                from: '"Node Mailer" <l4spet4dpcnb6mh2@ethereal.email>', // sender address
                to: '"' + user.name + '"' + user.email, // list of receivers separated by comma
                subject: 'Activate your account', // Subject line
                html: '<h2>Hello world?</h2><p>Click on the link below to activate your account:<br /><a href="' + activationURL + '">' + activationURL + '</a></p>' // html body
            };

            // send mail with defined transport object
            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    return cb(err);
                }
                console.log('Message sent: %s', info.messageId);
                // Preview only available when sending through an Ethereal account
                console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                return cb(null, {
                    user: {
                        name: user.name,
                        email: user.email
                    },
                    activation: activationURL,
                    message: 'An activation email has been sent to your email address.'
                });
                
            });
        }
    ];

    async.waterfall(tasks, (err, results) => {
        if(err) {
            if(err === true) {
                return res.status(400).json({
                    results: results
                });
            }
            return next(err);            
        }
        return res.json(results);
    });
};

exports.users_activate = (req, res, next) => {
    const code = req.params.code;
    const tasks = [
        function getUserByActivationCode(cb) {
            User.findOne({activationCode: code}).exec()
            .then(result => {                
                if(!result) {
                    return cb(true, {
                        message: 'Invalid activation link.'
                    });
                }
                return cb(null, result);            
            })
            .catch(err => {
                return cb(err);
            });
        },
        function activateAccount(user, cb) {
            // Set the activation code as null to indicate the user account has been activated
            user.activationCode = null;
            user.save(function(err) {
                return cb(null, {
                    message: 'You have successfully activated your account.'
                });
            });            
        }
    ];

    async.waterfall(tasks, (err, results) => {
        if(err) {
            if(err === true) {
                return res.status(400).json({
                    results: results
                });
            }
            return next(err);            
        }
        return res.json(results);
    });
};

exports.users_password_forget = (req, res, next) => {
    const tasks = [
        async.apply(getUserByEmail, req),
        function generateToken(user, cb) {
            if(user && user.isActivated) {
                crypto.randomBytes(20, function(err, buf) {
                    var token = buf.toString('hex');
                    return cb(err, token, user);
                });
            } else {
                return cb(true, {
                    message: 'Invalid email address or the user account is not activated yet.'
                });
            }
        },
        function setToken(token, user, cb) {
            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

            user.save(function(err) {
                return cb(err, token, user);
            });
        },
        function sendResetPasswordEmail(token, user, cb) {
            
            let transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: 'l4spet4dpcnb6mh2@ethereal.email', // generated ethereal user
                    pass: 'YmAkUFKFJ3mJ3u1R8q' // generated ethereal password
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            // setup email data with unicode symbols
            const resetPasswordURL = 'http://localhost:3000/api/users/password/reset/' + token;
            let mailOptions = {
                from: '"Node Mailer" <l4spet4dpcnb6mh2@ethereal.email>', // sender address
                to: '"' + user.name + '"' + user.email, // list of receivers separated by comma
                subject: 'Reset your password', // Subject line
                html: '<h2>Hello world?</h2><p>Click on the link below to reset your password:<br /><a href="' + resetPasswordURL + '">' + resetPasswordURL + '</a></p>' // html body
            };

            // send mail with defined transport object
            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    return cb(err);
                }
                console.log('Message sent: %s', info.messageId);
                // Preview only available when sending through an Ethereal account
                console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                return cb(null, {
                    user: {
                        name: user.name,
                        email: user.email
                    },
                    resetPassword: resetPasswordURL,
                    message: 'An reset password email has been sent to your email address.'
                });
                
            });
        }
    ];

    async.waterfall(tasks, (err, results) => {
        if(err) {
            if(err === true) {
                return res.status(400).json({
                    results: results
                });
            }
            return next(err);            
        }
        return res.json(results);
    });
};

exports.users_password_reset = (req, res, next) => {
    const token = req.params.token;
    const tasks = [
        function getUserByResetPasswordToken(cb) {
            User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() }}).exec()
            .then(result => {
                if(!result) {
                    return cb(true, {
                        message: 'Password reset token is invalid or has expired.'
                    });
                }

                return cb(null, result, req);            
            })
            .catch(err => {
                return cb(err);
            });
        },
        function resetPassword(user, req, cb) {

            bcrypt.hash(req.body.password, 10, (err, hash) => {
                if(err) {
                    return cb(err);
                } 
                
                user.password = hash;
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;

                user.save(function(err) {
                    return cb(err, {
                        message: 'You have successfully reset your password.'
                    });
                });
            });      
        }
    ];

    async.waterfall(tasks, (err, results) => {
        if(err) {
            if(err === true) {
                return res.status(409).json({
                    results: results
                });
            }
            return next(err);            
        }
        return res.json(results);
    });
};

exports.users_profile_update = (req, res, next) => {
    const userId = res.locals.user.userId;
    const input = {
        bio: req.body.bio
    };

    User.findOneAndUpdate({_id: userId}, {$set: input}, {new: true})
    .select('_id name email bio')
    .lean()
    .then(result => {
        return res.status(200).json({
            message: 'Profile has been updated successfully.',
            user: result
        });
    })
    .catch(err => {
        return res.status(500).json({
            error: err
        });
    });
};

exports.users_profile_upload_pic = (req, res, next) => {
    const userId = res.locals.user.userId;
    imageUpload(req, res, function(err) {
        if(err) {
            return res.status(500).json({
                error: err
            });
        }
        const profilePicUrl = req.file.path;
        User.findOne({_id: userId})
        .then(user => {
            if(user.profilePicture) {
                // If the user has profile picture saved before, delete it from file system to save storage
                fs.unlink(user.profilePicture, (err) => {
                    if (err) throw err;
                    console.log(user.profilePicture + ' has been deleted successfully.');
                });
            }

            user.profilePicture = profilePicUrl;
            user.save(function(err) {
                return res.status(200).json({
                    message: 'Profile picture has been uploaded successfully.',
                    path: profilePicUrl
                });
            });
           
        })
        .catch(err => {
            return res.status(500).json({
                error: err
            });
        });
    });
};