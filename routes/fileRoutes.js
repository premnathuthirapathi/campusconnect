// routes/fileRoutes.js
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const File = require('../models/File');
const { getCategory } = require('../utils/categoryHelper');

const router = express.Router();

// Ensure 'uploads' directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

/**
 * (Optional) File Filter: restrict allowed extensions.
 */
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpg|jpeg|png|gif|pdf|doc|docx/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type!'), false);
  }
};

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Append timestamp to avoid filename conflicts
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  fileFilter // Remove if you want to allow all file types
});

// Middleware to ensure user is authenticated
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
};

// Middleware to ensure admin access
const ensureAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') return next();
  res.redirect('/login');
};

// GET /files - Dashboard: Show all files to authenticated users
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const files = await File.find();
    res.render('files', { user: req.user, files });
  } catch (err) {
    console.error('Error fetching files:', err);
    res.status(500).send('Internal Server Error');
  }
});

// POST /files/upload - Upload file (Admin Only)
router.post('/upload', ensureAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('No file uploaded.');

    // Capture title and description from form
    const { title, description } = req.body;
    // Auto-determine category based on title keywords
    const category = getCategory(title);

    // Store file in the database
    await File.create({
      filename: req.file.filename,
      category,
      title,
      description
    });

    res.redirect('/files/admin');
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).send('Internal Server Error');
  }
});

// GET /files/category/:category - Show files by category
router.get('/category/:category', ensureAuthenticated, async (req, res) => {
  try {
    const { category } = req.params;
    const files = await File.find({ category });
    res.render('categoryFiles', { user: req.user, files, category });
  } catch (err) {
    console.error('Error fetching category files:', err);
    res.status(500).send('Internal Server Error');
  }
});

// GET /files/admin - Admin panel
router.get('/admin', ensureAdmin, async (req, res) => {
  try {
    const files = await File.find();
    res.render('admin', { user: req.user, files });
  } catch (err) {
    console.error('Error loading admin panel:', err);
    res.status(500).send('Internal Server Error');
  }
});

// GET /files/view/:id - Inline viewing for PDFs & images; force download for others
router.get('/view/:id', ensureAuthenticated, async (req, res) => {
  try {
    const fileRecord = await File.findById(req.params.id);
    if (!fileRecord) return res.status(404).send('File not found.');

    const filePath = path.join(__dirname, '..', 'uploads', fileRecord.filename);
    const ext = path.extname(fileRecord.filename).toLowerCase();

    switch (ext) {
      case '.pdf':
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${fileRecord.filename}"`);
        break;
      case '.jpg':
      case '.jpeg':
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Content-Disposition', `inline; filename="${fileRecord.filename}"`);
        break;
      case '.png':
      case '.gif':
        res.setHeader('Content-Type', `image/${ext.slice(1)}`);
        res.setHeader('Content-Disposition', `inline; filename="${fileRecord.filename}"`);
        break;
      default:
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${fileRecord.filename}"`);
        break;
    }

    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error('Error streaming file:', err);
    res.status(500).send('Internal Server Error');
  }
});

// GET /files/:id - Default download route
router.get('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const fileRecord = await File.findById(req.params.id);
    if (!fileRecord) return res.status(404).send('File not found.');
    const filePath = path.join(__dirname, '..', 'uploads', fileRecord.filename);

    res.download(filePath, fileRecord.filename, (err) => {
      if (err) console.error('Error downloading file:', err);
    });
  } catch (err) {
    console.error('Error fetching file by ID:', err);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
