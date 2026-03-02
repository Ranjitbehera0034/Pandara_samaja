import { Calendar, Plus } from 'lucide-react';

export default function Events() {
    return (
        <div className="p-8 pb-32 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Calendar className="text-blue-500" size={32} />
                        Events
                    </h1>
                    <p className="text-slate-500 mt-1">Manage community gatherings and RSVPs.</p>
                </div>
                <button className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 flex items-center gap-2 hover:bg-blue-700 transition-colors">
                    <Plus size={18} /> Create Event
                </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white border text-center border-slate-200 py-20 rounded-2xl border-dashed col-span-full">
                    <Calendar className="text-slate-300 mx-auto mb-4" size={48} />
                    <h3 className="text-lg font-medium text-slate-900">No Events Scheduled</h3>
                    <p className="text-slate-500 mt-1">Click Create Event to get started.</p>
                </div>
            </div>
        </div>
    );
}
