const Appointment = require('../models/Appointment');
const nodemailer = require('nodemailer');

exports.sendNotification = async () => {
   try {
        let appointments = await Appointment.find({ notify: false }).populate([
            {
                path: 'restaurant',
                select: 'name district province note tel'
            },
            {
                path: 'user',
                select: 'name email'
            }
        ]);
        appointments.forEach(async appt => {

            const apptDateUTC = new Date(appt.apptDate);
            // Subtract 1 day (24 hours) in milliseconds
            const notifyTime = apptDateUTC.getTime() - (24 * 60 * 60 * 1000);
            const nowUTC = Date.now();
        
            if (nowUTC >= notifyTime) {
                sendEmail(appt);
                await Appointment.findByIdAndUpdate(appt._id, { notify: true });
                console.log("Sent notification appt Id" + appt._id);
            }
        });
        
    } catch (err) {
        console.log('sending notifiation failed');
        console.log(err.stack);
    }  
};

const sendEmail = (appt) => {
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
        to: appt.user.email,
        subject: "[Notification] from CU Restaurant",
        html: `<p>Dear, ${appt.user.name}</p><br>
            <p>This is a reminder that you have a restaurant reservation at ${appt.restaurant.name}</p>
            <p>📅 Date: ${appt.apptDate}</p>
            <p>👥 Seats: ${appt.seat}</p>
            <p>📍 Location: ${appt.restaurant.district} ${appt.restaurant.province}</p>
            <p>📝 Note: ${appt.note == '' ? '-': appt.note}</p>
            <p>If you need to modify or cancel your reservation, please contact restaurant tel : ${appt.restaurant.tel}</p><br>
            <p>Warm regards,</p>
            <p>CU Restaurant Team</p>`,
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email: ", error);
        } else {
          console.log("Email sent: ", info.response);
        }
    });
}