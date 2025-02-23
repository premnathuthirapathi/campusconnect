// server.js
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const File = require('./models/File');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;

// Load Passport Configuration
try {
  require('./config/passport');
  console.log("✅ Passport config loaded successfully.");
} catch (error) {
  console.error("❌ Passport config file not found. Ensure './config/passport.js' exists.");
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("✅ Connected to MongoDB");
}).catch(err => {
  console.error("❌ MongoDB Connection Error:", err);
  process.exit(1);
});

// Express Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// View Engine & Static Folder
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Home Route: Redirect to /files if authenticated, else /login
app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/files');
  }
  res.redirect('/login');
});

// Define Routes
app.use('/', require('./routes/authRoutes'));
app.use('/files', require('./routes/fileRoutes'));

// Debug route to inspect session and user
app.get('/debug-session', (req, res) => {
  console.log("Session Data:", req.session);
  console.log("User Data:", req.user);
  res.json({ session: req.session, user: req.user });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Global Error Handler:", err.stack);
  res.status(500).send("Something went wrong! Try again later.");
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
