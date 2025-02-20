const express = require('express');
const passport = require('passport');
const User = require('../models/User');

const router = express.Router();

// Signup Route
router.get('/signup', (req, res) => {
    res.render('signup');
});

router.post('/signup', async (req, res) => {
    const { username, password, role } = req.body;
    const user = new User({ username, password, role });
    await user.save();
    res.redirect('/login');
});

// Login Route
router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login', passport.authenticate('local', {
    successRedirect: '/files',
    failureRedirect: '/login'
}));

// Logout Route
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/login');
    });
});

module.exports = router;
