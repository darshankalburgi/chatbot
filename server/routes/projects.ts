import express from 'express';
import { Project } from '../models/Project';
import { Prompt } from '../models/Prompt';
import { Message } from '../models/Message';
import { File } from '../models/File';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to verify token
const authenticate = (req: any, res: any, next: any) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Access denied' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET as string);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid token' });
    }
};

// Get all projects for user
router.get('/', authenticate, async (req: any, res) => {
    try {
        const projects = await Project.find({ userId: req.user.userId });
        res.json(projects);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching projects' });
    }
});

// Get single project
router.get('/:id', authenticate, async (req: any, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, userId: req.user.userId });
        if (!project) return res.status(404).json({ message: 'Project not found' });
        res.json(project);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching project' });
    }
});

// Create project
router.post('/', authenticate, async (req: any, res) => {
    try {
        const project = new Project({ ...req.body, userId: req.user.userId });
        await project.save();
        res.status(201).json(project);
    } catch (err) {
        res.status(400).json({ message: 'Error creating project' });
    }
});

// Create prompt for project
router.post('/:projectId/prompts', authenticate, async (req: any, res) => {
    try {
        const prompt = new Prompt({ ...req.body, projectId: req.params.projectId });
        await prompt.save();
        res.status(201).json(prompt);
    } catch (err) {
        res.status(400).json({ message: 'Error creating prompt' });
    }
});

// Get prompts for project
router.get('/:projectId/prompts', authenticate, async (req: any, res) => {
    try {
        const prompts = await Prompt.find({ projectId: req.params.projectId });
        res.json(prompts);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching prompts' });
    }
});

// Delete project and all its associated data
router.delete('/:id', authenticate, async (req: any, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, userId: req.user.userId });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Delete associated data
        await Promise.all([
            Message.deleteMany({ projectId: req.params.id }),
            Prompt.deleteMany({ projectId: req.params.id }),
            File.deleteMany({ projectId: req.params.id }),
            Project.findByIdAndDelete(req.params.id)
        ]);

        res.json({ message: 'Project and all associated data deleted successfully' });
    } catch (err) {
        console.error('Delete project error:', err);
        res.status(500).json({ message: 'Error deleting project' });
    }
});

export default router;
