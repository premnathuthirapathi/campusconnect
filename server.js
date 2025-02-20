const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const File = require('./models/File');
const User = require('./models/User');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect('mongodb+srv://prem:Dark3601@cluster0.bknrv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to MongoDB");
}).catch(err => {
    console.error(err);
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Set View Engine
app.set('view engine', 'ejs');

// Define Routes
app.use('/', require('./routes/authRoutes'));
app.use('/files', require('./routes/fileRoutes'));

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
