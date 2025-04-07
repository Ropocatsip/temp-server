const mongoose=require('mongoose');
const bcrypt=require('bcryptjs');

const UserOTPSchema=new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiredAt: {
        type: Date,
        default: Date.now() + (10 * 60 * 1000)
    }
});

//  Encrypt otp using bcrypt
UserOTPSchema.pre('save',async function(next){
    const salt=await bcrypt.genSalt(10);
    this.otp=await bcrypt.hash(this.otp,salt);
});

// Match user entered password to hashed password in database
UserOTPSchema.methods.matchPassword=async function(enteredOTP) {
    return await bcrypt.compare(enteredOTP,this.otp);
}

module.exports = mongoose.model('UserOTP', UserOTPSchema);