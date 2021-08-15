const dayjs = require('dayjs');
const Validator = require('validatorjs');
const LeaveRepo = require('../repository/leave');

exports.admin_get_leaves = async(req, res, next) => {
    try {
        const response = await LeaveRepo.getLeaves({
            userID: req.query.userID, 
            startAt: req.query.startAt,
            endAt: req.query.endAt,
            limit: req.query.limit, 
            cursor: req.query.cursor
        });
        
        return res.status(200).json(response)

    } catch (e){
        return res.status(500).json({
            error: "Internal server error",
            debug: e
        });
    }
};

exports.admin_review_leave = async(req, res, next) => {
    let rules = {
        status: 'required|in:ACCEPTED,REJECTED'
    };
      
    let validation = new Validator(req.body, rules);
    
    if(!validation.passes()) {
        return res.status(412).json(validation.errors);
    }
    
    try {
        const leave = await LeaveRepo.getLeaveByID(req.params.leaveID);
        if(!leave) {
            return res.status(404).json({
                error: "Leave not found."
            })
        } else if(leave.status !== "PENDING") {
            return res.status(412).json({
                error: "Leave has been reviewed or cancelled."
            })
        }

        leave.status = req.body.status;
        leave.updatedAt = Date.now();

        const updatedLeave = await LeaveRepo.updateLeave(leave);
        
        return res.status(200).json({
            item: updatedLeave,
            message: "Leave successfully reviewed."
        })

    } catch (e){
        return res.status(500).json({
            error: "Internal server error",
            debug: e
        });
    }
};

exports.get_leaves = async(req, res, next) => {
    try {
        const response = await LeaveRepo.getLeaves({
            userID: res.locals.user.userId, 
            startAt: req.query.startAt,
            endAt: req.query.endAt,
            limit: req.query.limit, 
            cursor: req.query.cursor
        });
        
        return res.status(200).json(response)

    } catch (e){
        return res.status(500).json({
            message: "Internal server error",
            error: e
        });
    }
};

exports.create_leave = async(req, res, next) => {
    let rules = {
        startAt: 'required|date',
        endAt: 'required|date'
    };
      
    let validation = new Validator(req.body, rules);
    
    if(!validation.passes()) {
        return res.status(412).json(validation.errors);
    }

    // Calculate the no. of days
    const start = dayjs(req.body.startAt).startOf('day');
    const end = dayjs(req.body.endAt).endOf('day');
    let noOfDays = 0;
    for(let startDay = start; startDay < end; startDay = startDay.add(1, 'day')) {
        if(startDay.day() % 6 != 0) {
            noOfDays++
        }
    }

    if(noOfDays <= 0) {
        return res.status(412).json({
            error: "Days input are invalid, please ensure at least 1 weekday is selected"
        })
    }
    
    try {
        const leave = await LeaveRepo.createLeave({
            userID: res.locals.user.userId,
            startAt: start,
            endAt: end,
            noOfDays: noOfDays
        });

        return res.status(200).json({
            item: leave,
            message: "Leave successfully created."
        })

    } catch (e){
        return res.status(500).json({
            error: "Internal server error",
            debug: e
        });
    }
};

exports.update_leave = async(req, res, next) => {
    const leaveID = req.params.leaveID;
    let rules = {
        startAt: 'required|date',
        endAt: 'required|date',
        status: 'required|in:PENDING,CANCELLED'
    };
      
    let validation = new Validator(req.body, rules);
    
    if(!validation.passes()) {
        return res.status(412).json(validation.errors);
    }

    // Calculate the no. of days
    const start = dayjs(req.body.startAt).startOf('day');
    const end = dayjs(req.body.endAt).endOf('day');
    let noOfDays = 0;
    for(let startDay = start; startDay < end; startDay = startDay.add(1, 'day')) {
        if(startDay.day() % 6 != 0) {
            noOfDays++
        }
    }
    
    try {
        const existingLeave = await LeaveRepo.getLeaveByID(leaveID);
        if(!existingLeave) {
            return res.status(404).json({
                error: "Leave not found"
            })
        } else if(existingLeave.userId !== res.locals.user.userId) {
            return res.status(404).json({
                error: "Leave not found"
            })
        } else if(existingLeave.status !== "PENDING") {
            return res.status(400).json({
                error: "Leave cannot be updated anymore."
            })
        }

        existingLeave.startAt = start;
        existingLeave.endAt = end;
        existingLeave.noOfDays = noOfDays;
        existingLeave.status = req.body.status;
        existingLeave.updatedAt = Date.now();
        
        let updatedLeave = await LeaveRepo.updateLeave(existingLeave);

        return res.status(200).json({
            item: updatedLeave,
            message: "Leave successfully updated."
        })

    } catch (e){
        return res.status(500).json({
            error: "Internal server error",
            debug: e
        });
    }
};