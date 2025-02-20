const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

// Signup Route
router.get('/signup', (req, res) => {
    res.render('signup');
});

router.post('/signup', async (req, res) => {
    const { username, password, role } = req.body;

    try {
        // Hash Password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({ username, password: hashedPassword, role });
        await user.save();

        res.redirect('/login');
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).send("Error signing up.");
    }
});

// Login Route
router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            return res.redirect('/login'); // Failed login
        }
        req.logIn(user, (err) => {
            if (err) return next(err);
            return res.redirect('/files'); // Successful login
        });
    })(req, res, next);
});

// Logout Route
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/login');
    });
});

module.exports = router;
