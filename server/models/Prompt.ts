import mongoose from 'mongoose';

const promptSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    createdAt: { type: Date, default: Date.now },
});

export const Prompt = mongoose.model('Prompt', promptSchema);
