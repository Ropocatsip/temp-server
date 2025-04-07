const express = require('express');
const {getRestaurants, updateRestaurant} = require('../controllers/restaurants')

const appointmentRouter = require('./appointments');

const router = express.Router();

const  {protect, authorize} = require('../middleware/auth');

router.use('/:restaurantId/appointments/', appointmentRouter);

router.route('/').get(getRestaurants);
router.route('/:id').put(protect, authorize('admin'), updateRestaurant);

module.exports = router;