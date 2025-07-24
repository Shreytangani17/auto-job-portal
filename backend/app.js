var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.use('/', indexRouter);
app.use('/users', usersRouter);

// Example scheduled job: log a message every minute
cron.schedule('* * * * *', () => {
  console.log('Scheduled job: This runs every minute!');
});

// 1. Send an email every day at 8am
cron.schedule('0 8 * * *', async () => {
  console.log('Scheduled job: Sending daily email at 8am');
  // Configure your transporter (replace with real credentials in production)
  let transporter = nodemailer.createTransport({
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: {
      user: 'your@email.com',
      pass: 'yourpassword',
    },
  });
  // Send a test email (replace with real recipient)
  try {
    await transporter.sendMail({
      from: 'your@email.com',
      to: 'recipient@email.com',
      subject: 'Daily Notification',
      text: 'This is your daily scheduled email!',
    });
    console.log('Email sent!');
  } catch (err) {
    console.error('Failed to send email:', err.message);
  }
});

// 2. Clean up data every hour
cron.schedule('0 * * * *', () => {
  console.log('Scheduled job: Cleaning up data every hour!');
  // Add your data cleanup logic here
});

// 3. Push notification every 5 minutes
cron.schedule('*/5 * * * *', () => {
  console.log('Scheduled job: Push notification every 5 minutes!');
  // Add your push notification logic here
});

module.exports = app;
