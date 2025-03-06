const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const File = require('../models/File');
const { getCategory } = require('../utils/categoryHelper');

const router = express.Router();

// -------------------------------------------
// 1. Ensure 'uploads' directory exists
// -------------------------------------------
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

// -------------------------------------------
// 2. Multer configuration
// -------------------------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Append timestamp to avoid filename conflicts
    const uniqueName = Date.now() + path.extname(file.originalname);
    console.log("Saving file as:", uniqueName);
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage,
  fileFilter // Remove if you want to allow all file types
});

// -------------------------------------------
// 3. Middleware: Ensure Auth
// -------------------------------------------
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  req.flash('error_msg', 'Please log in to access this page.');
  res.redirect('/login');
};

const ensureAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') return next();
  req.flash('error_msg', 'Unauthorized access.');
  res.redirect('/');
};

// -------------------------------------------
// 4. GET /files - Show file categories (User Dashboard)
// -------------------------------------------
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const categories = await File.distinct('category');
    res.render('categories', { user: req.user, categories });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).send('Internal Server Error');
  }
});

// -------------------------------------------
// 5. GET /files/category/:category - Show files by category
// -------------------------------------------
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

// -------------------------------------------
// 6. GET /files/admin - Admin panel to manage files
// -------------------------------------------
router.get('/admin', ensureAdmin, async (req, res) => {
  try {
    const files = await File.find();
    res.render('admin', { user: req.user, files });
  } catch (err) {
    console.error('Error loading admin panel:', err);
    res.status(500).send('Internal Server Error');
  }
});

// -------------------------------------------
// 7. POST /files/upload - Upload file (Admin Only)
// -------------------------------------------
router.post('/upload', ensureAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('No file uploaded.');

    // Log what Multer gave us
    console.log("Uploaded file info:", req.file);

    // Capture title and description from form
    const { title, description } = req.body;
    // Auto-determine category based on title keywords
    const category = getCategory(title);

    // Store file in the database
    const newFile = await File.create({
      filename: req.file.filename,
      category,
      title,
      description
    });

    console.log("File record created in DB:", newFile);

    res.redirect('/files/admin');
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).send('Internal Server Error');
  }
});

// -------------------------------------------
// 8. GET /files/view/:id - Inline viewing for PDFs/images
// -------------------------------------------
router.get('/view/:id', ensureAuthenticated, async (req, res) => {
  try {
    const fileRecord = await File.findById(req.params.id);
    if (!fileRecord) return res.status(404).send('File not found.');

    const filePath = path.join(__dirname, '..', 'uploads', fileRecord.filename);
    console.log("Trying to read file at:", filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error("File does not exist on disk:", filePath);
      return res.status(404).send('File not found on disk.');
    }

    const ext = path.extname(fileRecord.filename).toLowerCase();
    switch (ext) {
      case '.pdf':
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${fileRecord.filename}"`);
        break;
      case '.jpg':
      case '.jpeg':
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

// -------------------------------------------
// 9. GET /files/:id - Download route
// -------------------------------------------
router.get('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const fileRecord = await File.findById(req.params.id);
    if (!fileRecord) return res.status(404).send('File not found.');

    const filePath = path.join(__dirname, '..', 'uploads', fileRecord.filename);
    console.log("Trying to download file at:", filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error("File does not exist on disk:", filePath);
      return res.status(404).send('File not found on disk.');
    }

    res.download(filePath, fileRecord.filename, (err) => {
      if (err) console.error('Error downloading file:', err);
    });
  } catch (err) {
    console.error('Error fetching file by ID:', err);
    res.status(500).send('Internal Server Error');
  }
});

// -------------------------------------------
// 10. DELETE /files/:id - Delete file (Admin Only)
// -------------------------------------------
router.delete('/:id', ensureAdmin, async (req, res) => {
  try {
    const fileRecord = await File.findById(req.params.id);
    if (!fileRecord) return res.status(404).send('File not found.');

    const filePath = path.join(__dirname, '..', 'uploads', fileRecord.filename);

    // Remove file from disk
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove file record from DB
    await File.findByIdAndDelete(req.params.id);
    console.log(`Deleted file: ${filePath}`);

    res.status(200).send('File deleted successfully.');
  } catch (err) {
    console.error('Error deleting file:', err);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
