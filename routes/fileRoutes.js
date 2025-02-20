const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const File = require('../models/File');
const { getCategory } = require('../utils/categoryHelper');

const router = express.Router();

// ✅ Ensure 'uploads' directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// ✅ Multer File Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Avoid filename conflicts
    }
});
const upload = multer({ storage });

// ✅ Middleware: Ensure Admin Authentication
const ensureAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === 'admin') {
        return next();
    }
    res.redirect('/login'); // 🔥 Redirect non-admin users
};

// ✅ File Upload Route (Admin Only)
router.post('/upload', ensureAdmin, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }
        const category = getCategory(req.file.filename);
        await File.create({ filename: req.file.filename, category });
        res.redirect('/admin');
    } catch (err) {
        console.error('Error uploading file:', err);
        res.status(500).send('Internal Server Error');
    }
});

// ✅ Get Files by Category
router.get('/category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const files = await File.find({ category });
        res.render('categoryFiles', { files, category });
    } catch (err) {
        console.error('Error fetching category files:', err);
        res.status(500).send('Internal Server Error');
    }
});

// ✅ Admin Panel (Admin Only)
router.get('/admin', ensureAdmin, async (req, res) => {
    try {
        const files = await File.find();
        res.render('admin', { files });
    } catch (err) {
        console.error('Error loading admin panel:', err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
