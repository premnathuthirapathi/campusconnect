// routes/fileRoutes.js

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const File = require('../models/File');
const { getCategory } = require('../utils/categoryHelper');

const router = express.Router();

// Allowed categories (customize as needed)
const allowedCategories = ['documents', 'images', 'videos', 'audio'];

// Ensure 'uploads' directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer File Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Middleware: Ensure User Authentication
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
};

// Middleware: Ensure Admin Authentication
const ensureAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === 'admin') {
        return next();
    }
    res.redirect('/login');
};

// GET /files/category/:category -> Show files by category
router.get('/category/:category', ensureAuthenticated, async (req, res) => {
    try {
        let { category } = req.params;
        category = category.toLowerCase();

        // Check if category is allowed
        if (!allowedCategories.includes(category)) {
            return res.status(404).send('Category not found.');
        }

        const files = await File.find({ category });
        
        // If no files, you can pass an empty array or a message
        if (!files || files.length === 0) {
            return res.render('categoryFiles', { files: [], category, message: 'No files found for this category.' });
        }

        res.render('categoryFiles', { files, category, message: null });
    } catch (err) {
        console.error('Error fetching category files:', err);
        res.status(500).send('Internal Server Error');
    }
});

// ... Other routes (unchanged)

module.exports = router;
