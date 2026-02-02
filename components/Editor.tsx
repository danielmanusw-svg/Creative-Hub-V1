import React, { useState, useMemo } from 'react';
import { StrategyItem, Variant } from '../types';
import { getTodayDate } from '../utils';
import { useStrategy } from '../src/context/StrategyContext';

const STATUS_OPTIONS = [
  { label: 'Ready to edit', color: 'bg-green-100 text-green-800 border-green-200' },
  { label: 'Completed', color: 'bg-green-600 text-white border-green-700 shadow-sm' },
  { label: 'Rejected', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  { label: 'Scripting', color: 'bg-slate-100 text-slate-500 border-slate-200' },
];


const Editor: React.FC = () => {
  const { strategies, updateVariant } = useStrategy();
  const [isEditMode, setIsEditMode] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [editingVideoVariant, setEditingVideoVariant] = useState<Variant | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<{ show: boolean, message: string }>({ show: false, message: '' });
  const [blockModal, setBlockModal] = useState<{ show: boolean, message: string }>({ show: false, message: '' });
  const [rejectionModalVariantId, setRejectionModalVariantId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionMessagesToShow, setRejectionMessagesToShow] = useState<{ source: 'Editor' | 'VA'; message: string }[] | null>(null);
  const [prodVisibleCount, setProdVisibleCount] = useState(10);



  const [editSortOrder, setEditSortOrder] = useState<'asc' | 'desc'>('desc');

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


  const mirroredVariants = useMemo(() => {
    // Newest variants at top (highest ID)
    return strategies
      .flatMap(s => s.variants.filter(v =>
        v.status === 'Ready to edit' ||
        v.status === 'Completed' ||
        v.status === 'Rejected' ||
        (v.status === 'In Progress' && v.rejectionHistory?.some(h => h.source === 'VA' && h.destination === 'Strategist')) ||
        ['Ready to Launch', 'Approved', 'In Review', 'Live', 'Canceled'].includes(v.status)
      ))
      .filter(v => true)
      .sort((a, b) => {
        const timeA = parseDate(a.editDate || '');
        const timeB = parseDate(b.editDate || '');
        if (timeA !== timeB) {
          return editSortOrder === 'desc' ? timeB - timeA : timeA - timeB;
        }
        return b.id.localeCompare(a.id);
      });

  }, [strategies, editSortOrder]);

  const approvalQueue = useMemo(() => {
    return mirroredVariants
      .filter(v => v.status === 'Ready to edit' && !v.editDate)
      .sort((a, b) => a.id.localeCompare(b.id)); // Oldest first (ascending IDs)
  }, [mirroredVariants]);

  const productionQueue = useMemo(() => {
    return mirroredVariants
      .filter(v =>
        (v.status === 'Ready to edit' && v.editDate) ||
        v.status === 'Rejected' ||
        v.status === 'In Progress' ||
        v.status === 'Completed' ||
        ['Ready to Launch', 'In Review', 'Live', 'Canceled'].includes(v.status)
      )
      .filter(v => {
        if (appliedStartDate || appliedEndDate) {
          if (!v.editDate) return false;
          const vTime = parseDate(v.editDate);
          const startTime = appliedStartDate ? new Date(appliedStartDate).getTime() : 0;
          const endTime = appliedEndDate ? new Date(appliedEndDate).getTime() : Infinity;
          if (vTime < startTime || vTime > endTime) return false;
        }
        return true;
      });
  }, [mirroredVariants, appliedStartDate, appliedEndDate]);

  const filteredProductionQueue = useMemo(() => {
    return productionQueue.filter(v => !hideCompleted || (v.status !== 'Completed' && !['Ready to Launch', 'In Review', 'Live', 'Canceled'].includes(v.status)));
  }, [productionQueue, hideCompleted]);

  const handleAccept = (variantId: string) => {
    const now = getTodayDate();
    updateVariant(variantId, { editDate: now });
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

  const handleReject = (variantId: string) => {
    setRejectionModalVariantId(variantId);
    setRejectionReason('');
  };

  const handleConfirmReject = () => {
    if (!rejectionModalVariantId) return;
    if (!rejectionReason.trim()) {
      setErrorModal({ show: true, message: 'Please provide a reason for rejection.' });
      return;
    }

    const variant = strategies.flatMap(s => s.variants).find(v => v.id === rejectionModalVariantId);
    const newHistory = [...(variant?.rejectionHistory || []), { source: 'Editor' as const, message: rejectionReason }];

    updateVariant(rejectionModalVariantId, {
      status: 'Rejected',
      editDate: '',
      reviewDate: '',
      compDate: '',
      rejectionHistory: newHistory
    });

    setRejectionModalVariantId(null);
    setRejectionReason('');
  };






  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>, variantId: string) => {
    e.stopPropagation();
    const nextStatus = e.target.value;
    const now = getTodayDate();

    const currentVariant = mirroredVariants.find(v => v.id === variantId);

    if (nextStatus === 'Completed') {
      if (!currentVariant?.videoLink || currentVariant.videoLink.trim() === '') {
        setErrorModal({ show: true, message: 'A video link must be provided before changing the status to "Completed".' });
        return;
      }
    }

    if (nextStatus === 'Rejected' && currentVariant?.status !== 'Rejected') {
      setErrorModal({ show: true, message: 'Rows can only be set to "Rejected" via the rejection workflow.' });
      return;
    }

    const updates: Partial<Variant> = { status: nextStatus };
    if (nextStatus === 'Completed') {
      updates.compDate = now;
    } else if (nextStatus === 'Ready to edit') {
      updates.compDate = '';
    }

    updateVariant(variantId, updates);
  };

  const handleVideoClick = (e: React.MouseEvent, v: Variant) => {
    e.stopPropagation();
    const isVal = ['Ready to Launch', 'In Review', 'Live', 'Canceled'].includes(v.status);
    if ((v.status === 'Completed' || isVal) && (isEditMode || !v.videoLink)) {
      setBlockModal({
        show: true,
        message: isVal
          ? 'You cannot change the video link while the item is Validated. Please change the status in the VA tab.'
          : 'You cannot change the video link while the status is "Completed". Please change the status back to "Ready to edit" first.'
      });
      return;
    }

    if (isEditMode || !v.videoLink) {
      setEditingVideoVariant(v);
      setVideoUrlInput(v.videoLink || '');
    } else {
      window.open(v.videoLink, '_blank');
    }
  };

  const saveVideoLink = () => {
    if (!editingVideoVariant) return;
    updateVariant(editingVideoVariant.id, { videoLink: videoUrlInput });
    setEditingVideoVariant(null);
    setVideoUrlInput('');
  };




  return (
    <div className="p-8 max-w-[98%] mx-auto relative min-h-full">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <i className="fa-solid fa-list-check text-indigo-600 text-xl"></i>
          <h2 className="text-xl font-bold text-gray-800">Queue Management</h2>
        </div>

        {/* Squished Date Filter - Left Side, One Line */}
        <div className="flex items-center bg-gray-50 p-2 rounded-xl border border-gray-200 gap-3">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-calendar-day text-slate-400 text-xs"></i>
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-0.5">From Edit Date</span>
              <input
                type="date"
                value={tempStartDate}
                onChange={(e) => setTempStartDate(e.target.value)}
                className="bg-white border border-gray-300 rounded px-1 py-0.5 text-[10px] focus:ring-1 focus:ring-indigo-500 outline-none w-28 h-6"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-0.5">To Edit Date</span>
              <input
                type="date"
                value={tempEndDate}
                onChange={(e) => setTempEndDate(e.target.value)}
                className="bg-white border border-gray-300 rounded px-1 py-0.5 text-[10px] focus:ring-1 focus:ring-indigo-500 outline-none w-28 h-6"
              />
            </div>
          </div>
          <div className="flex items-center gap-1 ml-1 border-l border-gray-200 pl-2">
            <button onClick={handleApplyDateFilter} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-sm">OK</button>
            {(appliedStartDate || appliedEndDate) && (
              <button onClick={handleClearDateFilter} className="bg-white border border-gray-300 text-slate-400 px-2 py-1.5 rounded-lg text-[10px] font-black hover:text-red-500 hover:border-red-200 transition-all"><i className="fa-solid fa-xmark"></i></button>
            )}
          </div>
        </div>

        <button onClick={() => setIsEditMode(!isEditMode)} className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold transition-all border-2 ${isEditMode ? 'bg-amber-100 text-amber-700 border-amber-300 ring-2 ring-amber-200' : 'bg-white text-gray-700 border-gray-200 hover:border-amber-400 hover:bg-amber-50'}`}>

          <i className="fa-solid fa-pen-to-square"></i>
          <span>{isEditMode ? 'Finish Editing' : 'Edit Mode'}</span>
        </button>
      </div>

      {approvalQueue.length > 0 && (
        <div className="mb-12 bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-indigo-50 bg-indigo-50/30 flex justify-between items-center">
            <h3 className="text-xl font-bold text-indigo-900 flex items-center">
              <i className="fa-solid fa-bell-concierge mr-2"></i>
              Approval Queue
            </h3>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">{approvalQueue.length} Pending Approval</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase tracking-widest font-black border-b border-gray-100">
                  <th className="w-[200px] px-4 py-4">Review</th>
                  <th className="px-4 py-4">Concept</th>
                  <th className="w-[140px] px-4 py-4">Format</th>
                  <th className="w-[160px] px-4 py-4">Landing Page</th>
                  <th className="w-[80px] px-4 py-4 text-center">Script</th>
                  <th className="w-[140px] px-4 py-4">Name</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {approvalQueue.slice(0, 2).map((v) => {
                  const strategy = strategies.find(s => s.variants.some(var_ => var_.id === v.id));
                  return (
                    <tr key={v.id} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="px-4 py-5">
                        <div className="flex items-center space-x-2">
                          {v.rejectionHistory && v.rejectionHistory.filter(h => h.source === 'Editor' || h.destination === 'Strategist').length > 0 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setRejectionMessagesToShow(v.rejectionHistory?.filter(h => h.source === 'Editor' || h.destination === 'Strategist') || null); }}
                              className="w-10 h-10 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 border border-rose-200 shadow-sm transition-all flex items-center justify-center shrink-0"
                              title="View Rejection Reasoning"
                            >
                              <i className="fa-solid fa-comment-dots text-xs"></i>
                            </button>
                          )}
                          <button
                            onClick={() => handleAccept(v.id)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black py-2 h-10 rounded-lg transition-all shadow-sm uppercase tracking-widest"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(v.id)}
                            className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[10px] font-black py-2 h-10 rounded-lg transition-all uppercase tracking-widest"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-5 font-medium text-slate-600 truncate cursor-pointer hover:text-indigo-600" onClick={() => setSelectedConcept(v.concept)}>{v.concept}</td>
                      <td className="px-4 py-5"><span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase">{strategy?.format || '-'}</span></td>
                      <td className="px-4 py-5"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase">{v.landingPage}</span></td>
                      <td className="px-4 py-5 text-center">
                        {v.scriptLink ? (
                          <a href={v.scriptLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 shadow-sm"><i className="fa-solid fa-file-lines text-xs"></i></a>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-5 text-sm font-bold text-slate-800 truncate">{v.name}</td>
                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
          {approvalQueue.length > 2 && (
            <div className="px-6 py-3 bg-indigo-50/50 border-t border-indigo-100 flex justify-center items-center space-x-3">
              <i className="fa-solid fa-angles-down text-indigo-300 animate-bounce text-xs"></i>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-white px-3 py-1 rounded-full border border-indigo-100 shadow-sm">
                {approvalQueue.length - 2} more items pending in queue
              </span>
              <i className="fa-solid fa-angles-down text-indigo-300 animate-bounce text-xs"></i>
            </div>
          )}
        </div>
      )}

      <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-colors ${isEditMode ? 'border-amber-300 ring-2 ring-amber-50' : 'border-gray-100'}`}>

        <div className={`px-6 py-4 border-b flex justify-between items-center transition-colors ${isEditMode ? 'bg-amber-50 border-amber-100' : 'bg-gray-50/50 border-gray-100'}`}>
          <h3 className={`text-xl font-bold ${isEditMode ? 'text-amber-800' : 'text-gray-800'}`}>{isEditMode ? 'Select rows to edit' : 'Production Queue'}</h3>
          <div className="flex items-center space-x-4">
            {isEditMode && <span className="text-amber-600 animate-pulse text-sm font-bold uppercase tracking-widest">Editing Enabled</span>}
            <button onClick={() => setHideCompleted(!hideCompleted)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${hideCompleted ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'}`}>{hideCompleted ? 'Show Completed/Validated' : 'Disable Completed/Validated'}</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className={`w-full text-left border-collapse table-fixed transition-colors ${isEditMode ? 'bg-amber-50/10' : ''}`}>
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-[10px] uppercase tracking-widest font-black border-b border-gray-100">
                <th className="w-[160px] px-4 py-4">Status</th>
                <th className="w-[120px] px-4 py-4 relative">
                  <div className="flex items-center cursor-pointer select-none group/sort" onClick={() => setEditSortOrder(editSortOrder === 'asc' ? 'desc' : 'asc')}>
                    <span>Edit</span>
                    <i className={`fa-solid fa-sort-${editSortOrder === 'asc' ? 'up' : 'down'} ml-1.5 text-indigo-500 group-hover/sort:scale-125 transition-transform`}></i>
                  </div>
                </th>

                <th className="w-[100px] px-4 py-4">COMP</th>
                <th className="px-4 py-4 text-left">Concept</th>
                <th className="w-[160px] px-4 py-4">Landing Page</th>
                <th className="w-[80px] px-4 py-4 text-center">Script</th>
                <th className="w-[80px] px-4 py-4 text-center">Video</th>
                <th className="w-[140px] px-4 py-4">Name</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProductionQueue.length === 0 ? (
                <tr><td colSpan={8} className="p-12 text-center text-gray-400 italic">No production items currently to display.</td></tr>
              ) : (
                filteredProductionQueue.slice(0, prodVisibleCount).map((v) => (

                  <tr key={v.id} onClick={(e) => isEditMode && handleVideoClick(e, v)} className={`transition-colors cursor-pointer ${isEditMode ? 'hover:bg-amber-100/50' : 'hover:bg-slate-50'}`}>
                    <td className="px-4 py-5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center space-x-1.5">
                        {v.rejectionHistory && v.rejectionHistory.filter(h => h.source === 'VA' && h.destination === 'Editor').length > 0 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setRejectionMessagesToShow(v.rejectionHistory?.filter(h => h.source === 'VA' && h.destination === 'Editor') || null); }}
                            className="w-7 h-7 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 border border-rose-200 shadow-sm transition-all flex items-center justify-center shrink-0"
                            title="View Rejection Reasoning"
                          >
                            <i className="fa-solid fa-comment-dots text-xs"></i>
                          </button>
                        )}
                        {(() => {
                          const isRejectedByVAToStrategist = v.rejectionHistory?.some(h => h.source === 'VA' && h.destination === 'Strategist');
                          const isScripting = (v.status === 'In Progress' && isRejectedByVAToStrategist) || (v.status === 'Rejected' && v.rejectionHistory?.[v.rejectionHistory.length - 1]?.destination === 'Strategist');
                          if (['Ready to Launch', 'In Review', 'Live', 'Canceled'].includes(v.status)) {
                            return <span className="flex-1 px-2 py-1.5 rounded-full text-[10px] font-black border border-emerald-600 bg-white text-emerald-600 block text-center uppercase">Validated</span>;
                          }
                          if (isScripting) {
                            return <span className="flex-1 px-2 py-1.5 rounded-full text-[10px] font-black border border-slate-200 bg-slate-50 text-slate-400 block text-center uppercase tracking-tight shadow-sm">Scripting</span>;
                          }
                          return (
                            <select
                              value={v.status}
                              onChange={(e) => handleStatusChange(e, v.id)}
                              disabled={isEditMode}
                              className={`flex-1 px-2 py-1.5 rounded-full text-[10px] font-black border outline-none ${isEditMode ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-[1.02] active:scale-95'} transition-all shadow-sm appearance-none text-center uppercase tracking-tight ${STATUS_OPTIONS.find(opt => opt.label === v.status)?.color || 'bg-slate-800 text-white border-slate-700'}`}
                            >
                              {STATUS_OPTIONS.filter(opt => opt.label !== 'Rejected' || v.status === 'Rejected').filter(opt => opt.label !== 'Scripting').map(opt => <option key={opt.label} value={opt.label} className="bg-white text-slate-800">{opt.label}</option>)}
                            </select>
                          );
                        })()}
                      </div>

                    </td>
                    <td className="px-4 py-5 text-[11px] font-mono font-bold text-slate-600 italic bg-amber-50/20">{v.editDate || '-'}</td>

                    <td className="px-4 py-5 text-[11px] font-mono text-slate-500 italic">{v.compDate || '-'}</td>
                    <td className="px-4 py-5 text-sm text-slate-600 font-medium leading-relaxed truncate cursor-pointer hover:text-indigo-600 transition-colors" title={v.concept} onClick={(e) => { if (!isEditMode) { e.stopPropagation(); setSelectedConcept(v.concept); } }}>{v.concept}</td>
                    <td className="px-4 py-5"><span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[10px] font-black block truncate text-center shadow-md">{v.landingPage}</span></td>
                    <td className="px-4 py-5 text-center">{v.scriptLink ? (<a href={v.scriptLink} target="_blank" rel="noopener noreferrer" onClick={(e) => { if (isEditMode) e.preventDefault(); e.stopPropagation(); }} className={`inline-flex items-center justify-center w-8 h-8 ${isEditMode ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'} rounded-lg transition-all border border-indigo-100 shadow-sm`}><i className="fa-solid fa-file-lines text-xs"></i></a>) : '-'}</td>
                    <td className="px-4 py-5 text-center"><button onClick={(e) => handleVideoClick(e, v)} className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all border shadow-sm ${v.videoLink ? (isEditMode ? 'bg-amber-100 text-amber-600 border-amber-200 hover:bg-amber-600 hover:text-white' : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white') : (isEditMode ? 'bg-amber-50 text-amber-400 border-amber-200 hover:bg-amber-600 hover:text-white' : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-200')}`}><i className={`fa-solid ${v.videoLink ? 'fa-video' : 'fa-plus'} text-xs`}></i></button></td>

                    <td className="px-4 py-5 text-sm font-bold text-slate-800 truncate">{v.name}</td>
                  </tr>
                )))}
            </tbody>
          </table>
        </div>
        {filteredProductionQueue.length > prodVisibleCount && (
          <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex justify-center">
            <button
              onClick={() => setProdVisibleCount(prev => prev + 10)}
              className="px-8 py-3 bg-white border-2 border-indigo-100 text-indigo-600 font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm flex items-center space-x-2 group"
            >
              <span>Load More</span>
              <i className="fa-solid fa-chevron-down text-xs group-hover:animate-bounce"></i>
            </button>
          </div>
        )}
      </div>

      {selectedConcept && (
        <div onClick={() => setSelectedConcept(null)} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 cursor-default">
            <div className="p-10 max-h-[80vh] overflow-y-auto text-center">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-xl">{selectedConcept}</p>
            </div>
          </div>
        </div>
      )}

      {editingVideoVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Add Video Link</h2>
              <button onClick={() => setEditingVideoVariant(null)} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>
            <div className="p-6 bg-gray-50/50">
              <p className="text-sm text-gray-500 mb-4">Provide the final video URL for <span className="font-bold text-gray-800">"{editingVideoVariant.name}"</span></p>
              <input type="url" value={videoUrlInput} onChange={(e) => setVideoUrlInput(e.target.value)} placeholder="https://vimeo.com/..." className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner text-white placeholder-slate-500" />
            </div>
            <div className="p-4 bg-white border-t border-gray-100 flex space-x-3 justify-end">
              <button onClick={() => setEditingVideoVariant(null)} className="px-6 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={saveVideoLink} className="px-8 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700">Save Link</button>
            </div>
          </div>
        </div>
      )}

      {blockModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6"><i className="fa-solid fa-lock text-3xl"></i></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Change Restricted</h2>
              <p className="text-gray-500 font-bold leading-relaxed">{blockModal.message}</p>
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => setBlockModal({ show: false, message: '' })}
                className="w-full px-6 py-4 bg-gray-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Prompt Modal */}
      {rejectionModalVariantId && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 text-center border-b border-gray-100">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fa-solid fa-comment-dots text-3xl"></i>
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 mb-2">Rejection Feedback</h2>
              <p className="text-gray-500 font-bold leading-relaxed">Please explain why you are rejecting this script.</p>
            </div>
            <div className="p-6 bg-gray-50/50">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Type your feedback here..."
                className="w-full h-32 px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all shadow-sm text-gray-800 placeholder-gray-400 font-medium resize-none"
              />
            </div>
            <div className="p-6 bg-white border-t border-gray-100 flex space-x-3">
              <button
                onClick={() => setRejectionModalVariantId(null)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorModal.show && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
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

      {rejectionMessagesToShow && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-amber-50/30">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                  <i className="fa-solid fa-clipboard-list text-lg"></i>
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-gray-900 leading-none">Production Feedback</h2>
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1">VA & Editorial Notes</p>
                </div>
              </div>
              <button onClick={() => setRejectionMessagesToShow(null)} className="text-gray-400 hover:text-gray-600 transition-colors"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>

            <div className="p-8 max-h-[60vh] overflow-y-auto space-y-6 bg-gray-50/50">
              {rejectionMessagesToShow.map((item, idx) => (
                <div key={idx} className={`relative pl-6 border-l-2 ${item.source === 'VA' ? 'border-amber-200' : 'border-rose-200'}`}>
                  <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white ${item.source === 'VA' ? 'bg-amber-200' : 'bg-rose-200'}`}></div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${item.source === 'VA' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                      {item.source}
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed font-bold whitespace-pre-wrap">{item.message}</p>
                </div>
              ))}
            </div>
            <div className="p-6 bg-white border-t border-gray-100">
              <button
                onClick={() => setRejectionMessagesToShow(null)}
                className="w-full px-6 py-4 bg-gray-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg"
              >
                Close Production Notes
              </button>

            </div>
          </div>
        </div>
      )}
    </div >
  );
};

export default Editor;
