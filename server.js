const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const dotenv = require('dotenv');
const File = require('./models/File');
const User = require('./models/User');

dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Load Passport Config Before Using It
require('./config/passport'); 

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to MongoDB");
}).catch(err => {
    console.error("MongoDB Connection Error:", err);
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Set View Engine & Static Folder
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Home Route (Fix for "Cannot GET /")
app.get('/', (req, res) => {
    res.render('login');  // Change to 'signup' if you want signup as default
});

// Define Routes
app.use('/', require('./routes/authRoutes'));
app.use('/files', require('./routes/fileRoutes'));

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
