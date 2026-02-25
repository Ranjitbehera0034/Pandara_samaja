import { UsersRound, Plus, Component } from 'lucide-react';

export default function Groups() {
    return (
        <div className="p-8 pb-32 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <UsersRound className="text-indigo-500" size={32} />
                        Groups Admin
                    </h1>
                    <p className="text-slate-500 mt-1">Manage sub-communities and appointed moderators.</p>
                </div>
                <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/25 flex items-center gap-2 hover:bg-indigo-700 transition-colors">
                    <Plus size={18} /> New Group
                </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white border text-center border-slate-200 py-20 rounded-2xl border-dashed col-span-full">
                    <Component className="text-slate-300 mx-auto mb-4" size={48} />
                    <h3 className="text-lg font-medium text-slate-900">No Groups Found</h3>
                    <p className="text-slate-500 mt-1">Community groups you create will appear here.</p>
                </div>
            </div>
        </div>
    );
}
