const express = require('express');
const app = express();
const dotenv = require('dotenv'); // To use .env param
const bodyParser = require('body-parser'); // Parse the incoming messages
const mongoose = require('mongoose');
dotenv.config();

// Routes
const userRoutes = require('./api/routes/users');
const leavesRoutes = require('./api/routes/leaves');

mongoose.connect('mongodb://' + process.env.MONGO_USERNAME + ':' + encodeURIComponent(process.env.MONGO_PASSWORD) + '@' + process.env.MONGO_HOST + '/' + process.env.MONGO_DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
mongoose.set('useCreateIndex', true);

app.use('/uploads', express.static('uploads'));
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
app.use('/api/leaves', leavesRoutes);

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