const express = require('express');
const app = express();
const dotenv = require('dotenv'); // To use .env param
const bodyParser = require('body-parser'); // Parse the incoming messages
const mongoose = require('mongoose');
dotenv.config();

// Routes
const userRoutes = require('./api/routes/users');

mongoose.connect('mongodb://' + process.env.MLAB_USER + ':' + process.env.MLAB_PW + '@ds125914.mlab.com:25914/test-app', {
    useNewUrlParser: true
});
mongoose.set('useCreateIndex', true);

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use((req, res, next) => {
    // Add header to the response
    res.header('Access-Control-Allow-Origin', '*'); // * means all pages can access
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if(req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, PATCH, DELETE');
        return res.status(200).json({});
    }

    next();
});

// Add routers below
app.use('/api/users', userRoutes);

// Error handling
app.use((req, res, next) => {
    const error = new Error('Invalid URL');
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    })
});

module.exports = app;