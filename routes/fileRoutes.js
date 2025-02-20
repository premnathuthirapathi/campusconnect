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
        // Pass user object so EJS can use it
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
        const category = getCategory(req.file.filename);
        // Optionally add title/description to File.create(...)
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
        // Pass user object if needed in categoryFiles.ejs
        res.render('categoryFiles', { user: req.user, files, category });
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
        // IMPORTANT: pass user: req.user so admin.ejs can use user
        res.render('admin', { user: req.user, files });
    } catch (err) {
        console.error('Error loading admin panel:', err);
        res.status(500).send('Internal Server Error');
    }
});

// ------------------------------------------------------
// GET /files/view/:id -> Stream the file inline (e.g., PDFs)
// ------------------------------------------------------
router.get('/view/:id', ensureAuthenticated, async (req, res) => {
    try {
        const fileRecord = await File.findById(req.params.id);
        if (!fileRecord) {
            return res.status(404).send('File not found.');
        }
        const filePath = path.join(__dirname, '..', 'uploads', fileRecord.filename);

        // Example for PDFs: set inline content disposition
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="' + fileRecord.filename + '"');

        // Stream the file
        fs.createReadStream(filePath).pipe(res);

    } catch (err) {
        console.error('Error streaming file:', err);
        res.status(500).send('Internal Server Error');
    }
});

// ------------------------------------------------------
// GET /files/:id -> Download/View a file by ID (Default Download)
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
