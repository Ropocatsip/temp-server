const Appointment = require('../models/Appointment');
const Hospital = require('../models/Hospital');

exports.getHospitals = async (req, res, next) => {
    let query;

    const reqQuery = {...req.query};

    // fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    removeFields.forEach(param => delete reqQuery[param]);
    console.log(reqQuery);
    
    let queryStr = JSON.stringify(req.query);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    query = Hospital.find(JSON.parse(queryStr)).populate('appointments');

    // Sort
    if(req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }

    if(req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt');
    }

    // Pagination
    let page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    try {
        const total = await Hospital.countDocuments();
        query = query.skip(startIndex).limit(limit);
        // Execute query
        const hospitals = await query;

        const pagination = {};
        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit
            }
        }
        if(startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit
            }
        }
        res.status(200).json({sucess: true, count: hospitals.length , pagination, data: hospitals});
    } catch (error) {
        res.status(400).json({succfaess: false});
    }
};

exports.getHospital = async (req, res, next) => {
    try {
        const hospitals = await Hospital.findById(req.params.id);
        if (!hospitals) {
            return res.status(400).json({success: false});
        }
        res.status(200).json({success: true, data: hospitals});
    } catch (error) {
        res.status(400).json({success: false});
    }
};

exports.createHospital = async (req, res, next) => {
    try {
        const hospital = await Hospital.create(req.body);
        res.status(201).json({success: true, data: hospital});
    } catch (error) {
        res.status(400).json({success: false});
    }
};

exports.updateHospital = async (req, res, next) => {
    try {
        const hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if(!hospital) {
            return res.status(400).json({success: false});
        }

        res.status(200).json({success: true, data: hospital});
    } catch (error) {
        res.status(400).json({success: false});
    }
};

exports.deleteHospital = async (req, res, next) => {
    try {
        const hospital = await Hospital.findById(req.params.id);
        
        if(!hospital) {
            return res.status(404).json({success: false, message: `Hospital not found with id of ${req.params.id}`});
        }
        await Appointment.deleteMany({hospital: req.params.id});
        await Hospital.deleteOne({_id: req.params.id});

        res.status(200).json({success: true, data: {}});
    } catch (error) {
        res.status(400).json({success: false});
    }
};