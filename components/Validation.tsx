
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { StrategyItem, Variant } from '../types';

interface ValidationProps {
  strategies: StrategyItem[];
  setStrategies: React.Dispatch<React.SetStateAction<StrategyItem[]>>;
  emulatedDate: string;
}

const VA_STATUS_OPTIONS = [
  { label: 'Ready to Launch', color: 'bg-emerald-100 text-emerald-800 border-emerald-200 font-bold' },
  { label: 'In Review', color: 'bg-amber-500 text-white font-bold' },
  { label: 'Live', color: 'bg-emerald-600 text-white border-none font-bold shadow-sm' },
  { label: 'Canceled', color: 'bg-red-50 text-red-700 border-none font-bold' },
];



const Validation: React.FC<ValidationProps> = ({ strategies, setStrategies, emulatedDate }) => {
  const [selectedDetailText, setSelectedDetailText] = useState<string | null>(null);

  const [hideLive, setHideLive] = useState(false);

  const [rejectionModalVariantId, setRejectionModalVariantId] = useState<string | null>(null);
  const [rejectionDestination, setRejectionDestination] = useState<'Strategist' | 'Editor' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [errorModal, setErrorModal] = useState<{ show: boolean, message: string }>({ show: false, message: '' });

  const filterMenuRef = useRef<HTMLDivElement>(null);

  // Date Filtering State
  const [tempStartDate, setTempStartDate] = useState<string>('');
  const [tempEndDate, setTempEndDate] = useState<string>('');
  const [appliedStartDate, setAppliedStartDate] = useState<string>('');
  const [appliedEndDate, setAppliedEndDate] = useState<string>('');

  const parseDate = (dateStr: string) => {
    if (!dateStr) return 0;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      // Input: DD/MM/YYYY
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
    }
    return 0;
  };


  useEffect(() => {
    // Legacy handleClickOutside removed as filter menu is gone
  }, []);


  const leftVariants = useMemo(() => {
    return strategies
      .flatMap(s => s.variants.filter(v => v.status === 'Completed'))
      .filter(v => {
        if (appliedStartDate || appliedEndDate) {
          const vTime = parseDate(v.compDate || '');
          const startTime = appliedStartDate ? new Date(appliedStartDate).getTime() : 0;
          const endTime = appliedEndDate ? new Date(appliedEndDate).getTime() : Infinity;
          if (vTime < startTime || vTime > endTime) return false;
        }
        return true;
      })
      .sort((a, b) => b.id.localeCompare(a.id));
  }, [strategies, appliedStartDate, appliedEndDate]);


  const rightVariants = useMemo(() => {
    return strategies
      .flatMap(s => s.variants.filter(v =>
        ['Ready to Launch', 'In Review', 'Live', 'Canceled'].includes(v.status)
      ))
      .filter(v => !hideLive || v.status !== 'Live')

      .filter(v => {
        if (appliedStartDate || appliedEndDate) {
          if (!v.launchDate) return true; // Keep items without a launch date visible
          const vTime = parseDate(v.launchDate);
          const startTime = appliedStartDate ? new Date(appliedStartDate).getTime() : 0;
          const endTime = appliedEndDate ? new Date(appliedEndDate).getTime() : Infinity;
          if (vTime < startTime || vTime > endTime) return false;
        }
        return true;
      })
      .sort((a, b) => b.id.localeCompare(a.id));
  }, [strategies, hideLive, appliedStartDate, appliedEndDate]);




  const handleApprove = (variantId: string) => {
    setStrategies(prev => prev.map(s => ({
      ...s,
      variants: s.variants.map(v => {
        if (v.id === variantId) {
          // Only updating status to Ready to Launch, preserving all dates. 
          // launchDate remains empty until set to Live.
          return { ...v, status: 'Ready to Launch', launchDate: '' };
        }

        return v;
      })
    })));
  };





  const handleRejectToStrategist = (variantId: string) => {
    if (!rejectionReason.trim()) {
      setErrorModal({ show: true, message: 'Please provide a reason for rejection.' });
      return;
    }
    const now = emulatedDate;
    setStrategies(prev => prev.map(s => ({
      ...s,
      variants: s.variants.map(v => {
        if (v.id === variantId) {
          const newHistory = [...(v.rejectionHistory || []), { source: 'VA' as const, message: rejectionReason, destination: 'Strategist' as const }];
          return {
            ...v,
            status: 'Rejected',
            launchDate: '',
            reviewDate: '',
            compDate: '',
            editDate: '',
            rejectionHistory: newHistory
          };
        }

        return v;
      })
    })));
    setRejectionModalVariantId(null);
    setRejectionDestination(null);
    setRejectionReason('');
  };

  const handleRejectToEditor = (variantId: string) => {
    if (!rejectionReason.trim()) {
      setErrorModal({ show: true, message: 'Please provide a reason for rejection.' });
      return;
    }
    const now = emulatedDate;
    setStrategies(prev => prev.map(s => ({
      ...s,
      variants: s.variants.map(v => {
        if (v.id === variantId) {
          const newHistory = [...(v.rejectionHistory || []), { source: 'VA' as const, message: rejectionReason, destination: 'Editor' as const }];
          return {
            ...v,
            status: 'Rejected', // Technical accuracy for production queue
            reviewDate: now,
            editDate: v.editDate, // Preserve existing production start date
            compDate: '',         // Clear completion date on rejection
            launchDate: '',       // Ensure launchDate is clear
            rejectionHistory: newHistory
          };
        }

        return v;
      })
    })));
    setRejectionModalVariantId(null);
    setRejectionDestination(null);
    setRejectionReason('');
  };



  const handleStatusChange = (variantId: string, nextStatus: string) => {
    const now = emulatedDate;
    setStrategies(prev => prev.map(s => ({
      ...s,
      variants: s.variants.map(v => {
        if (v.id === variantId) {
          const updated = { ...v, status: nextStatus };
          if (nextStatus === 'Live') {
            updated.launchDate = now;
          } else {
            // Requirement: launchDate set only when Live
            updated.launchDate = '';
          }
          return updated;
        }
        return v;
      })
    })));
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

  const getStatusStyle = (label: string) => {
    const option = VA_STATUS_OPTIONS.find(opt => opt.label === label);
    return option?.color || 'bg-slate-800 text-white border-slate-700';
  };

  const TableHeader = ({ type }: { type: 'left' | 'right' }) => (
    <thead className="sticky top-0 bg-gray-50 z-10 shadow-sm">
      <tr className="text-[10px] text-gray-500 uppercase tracking-widest font-black border-b border-gray-100">
        <th className="w-[165px] px-4 py-3 text-left">Status</th>

        {type === 'left' ? (
          <th className="w-[90px] px-4 py-3 text-left">Comp</th>
        ) : (
          <th className="w-[90px] px-4 py-3 text-left">Launch</th>
        )}

        <th className="px-4 py-3 text-left">Concept</th>
        <th className="w-[100px] px-4 py-3 text-left">Landing</th>
        <th className="w-[50px] px-4 py-3 text-center">Script</th>
        <th className="w-[50px] px-4 py-3 text-center">Video</th>
        <th className="w-[80px] px-4 py-3 text-left cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => setSelectedDetailText('Name')}>Name</th>

      </tr>
    </thead>
  );


  return (
    <div className="p-6 h-full flex flex-col space-y-6 bg-gray-50 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 shrink-0 flex items-center justify-between">
        <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 flex items-center">
          <i className="fa-solid fa-calendar-check mr-2 text-indigo-500"></i>
          Validation Control
        </h3>

        {/* Unified Date Filter */}
        <div className="flex items-center bg-gray-50 p-2 rounded-xl border border-gray-200 gap-3 mx-4">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-calendar-day text-slate-400 text-xs"></i>
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-0.5 whitespace-nowrap">Filter Range</span>
              <div className="flex items-center gap-1">
                <input type="date" value={tempStartDate} onChange={(e) => setTempStartDate(e.target.value)} className="bg-white border border-gray-300 rounded px-1 py-0.5 text-[10px] focus:ring-1 focus:ring-indigo-500 outline-none w-28 h-6" />
                <span className="text-gray-400 text-[10px]">-</span>
                <input type="date" value={tempEndDate} onChange={(e) => setTempEndDate(e.target.value)} className="bg-white border border-gray-300 rounded px-1 py-0.5 text-[10px] focus:ring-1 focus:ring-indigo-500 outline-none w-28 h-6" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 ml-1 border-l border-gray-200 pl-2">
            <button onClick={handleApplyDateFilter} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-sm">OK</button>
            {(appliedStartDate || appliedEndDate) && (
              <button onClick={handleClearDateFilter} className="bg-white border border-gray-300 text-slate-400 px-2 py-1.5 rounded-lg text-[10px] font-black hover:text-red-500 hover:border-red-200 transition-all"><i className="fa-solid fa-xmark"></i></button>
            )}
          </div>
        </div>
        {/* Hide Live Toggle Button */}
        <div className="ml-auto pr-4">
          <button
            onClick={() => setHideLive(!hideLive)}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm flex items-center gap-2 ${hideLive ? 'bg-amber-600 text-white border-amber-700' : 'bg-white text-slate-400 border-slate-200 hover:border-emerald-500 hover:text-emerald-600'}`}
          >
            <i className={`fa-solid ${hideLive ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            <span>{hideLive ? 'Show Live' : 'Hide Live'}</span>
          </button>
        </div>
      </div>



      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0 overflow-hidden">

        <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-0">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
            <h3 className="text-lg font-bold text-gray-800 flex items-center"><i className="fa-solid fa-hourglass-end mr-2 text-green-500"></i>Review Queue</h3>

            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">{leftVariants.length} Items</span>
          </div>
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse table-fixed">
              <TableHeader type="left" />
              <tbody className="divide-y divide-gray-50">
                {leftVariants.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400 italic text-sm">No items waiting for validation.</td></tr>
                ) : (
                  leftVariants.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleApprove(v.id)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black py-2 rounded-lg transition-all shadow-sm uppercase tracking-widest"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectionModalVariantId(v.id)}
                            className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[10px] font-black py-2 rounded-lg transition-all uppercase tracking-widest"
                          >
                            Reject
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-[11px] font-mono text-slate-500 italic">{v.compDate || '-'}</td>
                      <td className="px-4 py-4 text-sm text-slate-600 font-medium truncate cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => setSelectedDetailText(v.concept)}>{v.concept}</td>
                      <td className="px-4 py-4 text-center"><span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[10px] font-black block truncate shadow-sm uppercase">{v.landingPage}</span></td>
                      <td className="px-4 py-4 text-center">{v.scriptLink ? (<a href={v.scriptLink} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-600"><i className="fa-solid fa-file-lines"></i></a>) : '-'}</td>
                      <td className="px-4 py-4 text-center">{v.videoLink ? (<a href={v.videoLink} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-rose-600"><i className="fa-solid fa-video"></i></a>) : '-'}</td>
                      <td className="px-4 py-4 text-sm font-bold text-slate-800 truncate cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => setSelectedDetailText(v.name)}>{v.name}</td>

                    </tr>
                  )))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-0">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
            <h3 className="text-lg font-bold text-gray-800 flex items-center"><i className="fa-solid fa-clipboard-check mr-2 text-indigo-500"></i>Launching Queue</h3>

            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">{rightVariants.length} Active</span>
          </div>
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse table-fixed">
              <TableHeader type="right" />
              <tbody className="divide-y divide-gray-50">
                {rightVariants.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400 italic text-sm">No items matching current filter.</td></tr>
                ) : (
                  rightVariants.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <select value={v.status} onChange={(e) => handleStatusChange(v.id, e.target.value)} className={`w-full px-2 py-2 rounded-full text-[11px] font-black border outline-none cursor-pointer transition-all ${getStatusStyle(v.status)} appearance-none text-center shadow-sm`}>
                          {v.status === 'Ready to Launch' ? (
                            <>
                              <option value="Ready to Launch">Ready to Launch</option>
                              <option value="Live">Live</option>
                            </>
                          ) : v.status === 'Live' ? (
                            <>
                              <option value="Live">Live</option>
                              <option value="Ready to Launch">Ready to Launch</option>
                              <option value="Completed" className="bg-slate-800 text-white font-normal">Back to Comp</option>
                            </>
                          ) : (
                            VA_STATUS_OPTIONS.map(opt => <option key={opt.label} value={opt.label} className="bg-slate-800 text-white font-normal">{opt.label}</option>)
                          )}
                          {v.status !== 'Live' && <option value="Completed" className="bg-slate-800 text-white font-normal">Back to Comp</option>}
                        </select>


                      </td>
                      <td className="px-4 py-4 text-[11px] font-mono text-slate-500 italic">{v.launchDate || '-'}</td>

                      <td className="px-4 py-4 text-sm text-slate-600 font-medium truncate cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => setSelectedDetailText(v.concept)}>{v.concept}</td>
                      <td className="px-4 py-4 text-center"><span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[10px] font-black block truncate shadow-sm uppercase">{v.landingPage}</span></td>
                      <td className="px-4 py-4 text-center">{v.scriptLink ? (<a href={v.scriptLink} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-600"><i className="fa-solid fa-file-lines"></i></a>) : '-'}</td>
                      <td className="px-4 py-4 text-center">{v.videoLink ? (<a href={v.videoLink} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-rose-600"><i className="fa-solid fa-video"></i></a>) : '-'}</td>
                      <td className="px-4 py-4 text-sm font-bold text-slate-800 truncate cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => setSelectedDetailText(v.name)}>{v.name}</td>

                    </tr>
                  )))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {rejectionModalVariantId && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 text-center border-b border-gray-100 bg-rose-50/20">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className={`fa-solid ${rejectionDestination ? 'fa-comment-dots' : 'fa-reply-all'} text-3xl`}></i>

              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 mb-2">Reject Item</h2>
              <p className="text-gray-500 font-bold leading-relaxed">
                {rejectionDestination === 'Strategist' ? 'Rejection details for Strategist' : rejectionDestination === 'Editor' ? 'Rejection details for Editor' : 'Where should this item be sent back to?'}
              </p>

            </div>

            {rejectionDestination ? (
              <div className="p-6 bg-gray-50/50">
                <textarea
                  autoFocus
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder={`Why are you sending this back to the ${rejectionDestination}?`}
                  className="w-full h-32 px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all shadow-sm text-gray-800 placeholder-gray-400 font-medium resize-none"
                />
                <div className="mt-4 flex space-x-2">
                  <button onClick={() => setRejectionDestination(null)} className="flex-1 px-4 py-3 bg-gray-200 text-gray-600 rounded-xl font-black uppercase tracking-widest hover:bg-gray-300 transition-all text-[10px]">Back</button>
                  <button
                    onClick={() => rejectionDestination === 'Strategist' ? handleRejectToStrategist(rejectionModalVariantId) : handleRejectToEditor(rejectionModalVariantId)}
                    className="flex-[2] px-4 py-3 bg-rose-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-rose-700 transition-all text-[10px] shadow-lg shadow-rose-200"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 space-y-3 bg-white">
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => setRejectionDestination('Strategist')}
                    className="w-full px-6 py-4 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all text-[10px] flex items-center justify-between"
                  >
                    <span>Back to Strategist</span>
                    <i className="fa-solid fa-chess"></i>
                  </button>
                  <button
                    onClick={() => setRejectionDestination('Editor')}
                    className="w-full px-6 py-4 bg-amber-500 text-white rounded-xl font-black uppercase tracking-widest hover:bg-amber-600 shadow-lg shadow-amber-200 transition-all text-[10px] flex items-center justify-between"
                  >
                    <span>Back to Editor</span>
                    <i className="fa-solid fa-pen-nib"></i>
                  </button>
                </div>
                <button
                  onClick={() => { setRejectionModalVariantId(null); setRejectionReason(''); setRejectionDestination(null); }}
                  className="w-full px-6 py-2 text-gray-400 font-black uppercase tracking-widest hover:text-gray-600 transition-colors text-[10px]"
                >
                  Cancel
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {selectedDetailText && (
        <div onClick={() => setSelectedDetailText(null)} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 cursor-default">
            <div className="p-12 max-h-[80vh] overflow-y-auto text-center">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-xl font-medium">{selectedDetailText}</p>
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

export default Validation;
