import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
    ArrowLeft, Users, Heart, ChevronDown, ChevronRight,
    Crown, Plus, ZoomIn, ZoomOut
} from 'lucide-react';
import type { FamilyMember } from '../types';

// ─── Color mapping for relations ─────────────────────
function getRelationColor(relation: string) {
    const r = relation.toLowerCase();
    if (r.includes('wife') || r.includes('husband') || r.includes('spouse')) return { bg: 'from-rose-500 to-pink-500', text: 'text-rose-400', border: 'border-rose-500/30' };
    if (r.includes('son') || r.includes('daughter') || r.includes('child')) return { bg: 'from-emerald-500 to-teal-500', text: 'text-emerald-400', border: 'border-emerald-500/30' };
    if (r.includes('father') || r.includes('mother') || r.includes('parent')) return { bg: 'from-amber-500 to-orange-500', text: 'text-amber-400', border: 'border-amber-500/30' };
    if (r.includes('brother') || r.includes('sister') || r.includes('sibling')) return { bg: 'from-blue-500 to-cyan-500', text: 'text-blue-400', border: 'border-blue-500/30' };
    return { bg: 'from-indigo-500 to-purple-500', text: 'text-indigo-400', border: 'border-indigo-500/30' };
}

function getRelationIcon(relation: string) {
    const r = relation.toLowerCase();
    if (r.includes('wife') || r.includes('husband') || r.includes('spouse')) return '💑';
    if (r.includes('son')) return '👦';
    if (r.includes('daughter')) return '👧';
    if (r.includes('father')) return '👨‍🦳';
    if (r.includes('mother')) return '👩‍🦳';
    if (r.includes('brother')) return '👦';
    if (r.includes('sister')) return '👧';
    return '👤';
}

// ─── Grouping family by relationship type ────────────
function groupByRelation(members: FamilyMember[]) {
    const groups: Record<string, FamilyMember[]> = {};
    members.forEach(m => {
        const key = categorizeRelation(m.relation);
        if (!groups[key]) groups[key] = [];
        groups[key].push(m);
    });
    return groups;
}

function categorizeRelation(relation: string): string {
    const r = relation.toLowerCase();
    if (r.includes('wife') || r.includes('husband') || r.includes('spouse')) return 'Spouse';
    if (r.includes('son') || r.includes('daughter') || r.includes('child')) return 'Children';
    if (r.includes('father') || r.includes('mother') || r.includes('parent')) return 'Parents';
    if (r.includes('brother') || r.includes('sister') || r.includes('sibling')) return 'Siblings';
    return 'Other Relations';
}

const GROUP_ORDER = ['Spouse', 'Children', 'Parents', 'Siblings', 'Other Relations'];

