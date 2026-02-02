import React, { useState, useMemo } from 'react';
import { StrategyItem, Variant } from '../types';
import { getTodayDate } from '../utils';

interface ReviewProps {
    strategies: StrategyItem[];
    setStrategies: React.Dispatch<React.SetStateAction<StrategyItem[]>>;
}

const REVIEW_STATUS_OPTIONS = [
    { label: 'Running', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    { label: 'Off', color: 'bg-slate-100 text-slate-600 border-slate-200' },
    { label: 'Needs Spend', color: 'bg-amber-100 text-amber-800 border-amber-200' },
];

const Review: React.FC<ReviewProps> = ({ strategies, setStrategies }) => {
    const [selectedDetailText, setSelectedDetailText] = useState<string | null>(null);

    // Filter State
    const [tempStartDate, setTempStartDate] = useState<string>('');
    const [tempEndDate, setTempEndDate] = useState<string>('');
    const [appliedStartDate, setAppliedStartDate] = useState<string>('');
    const [appliedEndDate, setAppliedEndDate] = useState<string>('');

    const [hideOff, setHideOff] = useState(false);
    const [hideNeedsSpend, setHideNeedsSpend] = useState(false);
    const [errorModal, setErrorModal] = useState<{ show: boolean, message: string }>({ show: false, message: '' });

    const parseDate = (dateStr: string) => {
        if (!dateStr) return 0;
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            // Input: DD/MM/YYYY
            return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
        }
        return 0;
    };

    const liveAds = useMemo(() => {
        return strategies
            .flatMap(s => s.variants.filter(v => v.status === 'Live'))
            .filter(v => {
                // Status filtering
                const status = v.reviewStatus || 'Running';
                if (hideOff && status === 'Off') return false;
                if (hideNeedsSpend && status === 'Needs Spend') return false;

                // Date filtering
                if (appliedStartDate || appliedEndDate) {
                    if (!v.launchDate) return true;
                    const vTime = parseDate(v.launchDate);
                    const startTime = appliedStartDate ? new Date(appliedStartDate).getTime() : 0;
                    const endTime = appliedEndDate ? new Date(appliedEndDate).getTime() : Infinity;
                    if (vTime < startTime || vTime > endTime) return false;
                }
                return true;
            })
            .sort((a, b) => b.id.localeCompare(a.id));
    }, [strategies, hideOff, hideNeedsSpend, appliedStartDate, appliedEndDate]);

    const calculateDaysSinceLaunch = (launchDate: string): string => {
        if (!launchDate) return '-';
        const parts = launchDate.split('/');
        if (parts.length !== 3) return '-';

        const launch = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - launch.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    };

    const handleReviewStatusChange = (variantId: string, newStatus: string) => {
        setStrategies(prev => prev.map(s => ({
            ...s,
            variants: s.variants.map(v =>
                v.id === variantId ? { ...v, reviewStatus: newStatus } : v
            )
        })));
    };

    const getStatusColor = (status: string) => {
        const option = REVIEW_STATUS_OPTIONS.find(opt => opt.label === status);
        return option?.color || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const handleApplyDateFilter = () => {
        if (!tempStartDate || !tempEndDate) {
            setErrorModal({ show: true, message: 'Please select both a "From" and "To" date to apply the filter.' });
            return;
        }
        setAppliedStartDate(tempStartDate);
        setAppliedEndDate(tempEndDate);
    };

    const handleClearDateFilter = () => {
        setTempStartDate('');
        setTempEndDate('');
        setAppliedStartDate('');
        setAppliedEndDate('');
    };

    return (
        <div className="p-6 h-full flex flex-col space-y-6 bg-gray-50 overflow-hidden">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 shrink-0 flex items-center justify-between">
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 flex items-center">
                    <i className="fa-solid fa-chart-line mr-2 text-indigo-500"></i>
                    Live Ads Review
                </h3>

                <div className="flex items-center gap-4">
                    {/* Date Filter */}
                    <div className="flex items-center bg-gray-50 p-2 rounded-xl border border-gray-200 gap-3">
                        <div className="flex items-center gap-2">
                            <i className="fa-solid fa-calendar-day text-slate-400 text-xs"></i>
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-0.5">From Launch Date</span>
                                <input type="date" value={tempStartDate} onChange={(e) => setTempStartDate(e.target.value)} className="bg-white border border-gray-300 rounded px-1 py-0.5 text-[10px] focus:ring-1 focus:ring-indigo-500 outline-none w-28 h-6" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-0.5">To Launch Date</span>
                                <input type="date" value={tempEndDate} onChange={(e) => setTempEndDate(e.target.value)} className="bg-white border border-gray-300 rounded px-1 py-0.5 text-[10px] focus:ring-1 focus:ring-indigo-500 outline-none w-28 h-6" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 ml-1 border-l border-gray-200 pl-2">
                            <button onClick={handleApplyDateFilter} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-sm">OK</button>
                            {(appliedStartDate || appliedEndDate) && (
                                <button onClick={handleClearDateFilter} className="bg-white border border-gray-300 text-slate-400 px-2 py-1.5 rounded-lg text-[10px] font-black hover:text-red-500 hover:border-red-200 transition-all"><i className="fa-solid fa-xmark"></i></button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setHideOff(!hideOff)}
                            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm flex items-center gap-2 ${hideOff ? 'bg-slate-800 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400 hover:text-slate-600'}`}
                        >
                            <i className={`fa-solid ${hideOff ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            <span>Hide Off</span>
                        </button>
                        <button
                            onClick={() => setHideNeedsSpend(!hideNeedsSpend)}
                            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm flex items-center gap-2 ${hideNeedsSpend ? 'bg-amber-600 text-white border-amber-700' : 'bg-white text-slate-400 border-slate-200 hover:border-amber-500 hover:text-amber-600'}`}
                        >
                            <i className={`fa-solid ${hideNeedsSpend ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            <span>Hide Spend</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                        <i className="fa-solid fa-signal mr-2 text-emerald-500"></i>
                        Live Ads Review
                    </h3>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                        {liveAds.length} Active
                    </span>
                </div>

                <div className="overflow-auto flex-1">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead className="sticky top-0 bg-gray-50 z-10 shadow-sm">
                            <tr className="text-[10px] text-gray-500 uppercase tracking-widest font-black border-b border-gray-100">
                                <th className="w-[150px] px-4 py-3 text-left">Status</th>
                                <th className="w-[140px] px-4 py-3 text-left">Name</th>
                                <th className="w-[100px] px-4 py-3 text-left">Launch</th>
                                <th className="w-[100px] px-4 py-3 text-left">Time</th>
                                <th className="px-4 py-3 text-left">Concept</th>
                                <th className="w-[120px] px-4 py-3 text-left">Landing</th>
                                <th className="w-[80px] px-4 py-3 text-center">Video</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {liveAds.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400 italic text-sm">
                                        No live ads currently.
                                    </td>
                                </tr>
                            ) : (
                                liveAds.map((v) => (
                                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-4">
                                            <select
                                                value={v.reviewStatus || 'Running'}
                                                onChange={(e) => handleReviewStatusChange(v.id, e.target.value)}
                                                className={`w-full px-2 py-2 rounded-full text-[11px] font-black border outline-none cursor-pointer transition-all ${getStatusColor(v.reviewStatus || 'Running')} appearance-none text-center shadow-sm`}
                                            >
                                                {REVIEW_STATUS_OPTIONS.map(opt => (
                                                    <option key={opt.label} value={opt.label} className="bg-white text-slate-800">
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td
                                            className="px-4 py-4 text-sm font-bold text-slate-800 truncate cursor-pointer hover:text-indigo-600 transition-colors"
                                            onClick={() => setSelectedDetailText(v.name)}
                                        >
                                            {v.name}
                                        </td>
                                        <td className="px-4 py-4 text-[11px] font-mono text-slate-500 italic">
                                            {v.launchDate || '-'}
                                        </td>
                                        <td className="px-4 py-4 text-[11px] font-mono text-indigo-600 font-bold">
                                            {calculateDaysSinceLaunch(v.launchDate)}
                                        </td>
                                        <td
                                            className="px-4 py-4 text-sm text-slate-600 font-medium truncate cursor-pointer hover:text-indigo-600 transition-colors"
                                            onClick={() => setSelectedDetailText(v.concept)}
                                        >
                                            {v.concept}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[10px] font-black block truncate shadow-sm uppercase">
                                                {v.landingPage}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {v.videoLink ? (
                                                <a
                                                    href={v.videoLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center justify-center w-8 h-8 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all border border-rose-100 shadow-sm"
                                                >
                                                    <i className="fa-solid fa-video text-xs"></i>
                                                </a>
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedDetailText && (
                <div
                    onClick={() => setSelectedDetailText(null)}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 cursor-default"
                    >
                        <div className="p-12 max-h-[80vh] overflow-y-auto text-center">
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-xl font-medium">
                                {selectedDetailText}
                            </p>
                        </div>
                    </div>
                </div>
            )}
            {/* Error Modal */}
            {errorModal.show && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <i className="fa-solid fa-triangle-exclamation text-3xl"></i>
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 mb-2">Attention Required</h2>
                            <p className="text-gray-500 font-bold leading-relaxed">{errorModal.message}</p>
                        </div>
                        <div className="p-6 bg-gray-50 border-t border-gray-100">
                            <button
                                onClick={() => setErrorModal({ show: false, message: '' })}
                                className="w-full px-6 py-4 bg-gray-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg"
                            >
                                Understood
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Review;
