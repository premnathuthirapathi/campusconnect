// routes/fileRoutes.js

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

// ✅ Multer File Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Append timestamp to avoid filename conflicts
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// ✅ Middleware: Ensure User Authentication
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
};

// ✅ Middleware: Ensure Admin Authentication
const ensureAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === 'admin') {
        return next();
    }
    res.redirect('/login');
};

// ------------------------------------------------------
// GET /files -> Show all files to authenticated users
// ------------------------------------------------------
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const files = await File.find();
        // Render the 'files' view with user and files data
        res.render('files', { user: req.user, files });
    } catch (err) {
        console.error('Error fetching files:', err);
        res.status(500).send('Internal Server Error');
    }
});

// ------------------------------------------------------
// POST /files/upload -> Upload new file (Admin Only)
// ------------------------------------------------------
router.post('/upload', ensureAdmin, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }
        // Retrieve the category from the helper
        const category = getCategory(req.file.filename);
        // Save file info in the database (optionally add title/description fields)
        await File.create({ filename: req.file.filename, category });
        res.redirect('/files/admin');
    } catch (err) {
        console.error('Error uploading file:', err);
        res.status(500).send('Internal Server Error');
    }
});

// ------------------------------------------------------
// GET /files/category/:category -> Show files by category
// ------------------------------------------------------
router.get('/category/:category', ensureAuthenticated, async (req, res) => {
    try {
        const { category } = req.params;
        const files = await File.find({ category });
        res.render('categoryFiles', { files, category });
    } catch (err) {
        console.error('Error fetching category files:', err);
        res.status(500).send('Internal Server Error');
    }
});

// ------------------------------------------------------
// GET /files/admin -> Admin Panel to manage files
// ------------------------------------------------------
router.get('/admin', ensureAdmin, async (req, res) => {
    try {
        const files = await File.find();
        res.render('admin', { files });
    } catch (err) {
        console.error('Error loading admin panel:', err);
        res.status(500).send('Internal Server Error');
    }
});

// ------------------------------------------------------
// GET /files/:id -> Download/View a file by ID (Optional)
// ------------------------------------------------------
router.get('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const fileRecord = await File.findById(req.params.id);
        if (!fileRecord) {
            return res.status(404).send('File not found.');
        }
        const filePath = path.join(__dirname, '..', 'uploads', fileRecord.filename);
        // Download the file
        res.download(filePath, fileRecord.filename, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
            }
        });
    } catch (err) {
        console.error('Error fetching file by ID:', err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
