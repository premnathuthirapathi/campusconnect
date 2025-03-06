const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const File = require('../models/File');

const router = express.Router();

// Ensure Uploads Directory Exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Authentication Middleware
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
};

const ensureAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === 'admin') return next();
    res.redirect('/');
};

// User Dashboard - Show Categories
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const categories = await File.distinct('category');
        res.render('categories', { user: req.user, categories });
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).send("Server error.");
    }
});

// Admin Panel - Show Uploaded Files
router.get('/admin', ensureAdmin, async (req, res) => {
    try {
        const files = await File.find();
        res.render('admin', { user: req.user, files });
    } catch (error) {
        console.error("Error fetching files:", error);
        res.status(500).send("Server error.");
    }
});

// File Upload (Admin Only)
router.post('/upload', ensureAdmin, upload.single('file'), async (req, res) => {
    try {
        const { title, description } = req.body;

        // Auto-assign category based on title keywords
        const categories = {
            "Technology": ["tech", "software", "computer", "ai"],
            "Business": ["finance", "business", "startup", "investment"],
            "Health": ["medicine", "health", "fitness", "doctor"],
            "Education": ["school", "college", "university", "learning"]
        };

        let selectedCategory = "Others";
        const titleLower = title ? title.toLowerCase() : "";
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => titleLower.includes(keyword))) {
                selectedCategory = category;
                break;
            }
        }

        await File.create({
            filename: req.file.filename,
            category: selectedCategory,
            title,
            description
        });

        res.redirect('/files/admin');
    } catch (error) {
        console.error("File upload error:", error);
        res.status(500).send("Server error during file upload.");
    }
});

// File Download Route
router.get('/download/:id', ensureAuthenticated, async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) {
            return res.status(404).send("File not found.");
        }

        const filePath = path.join(__dirname, '../uploads/', file.filename);
        res.download(filePath);
    } catch (error) {
        console.error("File download error:", error);
        res.status(500).send("Server error during file download.");
    }
});

// File Delete Route (Admin Only)
router.post('/delete/:id', ensureAdmin, async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) {
            return res.status(404).send("File not found.");
        }

        // Delete file from storage
        const filePath = path.join(__dirname, '../uploads/', file.filename);
        fs.unlink(filePath, (err) => {
            if (err) console.error("File deletion error:", err);
        });

        // Remove file record from database
        await File.findByIdAndDelete(req.params.id);
        res.redirect('/files/admin');
    } catch (error) {
        console.error("File deletion error:", error);
        res.status(500).send("Server error during file deletion.");
    }
});

module.exports = router;
