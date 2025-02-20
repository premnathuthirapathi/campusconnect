// models/File.js
const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    category: { type: String, required: true },
    // Add these fields
    title: { type: String, default: '' },
    description: { type: String, default: '' }
});

const File = mongoose.model('File', fileSchema);

module.exports = File;
