import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import ChatInterface from '../components/ChatInterface';

interface Prompt {
    _id: string;
    title: string;
    content: string;
}

interface Project {
    _id: string;
    name: string;
    description: string;
    prompts: Prompt[];
}

interface FileData {
    _id: string;
    filename: string;
    createdAt: string;
}

const ProjectView = () => {
    const { id } = useParams<{ id: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [files, setFiles] = useState<FileData[]>([]);

    // UI State
    const [activeTab, setActiveTab] = useState<'prompts' | 'files'>('prompts');
    const [showPromptModal, setShowPromptModal] = useState(false);
    const [newPromptTitle, setNewPromptTitle] = useState('');
    const [newPromptContent, setNewPromptContent] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const fetchProjectData = async () => {
        try {
            const [projRes, promptsRes, filesRes] = await Promise.all([
                api.get(`/projects/${id}`),
                api.get(`/projects/${id}/prompts`),
                api.get(`/files/${id}`)
            ]);
            setProject(projRes.data);
            setPrompts(promptsRes.data);
            setFiles(filesRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (id) fetchProjectData();
    }, [id]);

    const createPrompt = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(`/projects/${id}/prompts`, {
                title: activeTab === 'prompts' ? newPromptTitle : 'System Prompt', // Fallback
                content: newPromptContent
            });
            setShowPromptModal(false);
            setNewPromptTitle('');
            setNewPromptContent('');
            fetchProjectData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', id as string);

        setIsUploading(true);
        try {
            await api.post('/files/upload', formData);

            fetchProjectData();
        } catch (err: any) {
            console.error(err);
            const errorMessage = err.response?.data?.details || err.response?.data?.message || 'Failed to upload file';
            alert(errorMessage);
        } finally {
            setIsUploading(false);
        }
    };

    const deleteFile = async (fileId: string) => {
        if (!confirm('Are you sure you want to delete this file?')) return;
        try {
            await api.delete(`/files/${fileId}`);
            setFiles(prev => prev.filter(f => f._id !== fileId));
        } catch (err) {
            console.error(err);
        }
    };

    if (!project) return (
        <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    return (
        <div className="flex h-[calc(100vh-4rem)] space-x-6 animate-fade-in">
            {/* Left Panel: Chats & Knowledge */}
            <div className="w-1/3 flex flex-col space-y-6">
                <div className="glass-card rounded-2xl p-6 border border-white/5 h-full flex flex-col">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-white mb-2">{project.name}</h1>
                        <p className="text-gray-400 text-sm">{project.description}</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-1 bg-black/20 p-1 rounded-xl mb-6">
                        <button
                            onClick={() => setActiveTab('prompts')}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'prompts' ? 'bg-blue-600 shadow-lg text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Prompts
                        </button>
                        <button
                            onClick={() => setActiveTab('files')}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'files' ? 'bg-blue-600 shadow-lg text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Knowledge Base
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-700">
                        {activeTab === 'prompts' ? (
                            <>
                                <button
                                    onClick={() => setShowPromptModal(true)}
                                    className="w-full py-3 border-2 border-dashed border-gray-700 hover:border-blue-500 text-gray-500 hover:text-blue-500 rounded-xl transition-all flex items-center justify-center space-x-2 group"
                                >
                                    <span>+ Add System Prompt</span>
                                </button>
                                {prompts.map(prompt => (
                                    <div key={prompt._id} className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all group">
                                        <h4 className="font-semibold text-gray-200 group-hover:text-blue-400">{prompt.title}</h4>
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{prompt.content}</p>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <>
                                <label className={`w-full py-3 border-2 border-dashed border-gray-700 hover:border-blue-500 text-gray-500 hover:text-blue-500 rounded-xl transition-all flex items-center justify-center space-x-2 group cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <span>{isUploading ? 'Uploading...' : '+ Upload PDF / Text'}</span>
                                    <input type="file" accept=".pdf,.txt" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                                </label>
                                {files.map(file => (
                                    <div key={file._id} className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-all">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-200 truncate max-w-[150px]">{file.filename}</p>
                                                <p className="text-xs text-gray-500">{new Date(file.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteFile(file._id)}
                                            className="text-gray-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Panel: Chat */}
            <div className="w-2/3">
                <ChatInterface projectId={id!} prompts={prompts} />
            </div>

            {/* Prompt Modal */}
            {showPromptModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="glass-card w-full max-w-lg p-8 rounded-2xl shadow-2xl animate-slide-up border border-white/10 bg-[#0f172a]">
                        <h2 className="text-2xl font-bold mb-6 text-white">Add System Prompt</h2>
                        <form onSubmit={createPrompt} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Title</label>
                                <input
                                    type="text"
                                    value={newPromptTitle}
                                    onChange={(e) => setNewPromptTitle(e.target.value)}
                                    className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Content</label>
                                <textarea
                                    value={newPromptContent}
                                    onChange={(e) => setNewPromptContent(e.target.value)}
                                    className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none h-40 resize-none"
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPromptModal(false)}
                                    className="px-6 py-2 text-gray-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2 rounded-xl font-medium shadow-lg shadow-blue-500/20"
                                >
                                    Save Prompt
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectView;
