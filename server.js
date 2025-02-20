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
try {
    require('./config/passport'); 
} catch (error) {
    console.error("Passport config file not found. Ensure './config/passport.js' exists.");
    process.exit(1);
}

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("✅ Connected to MongoDB");
}).catch(err => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
});

// ✅ Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ✅ Session Configuration (Improved Security)
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key', // 🔥 Use environment variable
    resave: false, 
    saveUninitialized: false, 
    cookie: { maxAge: 1000 * 60 * 60 } // 1-hour session timeout
}));

// ✅ Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// ✅ Set View Engine & Static Folder
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Home Route (Redirect if Not Authenticated)
app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/files');
    }
    res.redirect('/login'); 
});

// ✅ Define Routes
app.use('/', require('./routes/authRoutes'));
app.use('/files', require('./routes/fileRoutes'));

// ✅ Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something went wrong! Try again later.");
});

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
