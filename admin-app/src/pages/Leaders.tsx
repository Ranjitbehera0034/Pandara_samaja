import { useState, useEffect, useRef } from 'react';

import { Users, Search, Plus, Trash2, Edit, Save, X, Image as ImageIcon } from 'lucide-react';
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
    const [formData, setFormData] = useState({ name: '', name_or: '', role: '', role_or: '', level: 'State', location: '', display_order: 0, existingImage: '' });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const levels = ['All', 'State', 'District', 'Taluka', 'Panchayat'];
    const formLevels = ['State', 'District', 'Taluka', 'Panchayat'];

    const getImageUrl = (url: string | null) => {
        if (!url) return '';
        if (url.startsWith('http') || url.startsWith('blob:')) return url;
        if (url.startsWith('assets/')) {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            return `${isLocal ? 'http://localhost:3000/' : '/'}${url}`;
        }
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
            if (res.data) setAllMembers(res.data);
        } catch (error) {
            console.error('Failed to fetch members for locations:', error);
        }
    };

    const fetchLeaders = async () => {
        try {
            setLoading(true);
            const res = await api.get('/leaders');
            if (res.data.success) {
                setLeaders(res.data.data);
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

    const handleLevelChange = (level: string) => {
        setLevelFilter(level);
        setLocationFilter('');
    };

    const filteredLeaders = leaders.filter(l => {
        const matchesLevel = levelFilter === 'All' || l.level === levelFilter;
        const matchesLocation = !locationFilter || l.location === locationFilter;
        const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (l.location && l.location.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesLevel && matchesLocation && matchesSearch;
    });

    let viewAvailableLocations: string[] = [];
    if (levelFilter === 'District') {
        viewAvailableLocations = Array.from(new Set(allMembers.map(m => m.district).filter(Boolean))).sort() as string[];
    } else if (levelFilter === 'Taluka') {
        viewAvailableLocations = Array.from(new Set(allMembers.map(m => m.taluka).filter(Boolean))).sort() as string[];
    } else if (levelFilter === 'Panchayat') {
        viewAvailableLocations = Array.from(new Set(allMembers.map(m => m.panchayat).filter(Boolean))).sort() as string[];
    }

    let availableLocations: string[] = [];
    if (formData.level === 'District') {
        availableLocations = Array.from(new Set(allMembers.map(m => m.district).filter(Boolean))).sort() as string[];
    } else if (formData.level === 'Taluka') {
        availableLocations = Array.from(new Set(allMembers.map(m => m.taluka).filter(Boolean))).sort() as string[];
    } else if (formData.level === 'Panchayat') {
        availableLocations = Array.from(new Set(allMembers.map(m => m.panchayat).filter(Boolean))).sort() as string[];
    }

    return (
        <div className="p-4 sm:p-8 pb-32 max-w-7xl mx-auto dark:text-slate-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 sm:mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Users className="text-blue-600 dark:text-blue-400" size={32} />
                        Leadership Directory
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage State, District, Taluka, and Panchayat leaders.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
                >
                    <Plus size={18} />
                    Add Leader
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                    <div className="relative w-full md:w-96 flex-shrink-0">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 flex-shrink-0" size={20} />
                        <input
                            type="text"
                            placeholder="Search leaders by name, role or location..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm flex-shrink-0"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
                        {levels.map(level => (
                            <button
                                key={level}
                                onClick={() => handleLevelChange(level)}
                                className={`px-4 py-2 font-medium text-sm rounded-xl transition-colors whitespace-nowrap ${levelFilter === level
                                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 shadow-sm border border-blue-200 dark:border-blue-800'
                                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>

                {['District', 'Taluka', 'Panchayat'].includes(levelFilter) && viewAvailableLocations.length > 0 && (
                    <div className="flex justify-end mb-6">
                        <select
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            className="w-full md:w-64 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all shadow-sm text-sm"
                        >
                            <option value="">All {levelFilter}s</option>
                            {viewAvailableLocations.map(loc => (
                                <option key={loc} value={loc}>{loc}</option>
                            ))}
                        </select>
                    </div>
                )}

                {loading ? (
                    <div className="py-20 text-center text-slate-500 dark:text-slate-400">Loading leaders...</div>
                ) : filteredLeaders.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                        <Users className="text-slate-300 dark:text-slate-600 mx-auto mb-4" size={48} />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">No Leaders Found</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Add a new leader to see them listed here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredLeaders.map(leader => (
                            <div key={leader.id} className="relative group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
                                <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-900 relative">
                                    {leader.image_url ? (
                                        <img src={getImageUrl(leader.image_url)} alt={leader.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                            <Users size={48} />
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-md">
                                        {leader.level}
                                    </div>
                                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleOpenModal(leader)} className="bg-white/90 text-blue-600 p-2 rounded-full hover:bg-white shadow-lg">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(leader.id)} className="bg-white/90 text-red-600 p-2 rounded-full hover:bg-white shadow-lg">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1">{leader.name}</h3>
                                    <p className="text-blue-600 dark:text-blue-400 font-medium text-sm mt-1 flex items-center gap-1 line-clamp-1">
                                        {leader.role}
                                    </p>
                                    {leader.location && (
                                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 line-clamp-1">{leader.location}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
                        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                {editingLeader ? <Edit className="text-blue-500" size={24} /> : <Plus className="text-blue-500" size={24} />}
                                {editingLeader ? 'Edit Leader' : 'Add New Leader'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-5">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Photo</label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors group aspect-video bg-slate-50 dark:bg-slate-800/50"
                                >
                                    {imagePreview ? (
                                        <div className="relative w-full h-full rounded-lg overflow-hidden">
                                            <img src={getImageUrl(imagePreview)} alt="Preview" className="w-full h-full object-contain" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium">
                                                Change Image
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <ImageIcon className="text-slate-400 group-hover:text-blue-500 mx-auto mb-2" size={32} />
                                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Click to upload photo</p>
                                        </div>
                                    )}
                                </div>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name (English) *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name (Odia)</label>
                                    <input
                                        type="text"
                                        value={formData.name_or}
                                        onChange={(e) => setFormData({ ...formData, name_or: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g. ଜନ ଡୋ"
                                    />
                                </div>

                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role/Designation (English) *</label>
                                    <input
                                        type="text"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g. President"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role/Designation (Odia)</label>
                                    <input
                                        type="text"
                                        value={formData.role_or}
                                        onChange={(e) => setFormData({ ...formData, role_or: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g. ସଭାପତି"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hierarchy Level *</label>
                                    <select
                                        value={formData.level}
                                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        {formLevels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                                    </select>
                                </div>

                                {formData.level !== 'State' && (
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            {formData.level === 'District' ? 'District Name *' :
                                                formData.level === 'Taluka' ? 'Taluka Name *' :
                                                    'Panchayat Name *'}
                                        </label>
                                        <select
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="">
                                                Select {formData.level === 'District' ? 'District' :
                                                    formData.level === 'Taluka' ? 'Taluka' :
                                                        'Panchayat'}
                                            </option>
                                            {availableLocations.map(loc => (
                                                <option key={loc} value={loc}>{loc}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Display Order</label>
                                    <input
                                        type="number"
                                        value={formData.display_order}
                                        onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900 z-10">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 transition-colors flex items-center gap-2"
                            >
                                <Save size={18} />
                                {editingLeader ? 'Update Leader' : 'Save Leader'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
