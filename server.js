const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const cors = require('cors');
const mongoSanitize=require('express-mongo-sanitize');
const helmet=require('helmet');
const {xss}=require('express-xss-sanitizer');
const rateLimit=require('express-rate-limit');
const hpp=require('hpp');
const cron = require('node-cron');
// route file
const auth = require('./routes/auth');
const appointments = require('./routes/appointments');
const restaurants = require('./routes/restaurants');
const {sendNotification} = require('./controllers/notifications');

dotenv.config({path: './config/config.env'});

// connect to database
connectDB();

const app = express();
// allow cors
app.use(cors());
// app.use(cors({
//     origin: "http://localhost:3000",  // Allow frontend to access backend
//     credentials: true,  // Allow cookies & authentication headers
// }));

// body parser
app.use(express.json());

// cookie parser
app.use(cookieParser());
//Sanitize data
app.use(mongoSanitize());
//Set security headers
app.use(helmet());
//Prevent XSS attacks
app.use(xss());
// Rate Limiting
const limiter=rateLimit({
    windowsMs:10*60*1000,//10 mins
    max: 100
});
app.use(limiter);
//Prevent http param pollutions
app.use(hpp());

// routers
app.use('/api/v1/appointments', appointments);
app.use('/api/v1/restaurants', restaurants);
app.use('/api/v1/auth', auth);

const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, console.log('Server running in', process.env.NODE_ENV, ' mode on port ', PORT));

// 0 0 * * * * for every day at midnight
cron.schedule('0 */1 * * *', () => {
    console.log('running a schedule task');
    sendNotification();
});

process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    server.close(() => process.exit(1));
});