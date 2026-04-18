import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FileText, Search, Plus, ZoomIn, ZoomOut, 
    RotateCw, Maximize2, X, Download, Trash2, 
    ChevronRight, HardDrive, Eye
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { documentService } from '../services/documentService';
import type { DocumentData } from '../services/documentService';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function Documents() {
    const { t } = useTranslation();
    const { user } = useAdminAuth();
    const [documents, setDocuments] = useState<DocumentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDoc, setSelectedDoc] = useState<DocumentData | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    
    // Viewer State
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);

    // Upload Form State
    const [uploadData, setUploadData] = useState({ title: '', category: 'General', description: '' });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const data = await documentService.getDocuments();
            setDocuments(data);
        } catch (e) {
            toast.error("Failed to load documents");
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            toast.error("Please select a file to upload");
            return;
        }

        setIsUploading(true);
        const toastId = toast.loading(t('uploading_doc'));

        try {
            const formData = new FormData();
            formData.append('title', uploadData.title);
            formData.append('category', uploadData.category);
            formData.append('description', uploadData.description);
            formData.append('file', selectedFile);

            await documentService.uploadDocument(formData);
            toast.success(t('doc_uploaded'), { id: toastId });
            setIsUploadModalOpen(false);
            setUploadData({ title: '', category: 'General', description: '' });
            setSelectedFile(null);
            fetchDocuments();
        } catch (error) {
            toast.error("Upload failed", { id: toastId });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm(t('confirm_delete_doc'))) return;
        try {
            await documentService.deleteDocument(id);
            toast.success("Document deleted");
            if (selectedDoc?.id === id) setSelectedDoc(null);
            fetchDocuments();
        } catch (e) {
            toast.error("Failed to delete document");
        }
    };

    const filteredDocs = documents.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const categories = ['General', 'Bylaws', 'Meetings', 'ID Proofs', 'Certificates', 'Financial'];

    return (
        <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors">
            {/* Left Panel: Document List */}
            <div className="w-1/3 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900/40">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('documents')}</h1>
                        <button 
                            onClick={() => setIsUploadModalOpen(true)}
                            className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder={t('search')}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading ? (
                        [1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />)
                    ) : filteredDocs.length === 0 ? (
                        <div className="text-center py-20 opacity-40">
                            <FileText size={48} className="mx-auto mb-4" />
                            <p className="text-sm font-bold uppercase tracking-widest">{t('no_documents_found') || 'No documents found'}</p>
                        </div>
                    ) : (
                        filteredDocs.map(doc => (
                            <motion.button
                                key={doc.id}
                                onClick={() => { setSelectedDoc(doc); setZoom(1); setRotation(0); }}
                                className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all text-left border ${
                                    selectedDoc?.id === doc.id 
                                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl shadow-indigo-600/20' 
                                    : 'bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                }`}
                            >
                                <div className={`p-3 rounded-xl ${selectedDoc?.id === doc.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-900 group-hover:bg-indigo-600'}`}>
                                    <FileText size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-bold truncate ${selectedDoc?.id === doc.id ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                                        {doc.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${selectedDoc?.id === doc.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                                            {doc.category}
                                        </span>
                                        <span className={`w-1 h-1 rounded-full ${selectedDoc?.id === doc.id ? 'bg-indigo-200' : 'bg-slate-300'}`} />
                                        <span className={`text-[10px] font-medium ${selectedDoc?.id === doc.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                                            {new Date(doc.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight size={16} className={`opacity-40 ${selectedDoc?.id === doc.id ? 'text-white' : ''}`} />
                            </motion.button>
                        ))
                    )}
                </div>
            </div>

            {/* Right Panel: Document Viewer */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 flex flex-col relative overflow-hidden">
                <AnimatePresence mode="wait">
                    {selectedDoc ? (
                        <motion.div 
                            key={selectedDoc.id}
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="flex flex-col h-full"
                        >
                            {/* Viewer Toolbar */}
                            <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between z-10 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                        <FileText size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">{selectedDoc.title}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{selectedDoc.category}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <button onClick={() => setZoom(prev => Math.max(0.5, prev - 0.2))} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 transition-all"><ZoomOut size={18} /></button>
                                        <span className="text-[10px] font-black w-12 text-center text-slate-600 dark:text-slate-400 font-mono">{Math.round(zoom * 100)}%</span>
                                        <button onClick={() => setZoom(prev => Math.min(3, prev + 0.2))} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 transition-all"><ZoomIn size={18} /></button>
                                    </div>
                                    <button onClick={() => setRotation(prev => (prev + 90) % 360)} className="p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl hover:text-indigo-600 transition-all" title={t('rotate')}><RotateCw size={18} /></button>
                                    <button onClick={() => { setZoom(1); setRotation(0); }} className="p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl hover:text-indigo-600 transition-all" title={t('reset')}><Maximize2 size={18} /></button>
                                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2" />
                                    <button 
                                        onClick={() => window.open(selectedDoc.file_url, '_blank')}
                                        className="p-2.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                                    >
                                        <Download size={18} />
                                    </button>
                                    {(user?.role === 'admin' || user?.role === 'super_admin') && (
                                        <button 
                                            onClick={() => handleDelete(selectedDoc.id)}
                                            className="p-2.5 bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Main Viewing Area */}
                            <div className="flex-1 overflow-auto p-12 flex items-center justify-center bg-[#2d2d2d] relative pattern">
                                <motion.div
                                    animate={{ scale: zoom, rotate: rotation }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className="bg-white shadow-2xl origin-center max-w-full"
                                >
                                    {selectedDoc.file_type.includes('image') ? (
                                        <img src={selectedDoc.file_url} className="max-w-[800px] w-full" alt={selectedDoc.title} />
                                    ) : (
                                        <iframe 
                                            src={`${selectedDoc.file_url}#toolbar=0`} 
                                            className="w-[800px] h-[1100px] border-none"
                                            title="PDF Document"
                                        />
                                    )}
                                </motion.div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-4 opacity-30">
                            <div className="p-8 bg-slate-200 dark:bg-slate-900 rounded-full">
                                <Eye size={64} className="text-slate-400" />
                            </div>
                            <p className="text-sm font-black text-slate-500 uppercase tracking-widest">{t('no_document_selected')}</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Upload Modal */}
            <AnimatePresence>
                {isUploadModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/90 backdrop-blur-xl">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl"
                        >
                            <form onSubmit={handleUpload} className="p-8 space-y-6">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('upload_document')}</h3>
                                    <button type="button" onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X size={24} /></button>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[2px]">{t('doc_title')}</label>
                                        <input 
                                            required
                                            type="text" 
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                            value={uploadData.title}
                                            onChange={e => setUploadData({...uploadData, title: e.target.value})}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[2px]">{t('doc_category')}</label>
                                        <select 
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
                                            value={uploadData.category}
                                            onChange={e => setUploadData({...uploadData, category: e.target.value})}
                                        >
                                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[2px]">{t('doc_description')}</label>
                                        <textarea 
                                            rows={2}
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium resize-none"
                                            value={uploadData.description}
                                            onChange={e => setUploadData({...uploadData, description: e.target.value})}
                                        />
                                    </div>

                                    <div className="relative h-32 w-full">
                                        <input 
                                            type="file" 
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                                            accept=".pdf,image/*"
                                        />
                                        <div className={`h-full w-full border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all ${
                                            selectedFile ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
                                        }`}>
                                            <HardDrive size={24} className={selectedFile ? 'text-emerald-500' : 'text-slate-400'} />
                                            <p className="text-xs font-bold mt-2 text-slate-500">
                                                {selectedFile ? selectedFile.name : 'Select PDF or Document Image'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    disabled={isUploading}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-indigo-600/20"
                                >
                                    {isUploading ? t('uploading_doc') : t('upload_document')}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
