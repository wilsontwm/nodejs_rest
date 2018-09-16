const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const async = require('async');
const md5 = require('md5');
const nodemailer = require('nodemailer');
const User = require('../models/user');

function getUserByEmail(req, cb) {
    // Check if the email has already been taken
    User.find({email: req.body.email}).exec()
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
        function hashPassword(result, cb) {
            if(result.length > 0) {
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
                // Generate test SMTP service account from ethereal.email
                nodemailer.createTestAccount((err, account) => {
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