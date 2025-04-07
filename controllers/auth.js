const bcrypt=require('bcryptjs');
const User = require("../models/User");
const UserOTP = require("../models/UserOTP");
const nodemailer = require('nodemailer');

exports.register = async (req, res, next) => {
  try {
    const { name, tel, email, password, role } = req.body;

    //Create user
    const user = await User.create({
      name,
      tel,
      email,
      password,
      role,
    });

    await twoAuthentication(user, 200, res);
    // sentTokenResponse(user, 200, res);
  } catch (err) {
    res.status(400).json({ success: false });
    console.log(err.stack);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Please provide email and password" });
    }

    // Check for user
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    } else if (!user.verified) {
        return res
            .status(401)
            .json({ success: false, error: "Please verify your email" });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    // Create token
    sentTokenResponse(user, 200, res);
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: "Cannot convert email and password to string",
    });
  }
};

exports.verifyOTP = async (req, res, next) => {
    try {
        let { userId, otp } = req.body;

        const user = await User.findOne({ _id: userId });
        if (!user) {
            res.status(400).json({ success: false, message: "Account doesn't exist. Please sign up." });
        } else {
            const userOTP = await UserOTP.findOne({ user: userId });
            
            if (userOTP.expiredAt < Date.now()) {
                await UserOTP.deleteMany({ user: userId});
                res.status(400).json({ success: false, message: "OTP expired. Please request again." });
            } else {
                // Check if password matches
                const isMatch = await userOTP.matchPassword(otp);
                if (!isMatch) {
                return res
                    .status(401)
                    .json({ success: false, error: "Invalid OTP. Please check your inbox." });
                } else {
                    await User.updateOne({ _id: userId }, { verified: true });
                    await UserOTP.deleteMany({ user: userId});
                    res.status(200).json({ success: true, message: "User email verify successfully" });
                }
            }
        }
      
    } catch (err) {
        res.status(400).json({ success: false, nmessage: "Verify OTP not success." });
        console.log(err.stack);
    }
};

exports.resendOTPCode = async (req, res, next) => {
    try {
        let { userId } = req.body;
        
        const user = await User.findOne({ _id: userId });
        console.log(user);
        
        if (!user) {
            res.status(400).json({ success: false, message: "Account doesn't exist. Please sign up." });
        } else {
            await UserOTP.deleteMany({ _id: user._id});
            await twoAuthentication(user, 200, res);
        }
      
    } catch (err) {
        res.status(400).json({ success: false, message: "Resend OTP not success." });
        console.log(err.stack);
    }
};

const sentTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  // res.status(statusCode).cookie('token', token, options).json({ success: true, token });
  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    //add for frontend
    _id: user._id,
    name: user.name,
    email: user.email,
    //end for frontend
    token,
  });
};

const twoAuthentication = async (user, statusCode, res) => {
  try {    
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    // create otp
    await UserOTP.create({
      user: user._id,
      otp: otp,
    });

    sendEmail(user, otp);
      
    res.status(statusCode).json({
      success: true,
      message: "Verification OTP email sent",
      data: {
        userId: user._id,
        email: user.email
      },
    });
  } catch (err) {
    console.log(err.stack);
    res
      .status(400)
      .json({ success: false, error: "Cannot send verification email" });
  }
};

const sendEmail = (user, otp) => {
    // send otp to email
    const transporter = nodemailer.createTransport({
        service: "Gmail",
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.AUTH_EMAIL,
          pass: process.env.AUTH_PASS,
        },
    });

    const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: user.email,
        subject: "Authentication from CU Restaurant",
        html: `<p>Hi, ${user.name}</p><br>
            <p>To authenticate, please use the following One Time Password (OTP): ${otp}</p>
            <p>This OTP will be valid for 10 minutes.</p>
            <p>Do not share this OTP with anyone. If you didn't make this request, you can safely ignore this email.<br>CU Restaurant will never contact you about this email or ask for any login codes or links. Beware of phishing scams.</p>
            <p>Thanks for visiting CU Restaurant!</p>`,
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email: ", error);
        } else {
          console.log("Email sent: ", info.response);
        }
    });
}

exports.getMe = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, data: user });
};

exports.logout = async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    data: {},
  });
};
