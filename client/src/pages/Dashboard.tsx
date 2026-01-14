import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

interface Project {
    _id: string;
    name: string;
    description: string;
    createdAt: string;
}

const Dashboard = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDescription, setNewProjectDescription] = useState('');

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            setProjects(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const createProject = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/projects', {
                name: newProjectName,
                description: newProjectDescription,
            });
            setShowModal(false);
            setNewProjectName('');
            setNewProjectDescription('');
            fetchProjects();
        } catch (err) {
            console.error(err);
        }
    };

    const deleteProject = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this project? All associated files and chats will be lost.')) return;

        try {
            await api.delete(`/projects/${id}`);
            fetchProjects();
        } catch (err: any) {
            console.error(err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to delete project';
            alert(errorMessage);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight">Dashboard</h1>
                    <p className="text-gray-400 mt-2 text-sm md:text-base">Manage your AI agents and projects.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
                >
                    <span>+ New Project</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <div key={project._id} className="relative group">
                        <Link
                            to={`/project/${project._id}`}
                            className="block glass-card p-6 rounded-2xl hover:bg-white/10 transition-all duration-300 cursor-pointer border border-white/5 hover:border-blue-500/30 relative overflow-hidden h-full"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative z-10">
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors pr-8">{project.name}</h3>
                                <p className="text-gray-400 text-sm line-clamp-2 mb-4 group-hover:text-gray-300">{project.description}</p>
                                <div className="flex justify-between items-center text-xs text-gray-500 mt-4 border-t border-white/5 pt-4">
                                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                                    <span className="text-blue-500/70 group-hover:text-blue-400 flex items-center">
                                        Open Project &rarr;
                                    </span>
                                </div>
                            </div>
                        </Link>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                deleteProject(project._id);
                            }}
                            className="absolute top-4 right-4 z-20 p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Delete Project"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>

                ))}

                {projects.length === 0 && (
                    <div className="col-span-full text-center py-20 text-gray-500 glass rounded-2xl border-dashed border-2 border-gray-700">
                        <p>No projects yet. Create your first agent!</p>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="glass-card w-full max-w-md p-8 rounded-2xl shadow-2xl animate-slide-up border border-white/10 bg-[#0f172a]">
                        <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Create New Project</h2>
                        <form onSubmit={createProject} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Project Name</label>
                                <input
                                    type="text"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                                <textarea
                                    value={newProjectDescription}
                                    onChange={(e) => setNewProjectDescription(e.target.value)}
                                    className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none transition-all h-32 resize-none"
                                />
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2 rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