export default function FamilyTree() {
    const { member } = useAuth();
    const [zoom, setZoom] = useState(1);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
        Object.fromEntries(GROUP_ORDER.map(g => [g, true]))
    );

    const familyMembers = member?.family_members || [];
    const groups = groupByRelation(familyMembers);

    const toggleGroup = (group: string) => {
        setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
    };

    return (
        <div className="max-w-4xl mx-auto pb-20 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link to="/profile" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-2">
                        <ArrowLeft size={16} /> Back to Profile
                    </Link>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        Family Tree
                    </h1>
                    <p className="text-slate-400 mt-1">
                        {member?.name}&apos;s family • {familyMembers.length + 1} members
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setZoom(z => Math.max(0.6, z - 0.1))} className="p-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors">
                        <ZoomOut size={18} />
                    </button>
                    <span className="text-sm text-slate-500 font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="p-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors">
                        <ZoomIn size={18} />
                    </button>
                </div>
            </div>

            {/* Tree Visualization */}
            <div className="overflow-x-auto overflow-y-visible" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
                {/* Head of Family — Root Node */}
                <div className="flex flex-col items-center">
                    <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 shadow-2xl shadow-blue-500/20 border border-blue-400/30 max-w-xs w-full">
                        <div className="absolute -top-3 -right-3 p-1.5 bg-amber-500 rounded-full shadow-lg">
                            <Crown size={16} className="text-white" />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-blue-900/80 border-2 border-blue-400/50 flex items-center justify-center text-2xl font-bold text-white shadow-inner">
                                {member?.profile_photo_url ? (
                                    <img src={member.profile_photo_url} referrerPolicy="no-referrer" alt={member.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    member?.name?.[0]?.toUpperCase() || '?'
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">{member?.name}</h3>
                                <p className="text-blue-200 text-sm font-medium">Head of Family</p>
                                <p className="text-blue-300/60 text-xs">#{member?.membership_no}</p>
                            </div>
                        </div>
                        {member?.village && (
                            <p className="text-blue-200/60 text-xs mt-3 flex items-center gap-1.5">
                                📍 {member.village}{member.district ? `, ${member.district}` : ''}
                            </p>
                        )}
                    </div>

                    {/* Connector Line */}
                    {familyMembers.length > 0 && (
                        <div className="w-px h-8 bg-gradient-to-b from-blue-500 to-slate-600" />
                    )}
                </div>

                {/* Grouped Family Members */}
                {familyMembers.length === 0 ? (
                    <div className="text-center py-12 bg-slate-800/50 border border-slate-700/50 rounded-2xl mt-4">
                        <Users size={40} className="text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 mb-4">No family members added yet.</p>
                        <Link to="/profile" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium transition-colors">
                            <Plus size={16} /> Add Family Members
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4 mt-2">
                        {GROUP_ORDER.filter(g => groups[g]).map(groupName => {
                            const members = groups[groupName];
                            const isExpanded = expandedGroups[groupName];
                            const colors = getRelationColor(groupName === 'Other Relations' ? 'other' : groupName.toLowerCase());

                            return (
                                <div key={groupName} className={`bg-slate-800/50 border ${colors.border} rounded-2xl overflow-hidden`}>
                                    {/* Group Header */}
                                    <button
                                        onClick={() => toggleGroup(groupName)}
                                        className="w-full p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colors.bg} flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
                                                {members.length}
                                            </div>
                                            <div className="text-left">
                                                <h3 className="font-semibold text-white">{groupName}</h3>
                                                <p className="text-xs text-slate-500">{members.length} member{members.length > 1 ? 's' : ''}</p>
                                            </div>
                                        </div>
                                        {isExpanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                                    </button>

                                    {/* Group Members */}
                                    {isExpanded && (
                                        <div className="px-4 pb-4 grid gap-3 sm:grid-cols-2">
                                            {members.map((fm, idx) => {
                                                const relColors = getRelationColor(fm.relation);
                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`bg-slate-900/60 border ${relColors.border} rounded-xl p-4 hover:bg-slate-800/80 transition-colors group`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${relColors.bg} flex items-center justify-center text-lg shadow-lg`}>
                                                                {getRelationIcon(fm.relation)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-semibold text-white truncate">{fm.name || 'Unnamed'}</h4>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className={`text-xs font-medium ${relColors.text}`}>
                                                                        <Heart size={10} className="inline mr-1" />
                                                                        {fm.relation || 'N/A'}
                                                                    </span>
                                                                    {fm.age && (
                                                                        <span className="text-xs text-slate-500">• {fm.age} yrs</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${fm.gender === 'female'
                                                                ? 'bg-pink-500/15 text-pink-400'
                                                                : 'bg-blue-500/15 text-blue-400'
                                                                }`}>
                                                                {fm.gender === 'female' ? '♀' : '♂'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Summary Footer */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-white">{familyMembers.length + 1}</div>
                    <div className="text-xs text-slate-400 mt-1">Total Members</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400">{familyMembers.filter(f => f.gender === 'male').length + (member?.head_gender === 'male' ? 1 : 0)}</div>
                    <div className="text-xs text-slate-400 mt-1">Male</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-pink-400">{familyMembers.filter(f => f.gender === 'female').length + (member?.head_gender === 'female' ? 1 : 0)}</div>
                    <div className="text-xs text-slate-400 mt-1">Female</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-400">{familyMembers.filter(f => categorizeRelation(f.relation) === 'Children').length}</div>
                    <div className="text-xs text-slate-400 mt-1">Children</div>
                </div>
            </div>
        </div>
    );
}
