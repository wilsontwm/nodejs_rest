// Command: npm run create_admin -- --name=Admin --email=admin@gmail.com --password=password
const argv = require('yargs').argv;
const async = require('async');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const dotenv = require('dotenv'); // To use .env param
const User = require('../api/models/user');
const UserRepo = require('../api/repository/user');
dotenv.config();

const name = argv.name;
const email = argv.email;
const password = argv.password;
console.log('Creating admin...');
console.log('Name', argv.name);
console.log('Email', argv.email);

mongoose.connect('mongodb://' + process.env.MONGO_USERNAME + ':' + encodeURIComponent(process.env.MONGO_PASSWORD) + '@' + process.env.MONGO_HOST + '/' + process.env.MONGO_DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
mongoose.set('useCreateIndex', true);

// Create the admin
if(name != undefined && email != undefined && password != undefined) {
    // Get existing user by email
    if(existingUser) {
        console.log("Email has already been taken.")
    } else {
        const user = await UserRepo.createUser({name, email, password, isAdministrator: true});
        console.log("Created admin:", user)
    }
} else {
    console.log('Incomplete information. Name, email & password is required.');    
}

process.exit();

