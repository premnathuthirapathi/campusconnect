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

// 🏠 User Dashboard - Show Categories
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const categories = await File.distinct('category');
        res.render('categories', { user: req.user, categories });
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).send("Server error.");
    }
});

// 📂 Show Files in a Specific Category
router.get('/category/:category', ensureAuthenticated, async (req, res) => {
    try {
        const files = await File.find({ category: req.params.category });
        if (files.length === 0) {
            return res.status(404).send("No files found in this category.");
        }
        res.render('categoryFiles', { user: req.user, category: req.params.category, files });
    } catch (error) {
        console.error("Error fetching category files:", error);
        res.status(500).send("Server error.");
    }
});

// 🔧 Admin Panel - Show Uploaded Files
router.get('/admin', ensureAdmin, async (req, res) => {
    try {
        const files = await File.find();
        res.render('admin', { user: req.user, files });
    } catch (error) {
        console.error("Error fetching files:", error);
        res.status(500).send("Server error.");
    }
});

// 📤 File Upload (Admin Only)
router.post('/upload', ensureAdmin, upload.single('file'), async (req, res) => {
    try {
        const { title, description } = req.body;

        // Auto-assign category based on title keywords
        const categories = {
            "Events": [
                "seminar", "workshop", "cultural", "guest lecture", "tech fest",
    "conference", "webinar", "celebration", "event schedule", "annual day"
  ],
"Academic": [
    "syllabus", "assignments", "curriculum", "class schedule",
    "study material", "lesson plan", "attendance", "academic calendar",
    "faculty schedule", "notes", "online class", "course registration"
  ],
  "Examination": [
    "exam schedule", "results", "hall ticket", "internal assessment",
    "revaluation", "marks", "exam fee", "question paper", "model exam",
    "exam pattern", "practical exam", "exam center", "exam rules", "Time table", "Viva"
  ],
  "Placement": [
    "interview", "recruitment", "company visit", "internship", "job fair",
    "offer letter", "HR talk", "campus drive", "resume submission",
    "aptitude test", "placement training", "pre-placement talk",
    "mock interview", "skill test"
  ],
  "Department Circulars": [
    "dept notice", "internal meeting", "lab schedule", "faculty announcement",
    "project submission", "department update", "work allocation",
    "internal circular", "faculty meeting", "lab maintenance",
    "department rules", "committee meeting", "project review"
  ],
  "CELLS": [
    "NSS", "NCC", "IQAC", "Research Cell", "Entrepreneurship Cell",
    "Innovation Cell", "Grievance Cell", "Anti-ragging Cell", "Alumni Cell",
    "Women's Cell", "Eco Club", "Social Responsibility", "Student Council"
  ],
  "Hod Meeting": [
    "hod meeting",
    "departmental meeting",
    "faculty discussion",
    "academic heads",
    "meeting schedule",
    "administrative updates",
    "department coordination"
  ],
  "CCM": [
    "class committee",
    "ccm meeting",
    "student-faculty discussion",
    "semester feedback",
    "academic review",
    "internal assessment review",
    "course improvement"
  ],
  "Exam Fees": [
    "exam fees",
    "fee payment",
    "exam fee notification",
    "academic fees",
    "examination charges",
    "semester fees",
    "payment due"
  ],
  "Leave Details": [
    "leave application",
    "student leave",
    "faculty leave",
    "leave approval",
    "absent report",
    "leave policy",
    "attendance record"
  ],
  "IAE Schedule": [
    "iae schedule",
    "internal exam",
    "assessment timetable",
    "test schedule",
    "midterm exam",
    "academic test",
    "semester test"
  ]
        };

        let selectedCategory = "General";
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

// 📥 File Download Route
router.get('/download/:id', ensureAuthenticated, async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) {
            return res.status(404).send("File not found.");
        }

        const filePath = path.join(__dirname, '../uploads/', file.filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).send("File does not exist.");
        }

        res.download(filePath);
    } catch (error) {
        console.error("File download error:", error);
        res.status(500).send("Server error during file download.");
    }
});

// ❌ File Delete Route (Admin Only)
router.post('/delete/:id', ensureAdmin, async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) {
            return res.status(404).send("File not found.");
        }

        // Delete file from storage (check existence first)
        const filePath = path.join(__dirname, '../uploads/', file.filename);
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) console.error("File deletion error:", err);
            });
        }

        // Remove file record from database
        await File.findByIdAndDelete(req.params.id);
        res.redirect('/files/admin');
    } catch (error) {
        console.error("File deletion error:", error);
        res.status(500).send("Server error during file deletion.");
    }
});

module.exports = router;
