const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const File = require('../models/File');

const router = express.Router();

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
};

const ensureAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === 'admin') return next();
    res.redirect('/');
};

// User Dashboard
router.get('/', ensureAuthenticated, async (req, res) => {
    const categories = await File.distinct('category');
    res.render('categories', { user: req.user, categories });
});

// Admin Panel
router.get('/admin', ensureAdmin, async (req, res) => {
    const files = await File.find();
    res.render('admin', { user: req.user, files });
});

// File Upload (Admin Only)
router.post('/upload', ensureAdmin, upload.single('file'), async (req, res) => {
    const { title, description, category } = req.body;
    await File.create({
        filename: req.file.filename,
        category: category || 'uncategorized',
        title,
        description
    });
    res.redirect('/files/admin');
});

module.exports = router;
