import { useState, useEffect } from 'react';
import api from '../services/api';
import { ShieldCheck, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export default function MakerChecker() {
    const [actions, setActions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActions();
    }, []);

    const fetchActions = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/maker-checker');
            if (res.data.success) {
                setActions(res.data.actions);
            }
        } catch (error) {
            toast.error('Failed to load pending actions');
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (id: number, status: 'approved' | 'rejected') => {
        try {
            const res = await api.post(`/admin/maker-checker/${id}/review`, { status });
            if (res.data.success) {
                toast.success(`Action ${status}`);
                fetchActions();
            }
        } catch (e) {
            toast.error('Failed to review action');
        }
    };

    return (
        <div className="p-4 sm:p-8 pb-32 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 sm:mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <ShieldCheck className="text-indigo-600" size={32} />
                        Maker Checker Approvals
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm sm:text-base">Review, accept, or reject actions performed by other admins.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                                <th className="px-4 sm:px-6 py-4">Action</th>
                                <th className="px-4 sm:px-6 py-4">Admin</th>
                                <th className="px-4 sm:px-6 py-4">Target Details</th>
                                <th className="px-4 sm:px-6 py-4">Time</th>
                                <th className="px-4 sm:px-6 py-4 text-right">Decide</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-500">Loading...</td>
                                </tr>
                            ) : actions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-500">No pending actions</td>
                                </tr>
                            ) : (
                                actions.map((action) => (
                                    <tr key={action.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap font-medium text-sm">
                                            {action.action_type.replace(/_/g, ' ')}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                                                {action.admin_username}
                                            </span>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-sm">
                                            <div className="font-medium">{action.target_type} ID: {action.target_id}</div>
                                            <div className="text-slate-500 text-xs mt-1">Payload: {JSON.stringify(action.payload)}</div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {new Date(action.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right space-x-2">
                                            <button onClick={() => handleReview(action.id, 'approved')} className="p-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100" title="Approve">
                                                <Check size={18} />
                                            </button>
                                            <button onClick={() => handleReview(action.id, 'rejected')} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100" title="Reject">
                                                <X size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
