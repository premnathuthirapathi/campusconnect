const express = require('express');
const multer = require('multer');
const File = require('../models/File');
const { getCategory } = require('../utils/categoryHelper'); 

const router = express.Router();

// Multer File Storage
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// File Upload Route
router.post('/upload', upload.single('file'), async (req, res) => {
    const category = getCategory(req.file.filename);
    await File.create({ filename: req.file.filename, category });
    res.redirect('/admin');
});

// Files by Category
router.get('/category/:category', async (req, res) => {
    const { category } = req.params;
    const files = await File.find({ category });
    res.render('categoryFiles', { files, category });
});

// Admin Panel Route
router.get('/admin', async (req, res) => {
    const files = await File.find();
    res.render('admin', { files });
});

module.exports = router;
