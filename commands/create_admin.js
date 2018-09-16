const argv = require('yargs').argv;
const async = require('async');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const dotenv = require('dotenv'); // To use .env param
const User = require('../api/models/user');
dotenv.config();

const name = argv.name;
const email = argv.email;
const password = argv.password;
console.log('Creating admin...');
console.log('Name', argv.name);
console.log('Email', argv.email);

mongoose.connect('mongodb://' + process.env.MLAB_USER + ':' + process.env.MLAB_PW + '@ds125914.mlab.com:25914/test-app', {
    useNewUrlParser: true
});
mongoose.set('useCreateIndex', true);

// Create the admin
if(name != undefined && email != undefined && password != undefined) {
    const tasks = [
        function getUserByEmail(cb) {
            // Check if the email has already been taken
            User.find({email: email}).exec()
            .then(result => {
                return cb(null, result);            
            })
            .catch(err => {
                return cb(err);
            });
        },
        function hashPassword(result, cb) {
            if(result.length > 0) {
                return cb(true, {
                    message: 'Email has already been taken.'
                });
            } 
            
            bcrypt.hash(password, 10, (err, hash) => {
                if(err) {
                    return cb(err);
                } 
        
                return cb(null, hash);
            });
        },
        function createUser(hash, cb) {
            const user = new User({
                _id:  new mongoose.Types.ObjectId(),
                name: name,
                email: email,
                password: hash,
                isAdministrator: true
            });
        
            user.save()
            .then(result => {
                return cb(null, user);
            })
            .catch(err => {
                return cb(err);
            });
        }
    ];

    async.waterfall(tasks, (err, results) => {
        if(err) {
            if(err === true) {
                console.log(results);
            } else {
                console.log(err);
            }
        } else {
            console.log('Admin has been created successfully.');
            console.log(results);
        }
        process.exit();
    });
} else {
    console.log('Incomplete information. Name, email & password is required.');
    process.exit();
}


