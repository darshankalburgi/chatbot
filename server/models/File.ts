import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    content: { type: String, required: true }, // Extracted text content
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    createdAt: { type: Date, default: Date.now },
});

export const File = mongoose.model('File', fileSchema);
