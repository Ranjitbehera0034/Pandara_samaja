import { useState, useEffect, useRef } from 'react';
import { Users, Search, Plus, Trash2, Edit2, Save, X, Image as ImageIcon, Briefcase, Layers } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import { BACKEND_URL } from '../config/apiConfig';

export default function Leaders() {
    const [leaders, setLeaders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [levelFilter, setLevelFilter] = useState('All');
    const [locationFilter, setLocationFilter] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLeader, setEditingLeader] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        name_or: '',
        role: '',
        role_or: '',
        level: 'State',
        location: '',
        display_order: 0,
        existingImage: ''
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const levels = ['All', 'State', 'District', 'Taluka', 'Panchayat'];
    const formLevels = ['State', 'District', 'Taluka', 'Panchayat'];

    const getImageUrl = (url: string | null) => {
        if (!url) return '';
        if (url.includes('drive.google.com') || url.includes('lh3.googleusercontent.com')) {
            const driveIdMatch = url.match(/([a-zA-Z0-9_-]{25,})/);
            if (driveIdMatch && driveIdMatch[1]) {
                return `${BACKEND_URL}/api/v1/image-proxy${driveIdMatch[1]}`;
            }
        }
        if (url.startsWith('http') || url.startsWith('blob:')) return url;
        return `${BACKEND_URL}/${url.replace(/^\//, '')}`;
    };

    const [allMembers, setAllMembers] = useState<any[]>([]);

    useEffect(() => {
        fetchLeaders();
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const res = await api.get('/members');
            if (res.data.success) {
                setAllMembers(res.data.members || []);
            } else if (Array.isArray(res.data)) {
                setAllMembers(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch members for locations:', error);
        }
    };

    const fetchLeaders = async () => {
        try {
            setLoading(true);
            const res = await api.get('/leaders');
            if (res.data.success) {
                setLeaders(res.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch leaders:', error);
            toast.error('Failed to load leaders');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (leader: any = null) => {
        if (leader) {
            setEditingLeader(leader);
            setFormData({
                name: leader.name,
                name_or: leader.name_or || '',
                role: leader.role,
                role_or: leader.role_or || '',
                level: leader.level,
                location: leader.location || '',
                display_order: leader.display_order || 0,
                existingImage: leader.image_url || ''
            });
            setImagePreview(leader.image_url || null);
        } else {
            setEditingLeader(null);
            setFormData({ name: '', name_or: '', role: '', role_or: '', level: 'State', location: '', display_order: 0, existingImage: '' });
            setImagePreview(null);
        }
        setImageFile(null);
        setIsModalOpen(true);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.role) {
            toast.error('Please fill required fields (Name, Role)');
            return;
        }

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('name_or', formData.name_or);
            data.append('role', formData.role);
            data.append('role_or', formData.role_or);
            data.append('level', formData.level);
            data.append('location', formData.location);
            data.append('display_order', formData.display_order.toString());

            if (imageFile) {
                data.append('image', imageFile);
            } else if (formData.existingImage) {
                data.append('existingImage', formData.existingImage);
            }

            if (editingLeader) {
                await api.put(`/leaders/${editingLeader.id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Leader updated successfully');
            } else {
                await api.post('/leaders', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Leader added successfully');
            }
            setIsModalOpen(false);
            fetchLeaders();
        } catch (error) {
            console.error('Failed to save leader:', error);
            toast.error('Failed to save leader');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this leader?')) return;
        try {
            await api.delete(`/leaders/${id}`);
            toast.success('Leader deleted successfully');
            fetchLeaders();
        } catch (error) {
            console.error('Failed to delete leader:', error);
            toast.error('Failed to delete leader');
        }
    };

    const filteredLeaders = (Array.isArray(leaders) ? leaders : []).filter(l => {
        const matchesLevel = levelFilter === 'All' || l.level === levelFilter;
        const matchesLocation = !locationFilter || l.location === locationFilter;
        const matchesSearch = (l.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (l.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (l.location || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesLevel && matchesLocation && matchesSearch;
    });

    const safeAllMembers = Array.isArray(allMembers) ? allMembers : [];
    const getLocationsForLevel = (level: string) => {
        let locations = new Set<string>();
        if (level === 'District') {
            safeAllMembers.forEach(m => { if (m.district) locations.add(String(m.district)); });
            (Array.isArray(leaders) ? leaders : []).forEach(l => { if (l.level === 'District' && l.location) locations.add(l.location); });
        }
        if (level === 'Taluka') {
            safeAllMembers.forEach(m => { if (m.taluka) locations.add(String(m.taluka)); });
            (Array.isArray(leaders) ? leaders : []).forEach(l => { if (l.level === 'Taluka' && l.location) locations.add(l.location); });
        }
        if (level === 'Panchayat') {
            safeAllMembers.forEach(m => { if (m.panchayat) locations.add(String(m.panchayat)); });
            (Array.isArray(leaders) ? leaders : []).forEach(l => { if (l.level === 'Panchayat' && l.location) locations.add(l.location); });
        }
        return Array.from(locations).sort();
    };

    const viewAvailableLocations = getLocationsForLevel(levelFilter);
    const formAvailableLocations = getLocationsForLevel(formData.level);

    return (
        <div className="p-4 sm:p-8 pb-32 max-w-7xl mx-auto">
            {/* Header section with glass effect */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20">
                            <Users className="text-white" size={28} />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Leaders Directory</h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Manage organization hierarchy and leadership profiles</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="group relative px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-[20px] overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className="relative flex items-center gap-2 group-hover:text-white">
                        <Plus size={20} strokeWidth={3} />
                        Add New Leader
                    </span>
                </button>
            </div>

            {/* Filter controls */}
            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 mb-10 shadow-xl shadow-slate-200/50 dark:shadow-none">
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={22} />
                        <input
                            type="text"
                            placeholder="Search by name, role or location..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:border-blue-500 dark:focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-slate-900 dark:text-white"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {levels.map(level => (
                            <button
                                key={level}
                                onClick={() => { setLevelFilter(level); setLocationFilter(''); }}
                                className={`px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${levelFilter === level
                                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30'
                                    : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>

                {viewAvailableLocations.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setLocationFilter('')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${!locationFilter
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                    }`}
                            >
                                All {levelFilter}s
                            </button>
                            {viewAvailableLocations.map(loc => (
                                <button
                                    key={loc}
                                    onClick={() => setLocationFilter(loc)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${locationFilter === loc
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {loc}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Content Table / Grid */}
            <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-950/20 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-[0.2em] font-black border-b border-slate-200 dark:border-slate-800">
                                <th className="px-10 py-6">Leader Profile</th>
                                <th className="px-10 py-6">Hierarchy & Rank</th>
                                <th className="px-10 py-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={3} className="py-32 text-center">
                                        <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Synchronizing Database...</p>
                                    </td>
                                </tr>
                            ) : filteredLeaders.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="py-32 text-center">
                                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 dark:text-slate-600">
                                            <Users size={40} />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">No Leaders Found</h3>
                                        <p className="text-slate-500">Refine your search or add a new entry.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredLeaders.map((leader) => (
                                    <tr key={leader.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                                        <td className="px-10 py-8 whitespace-nowrap">
                                            <div className="flex items-center gap-6">
                                                <div className="relative">
                                                    <div className="h-16 w-16 rounded-[24px] overflow-hidden bg-slate-100 dark:bg-slate-800 ring-4 ring-slate-50 dark:ring-slate-900 group-hover:ring-blue-50 dark:group-hover:ring-blue-900/30 transition-all shadow-lg">
                                                        <img
                                                            src={getImageUrl(leader.image_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(leader.name)}&background=2563eb&color=fff&bold=true`}
                                                            alt={leader.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg border-4 border-white dark:border-slate-900 flex items-center justify-center shadow-lg ${leader.level === 'State' ? 'bg-blue-600' : 'bg-emerald-600'
                                                        }`}>
                                                        <Layers className="text-white" size={10} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-lg font-black text-slate-900 dark:text-white mb-1 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{leader.name}</div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{leader.name_or || 'Name (Odia)'}</span>
                                                        <span className="text-slate-200 dark:text-slate-700">|</span>
                                                        <span className="text-xs text-slate-500 font-bold">{leader.location || 'Central Command'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 whitespace-nowrap">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <Briefcase size={14} className="text-slate-400" />
                                                    <span className="text-sm font-black text-slate-700 dark:text-slate-200">{leader.role}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] rounded-lg ${leader.level === 'State'
                                                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                                                        : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                                        }`}>
                                                        {leader.level} LEVEL
                                                    </span>
                                                    <span className="flex items-center gap-1 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                                        Rank #{leader.display_order || 0}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                                <button
                                                    onClick={() => handleOpenModal(leader)}
                                                    className="p-3 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110"
                                                    title="Edit Professional Profile"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(leader.id)}
                                                    className="p-3 bg-white dark:bg-slate-800 text-red-500 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 hover:bg-red-500 hover:text-white transition-all transform hover:scale-110"
                                                    title="Permanently Remove"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal - Fully Rebuilt */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-[48px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20 dark:border-slate-800 animate-in zoom-in duration-300">
                        <div className="px-10 py-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {editingLeader ? 'Refine Profile' : 'Enlist New Leader'}
                                </h1>
                                <p className="text-slate-500 font-medium mt-1">Populate the fields to establish leadership presence.</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-12 h-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-10 py-10 space-y-10 custom-scrollbar">
                            {/* Profile Image Preview & Upload */}
                            <div className="flex flex-col items-center gap-6">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="relative group cursor-pointer"
                                >
                                    <div className="w-40 h-40 rounded-[48px] overflow-hidden border-4 border-slate-100 dark:border-slate-800 shadow-2xl bg-slate-50 dark:bg-slate-950 transition-transform group-hover:scale-[1.05]">
                                        {imagePreview ? (
                                            <img src={getImageUrl(imagePreview)} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700">
                                                <ImageIcon size={48} />
                                                <span className="text-[10px] font-black uppercase tracking-widest mt-2">No Photo</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-blue-600/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-all">
                                            <Plus size={32} />
                                            <span className="text-xs font-black uppercase tracking-widest mt-2">Upload</span>
                                        </div>
                                    </div>
                                    {imagePreview && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }}
                                            className="absolute -top-2 -right-2 w-10 h-10 bg-white shadow-xl rounded-2xl flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all transform rotate-0 hover:rotate-90"
                                        >
                                            <X size={20} />
                                        </button>
                                    )}
                                </div>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">Name (English)</label>
                                    <input
                                        type="text"
                                        placeholder="Full Legal Name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:border-blue-500 outline-none font-bold text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">Name (Odia)</label>
                                    <input
                                        type="text"
                                        placeholder="ଓଡ଼ିଆ ନାମ"
                                        value={formData.name_or}
                                        onChange={(e) => setFormData({ ...formData, name_or: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:border-blue-500 outline-none font-bold text-blue-600 dark:text-blue-400"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">Designation</label>
                                    <input
                                        type="text"
                                        placeholder="Professional Role"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:border-blue-500 outline-none font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">Designation (Odia)</label>
                                    <input
                                        type="text"
                                        placeholder="ଓଡ଼ିଆ ପଦବୀ"
                                        value={formData.role_or}
                                        onChange={(e) => setFormData({ ...formData, role_or: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:border-blue-500 outline-none font-bold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8 bg-slate-50 dark:bg-slate-950/40 rounded-[32px] border border-slate-100 dark:border-slate-800">
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Hierarchy Level</label>
                                    <select
                                        value={formData.level}
                                        onChange={(e) => {
                                            const newLevel = e.target.value;
                                            setFormData({ ...formData, level: newLevel, location: '' });
                                        }}
                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold"
                                    >
                                        {formLevels.map(lvl => <option key={lvl} value={lvl}>{lvl} Level</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Assigned Hub</label>
                                    <div className="relative">
                                        {formData.level === 'District' ? (
                                            <select
                                                value={formData.location}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold"
                                            >
                                                <option value="">Select District</option>
                                                {formAvailableLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                            </select>
                                        ) : (
                                            <>
                                                <input
                                                    type="text"
                                                    list={`locations-${formData.level}`}
                                                    disabled={formData.level === 'State'}
                                                    value={formData.location}
                                                    placeholder={formData.level === 'State' ? 'All (Central)' : `Enter or Select ${formData.level}`}
                                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold disabled:opacity-40"
                                                />
                                                <datalist id={`locations-${formData.level}`}>
                                                    {formAvailableLocations.map(loc => <option key={loc} value={loc} />)}
                                                </datalist>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Priority Rank</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={formData.display_order}
                                            onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                                            className="w-full pl-6 pr-12 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-500">POS</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-10 py-10 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-8 py-4 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-xs hover:text-slate-800 dark:hover:text-white transition-colors"
                            >
                                Abandon Changes
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/30 transition-all flex items-center gap-3 active:scale-95"
                            >
                                <Save size={20} />
                                {editingLeader ? 'COMMIT UPDATES' : 'ENLIST LEADER'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
