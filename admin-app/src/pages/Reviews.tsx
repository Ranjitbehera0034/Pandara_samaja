import { useState, useEffect } from 'react';
import { RefreshCcw, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';

const FORM_COLUMNS = {
    TIMESTAMP: 0,
    MEMBERSHIP_NO: 1,
    HEAD_NAME: 2,
    MOBILE: 3,
    DISTRICT: 4,
    TALUKA: 5,
    PANCHAYAT: 6,
    VILLAGE: 7,
    MALE_COUNT: 8,
    FEMALE_COUNT: 9,
    FAMILY_MEMBERS: 10,
    HEAD_PHOTO: 11
};

export default function Reviews() {
    const [sheetId, setSheetId] = useState(localStorage.getItem('googleSheetId') || '');
    const [tabName, setTabName] = useState(localStorage.getItem('googleSheetTab') || 'Form Responses 1');
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

    useEffect(() => {
        // Load saved rejections to filter out easily later
    }, []);

    const handleSaveConfig = () => {
        if (!sheetId) {
            toast.error('Please enter a Google Sheet ID');
            return;
        }
        localStorage.setItem('googleSheetId', sheetId);
        localStorage.setItem('googleSheetTab', tabName);
        toast.success('Sheet configuration saved!');
    };

    const fetchSubmissions = async () => {
        if (!sheetId) {
            toast.error('Please enter a Google Sheet ID first');
            return;
        }
        handleSaveConfig();
        setLoading(true);

        try {
            const encodedTab = encodeURIComponent(tabName);
            const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodedTab}`;

            const response = await fetch(gvizUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch sheet. Make sure it is published to web.`);
            }

            const text = await response.text();
            const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*?)\);?\s*$/);
            if (!match) {
                throw new Error('Could not parse Google Sheet response.');
            }

            const data = JSON.parse(match[1]);
            if (data.status === 'error') {
                throw new Error(data.errors?.[0]?.detailed_message || 'Google Sheet returned an error');
            }

            const rows = data.table.rows;
            let parsedSubmissions = rows.map((row: any, idx: number) => {
                const getCellValue = (colIdx: number) => {
                    if (!row.c || !row.c[colIdx]) return '';
                    const cell = row.c[colIdx];
                    if (cell.f) return cell.f;
                    return cell.v != null ? String(cell.v) : '';
                };

                return {
                    id: idx + 2,
                    timestamp: getCellValue(FORM_COLUMNS.TIMESTAMP),
                    membership_no: getCellValue(FORM_COLUMNS.MEMBERSHIP_NO).trim(),
                    name: getCellValue(FORM_COLUMNS.HEAD_NAME).trim(),
                    mobile: getCellValue(FORM_COLUMNS.MOBILE).trim(),
                    district: getCellValue(FORM_COLUMNS.DISTRICT).trim(),
                    taluka: getCellValue(FORM_COLUMNS.TALUKA).trim(),
                    panchayat: getCellValue(FORM_COLUMNS.PANCHAYAT).trim(),
                    village: getCellValue(FORM_COLUMNS.VILLAGE).trim(),
                    male: parseInt(getCellValue(FORM_COLUMNS.MALE_COUNT)) || 0,
                    female: parseInt(getCellValue(FORM_COLUMNS.FEMALE_COUNT)) || 0,
                    family_members: getCellValue(FORM_COLUMNS.FAMILY_MEMBERS).trim(),
                    head_photo_url: getCellValue(FORM_COLUMNS.HEAD_PHOTO).trim(),
                    _status: 'pending'
                };
            }).filter((s: any) => s.membership_no);

            // Cross reference with DB
            try {
                const membersRes = await api.get('/members');
                const existingNos = new Set(membersRes.data.map((m: any) => String(m.membership_no)));

                parsedSubmissions.forEach((s: any) => {
                    if (existingNos.has(String(s.membership_no))) {
                        s._status = 'approved';
                    }
                });
            } catch (e) {
                console.warn('Could not cross-reference');
            }

            // Filter out locally rejected
            const rejectedStr = localStorage.getItem('rejectedSubmissions');
            if (rejectedStr) {
                const rejected = JSON.parse(rejectedStr);
                const rejectedNos = new Set(rejected.map((r: any) => String(r.membership_no)));
                parsedSubmissions = parsedSubmissions.filter((s: any) => !rejectedNos.has(String(s.membership_no)));
            }

            setSubmissions(parsedSubmissions);
            const pending = parsedSubmissions.filter((s: any) => s._status === 'pending').length;
            toast.success(`Fetched ${parsedSubmissions.length} submissions (${pending} pending)`);

        } catch (err: any) {
            toast.error(err.message || 'Error fetching submissions');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (sub: any) => {
        if (!confirm(`Approve and add member "${sub.name}" to the database?`)) return;

        try {
            const loadingId = toast.loading('Approving...');
            const memberData = {
                membership_no: sub.membership_no,
                name: sub.name,
                mobile: sub.mobile,
                male: sub.male,
                female: sub.female,
                district: sub.district,
                taluka: sub.taluka,
                panchayat: sub.panchayat,
                village: sub.village,
                family_members: sub.family_members, // Assuming backend now handled it, or it falls back
            };

            await api.post('/members/import-rows', { rows: [memberData] });

            toast.dismiss(loadingId);
            toast.success('Member approved and added!');

            setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, _status: 'approved' } : s));
        } catch (err: any) {
            toast.error('Failed to approve member');
        }
    };

    const handleReject = (sub: any) => {
        if (!confirm(`Reject submission from "${sub.name}"?`)) return;

        const rejectedList = JSON.parse(localStorage.getItem('rejectedSubmissions') || '[]');
        rejectedList.push({
            membership_no: sub.membership_no,
            timestamp: sub.timestamp,
        });
        localStorage.setItem('rejectedSubmissions', JSON.stringify(rejectedList));

        setSubmissions(prev => prev.filter(s => s.id !== sub.id));
        toast.success('Submission rejected');
    };

    const stats = {
        total: submissions.length,
        pending: submissions.filter(s => s._status === 'pending').length,
        approved: submissions.filter(s => s._status === 'approved').length
    };

    let displaySubmissions = submissions;
    if (filter === 'pending') {
        displaySubmissions = submissions.filter(s => s._status === 'pending');
    } else if (filter === 'approved') {
        displaySubmissions = submissions.filter(s => s._status === 'approved');
    }

    return (
        <div className="p-8 max-w-7xl mx-auto h-full flex flex-col relative">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Google Form Submissions</h1>
                    <p className="text-slate-500 mt-1">Ingest raw submissions directly from your published Google Sheets.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="text-xl">⚙️</span> Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Google Sheet ID</label>
                        <input
                            type="text"
                            value={sheetId}
                            onChange={(e) => setSheetId(e.target.value)}
                            placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74Og..."
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Sheet Tab Name</label>
                        <input
                            type="text"
                            value={tabName}
                            onChange={(e) => setTabName(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleSaveConfig} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                            Save
                        </button>
                        <button onClick={fetchSubmissions} disabled={loading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50">
                            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
                            Fetch
                        </button>
                    </div>
                </div>
                <div className="mt-4 text-xs text-slate-500">
                    <strong>Important:</strong> The Google Sheet MUST be published to the web. (File → Share → Publish to web → Published as "Web page")
                </div>
            </div>

            {submissions.length > 0 ? (
                <>
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">📊</div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                                <p className="text-sm font-medium text-slate-500 uppercase">Total Items</p>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">⏳</div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
                                <p className="text-sm font-medium text-slate-500 uppercase">Pending Review</p>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">✅</div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stats.approved}</p>
                                <p className="text-sm font-medium text-slate-500 uppercase">Approved</p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6 flex gap-2">
                        <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>All</button>
                        <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Pending</button>
                        <button onClick={() => setFilter('approved')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Approved</button>
                    </div>

                    <div className="space-y-4 flex-1 overflow-y-auto pb-8">
                        {displaySubmissions.map((sub, i) => (
                            <div key={i} className={`bg-white rounded-2xl p-6 border-l-4 shadow-sm ${sub._status === 'pending' ? 'border-amber-400' : 'border-emerald-500'}`}>
                                <div className="flex justify-between items-start mb-4 flex-wrap gap-4">
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                            {sub.name}
                                            <span className="text-sm font-normal text-slate-500">[{sub.membership_no}]</span>
                                        </h4>
                                        <p className="text-sm text-slate-500 mt-1">Submitted on: {sub.timestamp}</p>
                                    </div>
                                    <div>
                                        {sub._status === 'pending' ? (
                                            <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wide">Pending</span>
                                        ) : (
                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wide">Approved</span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                                    <div><strong className="text-slate-700">Mobile:</strong> <span className="text-slate-600">{sub.mobile || 'N/A'}</span></div>
                                    <div><strong className="text-slate-700">District:</strong> <span className="text-slate-600">{sub.district || 'N/A'}</span></div>
                                    <div><strong className="text-slate-700">Taluka:</strong> <span className="text-slate-600">{sub.taluka || 'N/A'}</span></div>
                                    <div><strong className="text-slate-700">Village:</strong> <span className="text-slate-600">{sub.village || 'N/A'}</span></div>
                                    <div><strong className="text-slate-700">Male:</strong> <span className="text-slate-600">{sub.male}</span></div>
                                    <div><strong className="text-slate-700">Female:</strong> <span className="text-slate-600">{sub.female}</span></div>
                                </div>

                                {sub.family_members && (
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4 whitespace-pre-wrap text-sm text-slate-700">
                                        <strong>Family Members:</strong><br />
                                        {sub.family_members}
                                    </div>
                                )}

                                {sub._status === 'pending' && (
                                    <div className="flex gap-3 pt-4 border-t border-slate-100 mt-4">
                                        <button onClick={() => handleApprove(sub)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
                                            <CheckCircle size={16} /> Approve & Import
                                        </button>
                                        <button onClick={() => handleReject(sub)} className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 border border-red-200 font-medium rounded-lg hover:bg-red-50 transition-colors shadow-sm">
                                            <XCircle size={16} /> Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {displaySubmissions.length === 0 && (
                            <div className="text-center p-12 text-slate-500">
                                No submissions found for the selected filter.
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center flex-1">
                    <div className="text-5xl mb-4">📋</div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No Submissions Loaded</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                        Configure your Google Sheet ID and click Fetch to review incoming candidate and member submissions.
                    </p>
                </div>
            )}
        </div>
    );
}
