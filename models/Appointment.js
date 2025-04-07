const moongoose = require('mongoose');

const AppointmentSchema = new moongoose.Schema({
    apptDate: {
        type: Date,
        required: true
    },
    user: {
        type: moongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    restaurant: {
        type: moongoose.Schema.ObjectId,
        ref: 'Restaurant',
        required: true
    }, 
    seat: {
        type: Number,
        ref: 'Seat',
        required: true,
        min: [1, 'Seat count cannot be less than 1'],
        max: [10, 'Seat count cannot be more than 10']
    }, 
    note: {
        type: String,
        ref: 'Note',
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    notify: {
        type: Boolean,
        ref: 'Notify',
        default: false
    },
});

module.exports = moongoose.model('Appointment', AppointmentSchema);