import express from 'express';
import multer from 'multer';
import { File } from '../models/File';
import { PDFParse } from 'pdf-parse';


const router = express.Router();

// Configure multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Upload a file
// @ts-ignore
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { projectId } = req.body;
        if (!projectId) {
            return res.status(400).json({ message: 'Project ID is required' });
        }


        let content = '';

        // Extract text based on file type
        if (req.file.mimetype === 'application/pdf') {
            const parser = new PDFParse({ data: req.file.buffer });
            const data = await parser.getText();
            content = data.text;
            await parser.destroy();
        } else if (req.file.mimetype === 'text/plain') {
            content = req.file.buffer.toString('utf-8');
        } else {


            // Allow PDF and Text. Can add more types if needed.
            return res.status(400).json({ message: 'Unsupported file type. Only PDF and Text files are allowed.' });
        }

        // Create File record
        const newFile = new File({
            filename: req.file.originalname,
            content: content.trim(),
            projectId: projectId,
        });

        await newFile.save();

        res.status(201).json(newFile);
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ message: 'Error processing file upload', details: error instanceof Error ? error.message : String(error) });
    }
});

// Get files for a project
router.get('/:projectId', async (req, res) => {
    try {
        const files = await File.find({ projectId: req.params.projectId }).select('filename createdAt');
        res.json(files);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching files' });
    }
});

// Delete a file
router.delete('/:id', async (req, res) => {
    try {
        await File.findByIdAndDelete(req.params.id);
        res.json({ message: 'File deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting file' });
    }
});

export default router;
