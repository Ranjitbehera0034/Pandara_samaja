import { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, Shield, Clock, AlertTriangle, UserCheck, XCircle, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

export default function AuditLog() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/audit-logs');
            if (res.data.success) {
                setLogs(res.data.logs);
            }
        } catch (error) {
            toast.error('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (action: string) => {
        if (action.includes('DELETE')) return <Trash2 size={16} className="text-red-500" />;
        if (action.includes('UPDATE')) return <Edit size={16} className="text-blue-500" />;
        if (action.includes('BAN')) return <XCircle size={16} className="text-red-600" />;
        if (action.includes('UNBAN')) return <UserCheck size={16} className="text-green-500" />;
        return <AlertTriangle size={16} className="text-amber-500" />;
    };

    const formatAction = (action: string) => {
        return action.replace(/_/g, ' ');
    };

    const filteredLogs = logs.filter(log =>
        log.admin_username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.target_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 pb-32 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Shield className="text-indigo-600" size={32} />
                        Audit Log
                    </h1>
                    <p className="text-slate-500 mt-1">Immutable record of all administrative actions taken on the platform.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="relative max-w-md flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search logs by admin, action, or target ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4">Admin</th>
                                <th className="px-6 py-4">Action</th>
                                <th className="px-6 py-4">Target Resource</th>
                                <th className="px-6 py-4">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-500">
                                        <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                        Decrypting secure logs...
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-500">No logs found matching your search.</td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 flex items-center gap-2">
                                            <Clock size={14} />
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                                                {log.admin_username}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-sm flex items-center gap-2">
                                            {getActionIcon(log.action)}
                                            {formatAction(log.action)}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="font-medium text-slate-900">{log.target_type}</div>
                                            <div className="text-slate-500 text-xs font-mono mt-0.5">ID: {log.target_id}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500">
                                            {log.ip_address}
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
