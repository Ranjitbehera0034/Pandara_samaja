import { useState, useEffect } from 'react';
import { 
    TrendingUp, Filter, Download, 
    ArrowLeft, Search, ChevronRight,
    DollarSign, Clock, CheckCircle2, Plus, X, Upload, Loader2, FileText,
    ZoomIn, ZoomOut, RotateCw, Maximize2, Eye, Trash2, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAdminAuth } from '../context/AdminAuthContext';
import { expenseService } from '../services/expenseService';
import type { ExpenseData } from '../services/expenseService';

interface Transaction extends ExpenseData {}

// Removed hardcoded MOCK_TRANSACTIONS

export default function Expenses() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAdminAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [selectedExpense, setSelectedExpense] = useState<Transaction | null>(null);
    const [deleteConfirmationTarget, setDeleteConfirmationTarget] = useState<Transaction | null>(null);

    // Viewer States
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);

    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: 'Other',
        date: new Date().toISOString().split('T')[0],
        payee: ''
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Access control: Only admin and super_admin
    const isAuthorized = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'superadmin' || user?.role?.toLowerCase() === 'super_admin';

    const fetchData = async () => {
        try {
            const [txData, statsData] = await Promise.all([
                expenseService.getExpenses(),
                expenseService.getStats()
            ]);
            setTransactions(txData);
            setStats(statsData);
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
            toast.error("Failed to load records");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthorized) fetchData();
    }, [isAuthorized]);

    if (!isAuthorized) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] p-8 space-y-4">
                <div className="p-6 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-full">
                    <X size={48} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Access Denied</h2>
                <p className="text-slate-500 text-center max-w-md">You do not have the required permissions to view the expense tracker. Please contact a Super Admin if you believe this is an error.</p>
                <button 
                    onClick={() => navigate('/')}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-500/20"
                >Return to Dashboard</button>
            </div>
        );
    }

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    // Form state removed from here and moved to top level
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => setPreviewUrl(reader.result as string);
                reader.readAsDataURL(file);
            } else {
                setPreviewUrl(null); // No image preview for PDFs
            }
        }
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedFile) {
            toast.error("Proper proof is required. Please attach a bill or receipt.");
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading(t('recording_expense'));

        try {
            const data = new FormData();
            data.append('title', formData.description || 'Expense'); // Match backend expected 'title'
            data.append('description', formData.description);
            data.append('amount', formData.amount);
            data.append('category', formData.category);
            data.append('payee', formData.payee);
            data.append('expense_date', formData.date);
            data.append('attachment', selectedFile);

            // Post to Render backend via FormData (server handles Firebase upload)
            await expenseService.createExpense(data);
            
            toast.success(t('expense_recorded'), { id: toastId });
            setIsAddModalOpen(false);
            // Refresh data
            fetchData();
            // Reset form
            setFormData({ description: '', amount: '', category: 'Other', date: new Date().toISOString().split('T')[0], payee: '' });
            setSelectedFile(null);
            setPreviewUrl(null);
        } catch (error) {
            console.error("Failed to record expense", error);
            toast.error("Failed to record expense. Please check your connection.", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExport = () => {
        toast.success("Exporting expense ledger...");
        // Use real transactions for export
        const blob = new Blob(["id,date,description,amount,category,payee,status\n" + 
            transactions.map(tx => `${tx.id},${tx.expense_date},"${tx.description}",${tx.amount},${tx.category},"${tx.payee || ''}",completed`).join('\n')], 
            { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expenses_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const handleDeleteExpense = async (id: string) => {
        const toastId = toast.loading("Deleting record...");
        try {
            await expenseService.deleteExpense(id);
            toast.success("Record removed successfully", { id: toastId });
            if (selectedExpense?.id === id) setSelectedExpense(null);
            setDeleteConfirmationTarget(null);
            fetchData();
        } catch (error) {
            console.error("Deletion failed", error);
            toast.error("Failed to delete record", { id: toastId });
        }
    };

    // Use stats from API or fallback to 0
    const monthlyTotal = stats?.monthly?.[0]?.total_amount || 0;
    const totalApproved = transactions
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const pendingTotal = 0; // Backend schema currently treats all as approved/recorded

    return (
        <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors">
            {/* Left side: Main Content (Stats + Table) */}
            <div className={`flex-1 flex flex-col p-4 sm:p-8 space-y-8 overflow-y-auto custom-scrollbar transition-all duration-300 ${selectedExpense ? 'w-1/3 shadow-2xl z-10' : 'w-full'}`}>
                {/* Modal (Add Expense) */}
                <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('record_new_expense')}</h2>
                                    <p className="text-sm text-slate-500 font-medium">Add a new transaction to the community fund</p>
                                </div>
                                <button 
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleAddExpense} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('description')}</label>
                                        <input 
                                            required
                                            type="text" 
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                            placeholder="What was this for?"
                                            value={formData.description}
                                            onChange={e => setFormData({...formData, description: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('payee')}</label>
                                        <input 
                                            required
                                            type="text" 
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                            placeholder={t('payee_placeholder')}
                                            value={formData.payee}
                                            onChange={e => setFormData({...formData, payee: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('amount')} (₹)</label>
                                        <input 
                                            required
                                            type="number" 
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-black text-xl text-indigo-600"
                                            placeholder="0.00"
                                            value={formData.amount}
                                            onChange={e => setFormData({...formData, amount: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('category')}</label>
                                        <input 
                                            required
                                            type="text" 
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                            placeholder="e.g. Events, Charity, Repairs"
                                            value={formData.category}
                                            onChange={e => setFormData({...formData, category: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('date')}</label>
                                        <input 
                                            type="date" 
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                            value={formData.date}
                                            onChange={e => setFormData({...formData, date: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('upload_bill')}</label>
                                    <div 
                                        onClick={() => document.getElementById('receipt-upload')?.click()}
                                        className="relative group cursor-pointer"
                                    >
                                        <div className={`w-full h-40 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-all ${
                                            selectedFile ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/50'
                                        }`}>
                                            {previewUrl ? (
                                                <div className="relative w-full h-full p-4">
                                                    <img src={previewUrl} alt="Receipt preview" className="w-full h-full object-contain rounded-xl" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                                                        <span className="text-white text-xs font-black uppercase tracking-widest">Change Image</span>
                                                    </div>
                                                </div>
                                            ) : selectedFile ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <FileText className="text-emerald-500" size={48} />
                                                    <p className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest text-center px-4 truncate max-w-xs">{selectedFile.name}</p>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Click to change file</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="text-slate-400 group-hover:text-indigo-500 mb-2 transition-colors" size={32} />
                                                    <p className="text-xs font-bold text-slate-500 group-hover:text-indigo-600 transition-colors uppercase tracking-widest">Drop receipt or click to browse</p>
                                                </>
                                            )}
                                        </div>
                                        <input 
                                            id="receipt-upload"
                                            type="file" 
                                            hidden 
                                            accept=".pdf,image/*"
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex items-center gap-4">
                                    <button 
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        disabled={isSubmitting}
                                        type="submit"
                                        className="flex-2 py-4 px-12 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                                        {t('add_expense')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Confirmation Modal (Delete) */}
            <AnimatePresence>
                {deleteConfirmationTarget && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeleteConfirmationTarget(null)}
                            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden text-center p-8"
                        >
                            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle size={40} />
                            </div>
                            
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">
                                {t('confirm_delete_title')}
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">
                                {t('confirm_delete_msg')}
                            </p>

                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl mb-8 flex flex-col items-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('amount')}</span>
                                <span className="text-xl font-black text-slate-900 dark:text-white">₹{Number(deleteConfirmationTarget.amount).toLocaleString()}</span>
                                <span className="text-xs text-slate-500 mt-2 font-medium truncate w-full">{deleteConfirmationTarget.title || deleteConfirmationTarget.description}</span>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={() => handleDeleteExpense(deleteConfirmationTarget.id!)}
                                    className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/20"
                                >
                                    {t('action_delete_permanent')}
                                </button>
                                <button 
                                    onClick={() => setDeleteConfirmationTarget(null)}
                                    className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all font-bold"
                                >
                                    {t('action_cancel')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors text-slate-500"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            {t('expense_tracker')}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Manage community funds and budgets</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleExport}
                        className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all flex items-center gap-2 text-sm font-bold"
                    >
                        <Download size={18} /> Export
                    </button>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="p-3 px-6 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 text-sm font-black uppercase tracking-widest"
                    >
                        <Plus size={18} /> {t('record_new_expense')}
                    </button>
                </div>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'This Month', value: `₹${monthlyTotal.toLocaleString()}`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
                    { label: 'Total Approved', value: `₹${totalApproved.toLocaleString()}`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                    { label: 'Pending Approval', value: `₹${pendingTotal.toLocaleString()}`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                ].map((stat, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 flex items-center gap-6"
                    >
                        <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                            <stat.icon size={28} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content */}
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search transactions..."
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                         <button className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 hover:text-indigo-600 transition-all">
                            <Filter size={18} />
                         </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Transaction</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Payee</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <Loader2 className="animate-spin text-indigo-600" size={40} />
                                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Fetching ledger...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center">
                                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No transactions found</p>
                                    </td>
                                </tr>
                            ) : transactions.filter(tx => {
                                if (!searchTerm) return true;
                                const s = searchTerm.toLowerCase();
                                return (tx.title?.toLowerCase().includes(s) || 
                                       tx.description?.toLowerCase().includes(s) || 
                                       (tx.payee && tx.payee.toLowerCase().includes(s)));
                            }).map((tx) => (
                                <tr 
                                    key={tx.id} 
                                    className="border-b border-slate-50 dark:border-slate-800 group hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                <DollarSign size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{tx.title || tx.description || tx.payee || 'Expense'}</p>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{tx.category}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-black text-slate-900 dark:text-slate-100">
                                        ₹{Number(tx.amount).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-full text-[10px] font-black uppercase tracking-tighter">
                                            {tx.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-medium font-mono">
                                        {tx.expense_date ? new Date(tx.expense_date).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium">
                                        {tx.payee || 'Admin Recorded'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg w-fit text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10`}>
                                            <CheckCircle2 size={12} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Completed</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {tx.attachment_url && (
                                                <button 
                                                    onClick={() => { setSelectedExpense(tx); setZoom(1); setRotation(0); }}
                                                    className={`p-2 transition-colors rounded-lg ${selectedExpense?.id === tx.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`}
                                                    title="View Bill/Proof"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            )}
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteConfirmationTarget(tx);
                                                }}
                                                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                                                title="Delete Record"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 text-center">
                    <button className="text-xs font-black text-slate-500 hover:text-indigo-600 uppercase tracking-widest transition-colors text-center w-full">
                        Load More Transactions
                    </button>
                </div>
            </div>
        </div>

        {/* Right Panel: Side-by-Side Bill Viewer */}
            <AnimatePresence>
                {selectedExpense && (
                    <motion.div 
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="w-2/3 bg-slate-100 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 flex flex-col relative"
                    >
                        {/* Viewer Header */}
                        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between z-10 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                    <FileText size={18} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate max-w-[200px]">{selectedExpense.title || 'Expense'}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">₹{Number(selectedExpense.amount).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <button onClick={() => setZoom(prev => Math.max(0.5, prev - 0.2))} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 transition-all"><ZoomOut size={18} /></button>
                                    <span className="text-[10px] font-black w-10 text-center text-slate-600 dark:text-slate-400 font-mono">{Math.round(zoom * 100)}%</span>
                                    <button onClick={() => setZoom(prev => Math.min(3, prev + 0.2))} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 transition-all"><ZoomIn size={18} /></button>
                                </div>
                                <button onClick={() => setRotation(prev => (prev + 90) % 360)} className="p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl hover:text-indigo-600 transition-all" title="Rotate"><RotateCw size={18} /></button>
                                <button onClick={() => { setZoom(1); setRotation(0); }} className="p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl hover:text-indigo-600 transition-all" title="Reset View"><Maximize2 size={18} /></button>
                                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
                                <button 
                                    onClick={() => window.open(selectedExpense.attachment_url, '_blank')}
                                    className="p-2.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                                    title="Open Externally"
                                >
                                    <Download size={18} />
                                </button>
                                <button 
                                    onClick={() => setSelectedExpense(null)}
                                    className="p-2.5 bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Viewer Area */}
                        <div className="flex-1 overflow-auto p-12 flex items-center justify-center bg-[#2d2d2d] relative pattern">
                            <motion.div
                                animate={{ scale: zoom, rotate: rotation }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="bg-white shadow-2xl origin-center max-w-full"
                            >
                                <iframe 
                                    src={`${selectedExpense.attachment_url}#toolbar=0`} 
                                    className="w-[800px] h-[1100px] border-none"
                                    title="Bill Proof"
                                />
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
