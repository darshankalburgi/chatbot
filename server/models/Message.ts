import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    role: { type: String, required: true, enum: ['user', 'assistant', 'system'] },
    content: { type: String, required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    createdAt: { type: Date, default: Date.now },
});

export const Message = mongoose.model('Message', messageSchema);
