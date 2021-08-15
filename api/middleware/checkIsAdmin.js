const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const user = res.locals.user;
        if(!user.isAdministrator) {
            return res.status(403).json({
                message: "You are not allowed to perform the request."
            })
        }
        next();
    } catch (error) {
        return res.status(500).json({
            message: 'Server error'
        });
    }
};