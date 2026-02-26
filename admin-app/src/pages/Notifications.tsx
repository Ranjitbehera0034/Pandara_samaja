import { BellRing, Plus, History } from 'lucide-react';

export default function Notifications() {
    return (
        <div className="p-4 sm:p-8 pb-32 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 sm:mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <BellRing className="text-amber-500" size={32} />
                        Push Notifications
                    </h1>
                    <p className="text-slate-500 mt-1">Broadcast urgent messages manually.</p>
                </div>
                <button className="px-5 py-2.5 bg-amber-500 text-white rounded-xl font-medium shadow-lg shadow-amber-500/25 flex items-center gap-2 hover:bg-amber-600 transition-colors">
                    <Plus size={18} /> New Broadcast
                </button>
            </div>

            <div className="bg-white border text-center border-slate-200 py-20 rounded-2xl border-dashed">
                <History className="text-slate-300 mx-auto mb-4" size={48} />
                <h3 className="text-lg font-medium text-slate-900">No Past Broadcasts</h3>
                <p className="text-slate-500 mt-1">Notifications sent from here will appear below in history.</p>
            </div>
        </div>
    );
}
