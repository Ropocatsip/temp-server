const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters']
    },
    address: {
        type: String,
        required: [true, 'Please add an address']
    },
    district: {
        type: String,
        required: [true, 'Please add a district']
    },
    province: {
        type: String,
        required: [true, 'Please add a province']
    },
    postalcode: {
        type: String,
        required: [true, 'Please add a postal code'],
        maxlength: [5, 'Postal code cannot be more than 5 characters']
    },
    tel: {
        type: String,
        required: [true, 'Please add a phone number'],
        maxlength: [10, 'Phone number cannot be more than 10 characters'],
        match : [/^[0-9]+$/, 'Please add a valid phone number']        
    },
    opentime: {
        type: String,
        required: [true, 'Please add a open time']
    },
    closetime: {
        type: String,
        required: [true, 'Please add a close time']
    },
    operationday: {
        type: [],
        required: [true, 'Please add operation days']
    },
    type: {
        type: []
    }
}, {
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

//Reverse populate with virtuals
RestaurantSchema.virtual('appointments', {
    ref: 'Appointment',
    localField: '_id',
    foreignField: 'restaurant',
    justOne: false
});

module.exports = mongoose.model('Restaurant', RestaurantSchema);