const Validator = require('validatorjs');
const UserRepo = require('../repository/user');

exports.admin_get_users = async(req, res, next) => {
    try {
        const response = await UserRepo.getUsers({id: req.query.id, name: req.query.name, email: req.query.email, limit: req.query.limit, cursor: req.query.cursor});
        
        return res.status(200).json(response)

    } catch (e){
        return res.status(500).json({
            message: "Internal server error",
            error: e
        });
    }
};

exports.admin_create_user = async(req, res, next) => {
    let rules = {
        name: 'required',
        email: 'required|email',
        password: 'required|min:8'
    };
      
    let validation = new Validator(req.body, rules);
    
    if(!validation.passes()) {
        return res.status(412).json(validation.errors);
    }
    
    try {
        const existingUser = await UserRepo.getUserByEmail(req.body.email);
        if(existingUser) {
            return res.status(412).json({
                message: "Email has already been taken."
            })
        }

        const user = await UserRepo.createUser({name: req.body.name, email: req.body.email, password: req.body.password, isAdmin: req.body.isAdministrator});
        
        user.password = "";

        return res.status(200).json({
            item: user,
            message: "User successfully created."
        })

    } catch (e){
        return res.status(500).json({
            message: "Internal server error",
            error: e
        });
    }
};

exports.admin_update_user = async(req, res, next) => {
    const userID = req.params.userID;
    let rules = {
        name: 'required',
    };
      
    let validation = new Validator(req.body, rules);
    
    if(!validation.passes()) {
        return res.status(412).json(validation.errors);
    }
    
    try {
        const existingUser = await UserRepo.getUserByID(userID);
        if(!existingUser) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        existingUser.name = req.body.name;
        existingUser.isAdministrator = req.body.isAdministrator;
        existingUser.updatedAt = Date.now();
        
        let updatedUser = await UserRepo.updateUser(existingUser);

        updatedUser.password = "";

        return res.status(200).json({
            item: updatedUser,
            message: "User successfully updated."
        })

    } catch (e){
        return res.status(500).json({
            message: "Internal server error",
            error: e
        });
    }
};