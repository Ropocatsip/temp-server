const Appointment = require('../models/Appointment');
const Restaurant = require('../models/Restaurant');

exports.getRestaurants = async (req, res, next) => {
    let query;

    const reqQuery = {...req.query};

    // fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    removeFields.forEach(param => delete reqQuery[param]);
    console.log(reqQuery);
    
    let queryStr = JSON.stringify(req.query);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    query = Restaurant.find(JSON.parse(queryStr)).populate('appointments');

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
        const total = await Restaurant.countDocuments();
        query = query.skip(startIndex).limit(limit);
        // Execute query
        const restaurants = await query;

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
        res.status(200).json({sucess: true, count: restaurants.length , pagination, data: restaurants});
    } catch (error) {
        res.status(400).json({succfaess: false});
    }
};

exports.updateRestaurant = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if(!restaurant) {
            return res.status(400).json({success: false, message: `No restaurant with the id of ${req.params.id}`});
        }

        res.status(200).json({success: true, data: restaurant});
    } catch (error) {
        res.status(400).json({success: false,  message: `Cannot update restaurant.`});
    }
};