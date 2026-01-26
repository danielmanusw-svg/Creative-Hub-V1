
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { StrategyItem, Variant } from '../types';

interface CreativeStrategistProps {
  strategies: StrategyItem[];
  setStrategies: React.Dispatch<React.SetStateAction<StrategyItem[]>>;
  emulatedDate: string;
}

const PRODUCT_OPTIONS = [
  'OG plastic filter',
  'LED plastic filter',
  'OG stainless steel',
  'New stainless steel',
  'Pet filter',
];

const FORMAT_OPTIONS = [
  { label: 'UGC', color: 'bg-rose-100 text-rose-800 border-rose-200', activeRing: 'ring-rose-500' },
  { label: 'Studio', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', activeRing: 'ring-indigo-500' },
  { label: 'Static', color: 'bg-amber-100 text-amber-800 border-amber-200', activeRing: 'ring-amber-500' },
  { label: 'GIF', color: 'bg-teal-100 text-teal-800 border-teal-200', activeRing: 'ring-teal-500' },
];

const STATUS_OPTIONS = [
  { label: 'In Progress', color: 'bg-sky-100 text-slate-900 border-sky-200', activeRing: 'ring-sky-500' },
  { label: 'Ready to edit', color: 'bg-green-100 text-green-800 border-green-200', activeRing: 'ring-green-500' },
  { label: 'Rejected', color: 'bg-rose-100 text-rose-800 border-rose-200', activeRing: 'ring-rose-500' },
];


const LANDING_PAGE_OPTIONS = [
  { label: 'Product page', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', activeRing: 'ring-emerald-500' },
  { label: 'Homepage', color: 'bg-blue-100 text-blue-800 border-blue-200', activeRing: 'ring-blue-500' },
  { label: 'Advertorial', color: 'bg-purple-100 text-purple-800 border-purple-200', activeRing: 'ring-purple-500' },
  { label: 'Listicle', color: 'bg-amber-100 text-amber-800 border-amber-200', activeRing: 'ring-amber-500' },
];

const CreativeStrategist: React.FC<CreativeStrategistProps> = ({ strategies, setStrategies, emulatedDate }) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(['1', '2', '3', '4']));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [isRemovalMode, setIsRemovalMode] = useState(false);
  const [isAdminDeleteMode, setIsAdminDeleteMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [hideReadyToEdit, setHideReadyToEdit] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);

  const [rowToDelete, setRowToDelete] = useState<StrategyItem | null>(null);
  const [variantToDelete, setVariantToDelete] = useState<Variant | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [editingScriptVariant, setEditingScriptVariant] = useState<Variant | null>(null);
  const [scriptUrlInput, setScriptUrlInput] = useState('');
  const [activeHeaderIdForVariant, setActiveHeaderIdForVariant] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<{ show: boolean, message: string }>({ show: false, message: '' });
  const [rejectionMessagesToShow, setRejectionMessagesToShow] = useState<{ source: 'Editor' | 'VA'; message: string }[] | null>(null);



  const [newStrategy, setNewStrategy] = useState({ product: '', format: '', description: '' });
  const [newVariant, setNewVariant] = useState<Partial<Variant>>({
    name: '',
    status: 'In Progress',
    landingPage: '',
    target: '',
    concept: '',
    scriptLink: ''
  });

  // Filtering & Sorting
  const [checkedProducts, setCheckedProducts] = useState<Set<string>>(new Set(PRODUCT_OPTIONS));
  const [checkedFormats, setCheckedFormats] = useState<Set<string>>(new Set(FORMAT_OPTIONS.map(f => f.label)));
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false);
  const [isFormatMenuOpen, setIsFormatMenuOpen] = useState(false);
  const [variantSortOrder, setVariantSortOrder] = useState<'asc' | 'desc'>('desc');
  const productMenuRef = useRef<HTMLDivElement>(null);
  const formatMenuRef = useRef<HTMLDivElement>(null);


  // Date Filtering State
  const [tempStartDate, setTempStartDate] = useState<string>('');
  const [tempEndDate, setTempEndDate] = useState<string>('');
  const [appliedStartDate, setAppliedStartDate] = useState<string>('');
  const [appliedEndDate, setAppliedEndDate] = useState<string>('');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productMenuRef.current && !productMenuRef.current.contains(event.target as Node)) {
        setIsProductMenuOpen(false);
      }
      if (formatMenuRef.current && !formatMenuRef.current.contains(event.target as Node)) {
        setIsFormatMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const parseDate = (dateStr: string) => {
    if (!dateStr) return 0;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      // Input: DD/MM/YYYY, Date constructor: (Year, MonthIndex, Day)
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
    }
    return 0;
  };

  const sortedStrategies = useMemo(() => {
    return [...strategies]
      .filter(s => {
        if (checkedProducts.size > 0 && !checkedProducts.has(s.product)) return false;
        if (checkedFormats.size > 0 && !checkedFormats.has(s.format)) return false;


        if (appliedStartDate || appliedEndDate) {
          const startTimestamp = appliedStartDate ? new Date(appliedStartDate).getTime() : 0;
          const endTimestamp = appliedEndDate ? new Date(appliedEndDate).getTime() : Infinity;

          return s.variants.some(v => {
            const vTimestamp = parseDate(v.createdDate);
            return vTimestamp >= startTimestamp && vTimestamp <= endTimestamp;
          });
        }
        return true;
      })
      .sort((a, b) => b.id.localeCompare(a.id));
  }, [strategies, checkedProducts, checkedFormats, appliedStartDate, appliedEndDate]);


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

  const handleProductToggle = (product: string) => {
    const next = new Set(checkedProducts);
    if (next.has(product)) {
      next.delete(product);
    } else {
      next.add(product);
    }
    setCheckedProducts(next);
  };

  const handleFormatToggle = (format: string) => {
    const next = new Set(checkedFormats);
    if (next.has(format)) {
      next.delete(format);
    } else {
      next.add(format);
    }
    setCheckedFormats(next);
  };


  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>, strategyId: string, variantId: string) => {
    e.stopPropagation();
    const nextStatus = e.target.value;
    const now = emulatedDate;
    const strategy = strategies.find(s => s.id === strategyId);
    const variant = strategy?.variants.find(v => v.id === variantId);

    if (nextStatus === 'Ready to edit' && (!variant?.scriptLink || variant.scriptLink.trim() === '')) {
      setErrorModal({ show: true, message: 'A script link must be provided before changing the status to "Ready to edit".' });
      return;
    }

    setStrategies(prev => prev.map(s => s.id === strategyId ? {
      ...s,
      variants: s.variants.map(v => {
        if (v.id === variantId) {
          let updated = { ...v, status: nextStatus };
          if (nextStatus === 'In Progress') {
            updated.reviewDate = '';
            updated.editDate = '';
            updated.compDate = '';
            updated.launchDate = '';
          } else if (nextStatus === 'Ready to edit') {
            if (!v.reviewDate) updated.reviewDate = now;
            updated.editDate = '';
            updated.compDate = '';
            updated.launchDate = '';
          }
          return updated;
        }
        return v;
      })
    } : s));

  };

  const handleAddClick = () => {
    setIsRemovalMode(false);
    setIsEditMode(false);
    setEditingItemId(null);
    setEditingVariantId(null);
    setNewStrategy({ product: '', format: '', description: '' });
    setIsModalOpen(true);
  };

  const handleEditModeToggle = () => {
    setIsEditMode(!isEditMode);
    setIsRemovalMode(false);
  };

  const handleRemoveModeToggle = () => {
    setIsRemovalMode(!isRemovalMode);
    setIsAdminDeleteMode(false);
    setIsEditMode(false);
  };

  const handleAdminDeleteToggle = () => {
    setIsAdminDeleteMode(!isAdminDeleteMode);
    setIsRemovalMode(false);
    setIsEditMode(false);
  };

  const toggleRowExpansion = (id: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(id)) {
      newExpandedRows.delete(id);
    } else {
      newExpandedRows.add(id);
    }
    setExpandedRows(newExpandedRows);
  };

  const handleHeaderRowClick = (item: StrategyItem) => {
    if (isRemovalMode || isAdminDeleteMode) {
      if (isRemovalMode) {
        const hasRestrictedVariants = item.variants.some(v => {
          const hasRejectionMessages = v.rejectionHistory && v.rejectionHistory.filter(h => h.source === 'Editor' || h.destination === 'Strategist').length > 0;
          return v.status !== 'In Progress' || hasRejectionMessages;
        });

        if (hasRestrictedVariants) {
          setErrorModal({
            show: true,
            message: 'This parent row contains variants that are either not "In Progress" or have rejection feedback. Only rows with strictly new "In Progress" variants can be removed.'
          });
          return;
        }
      }
      setRowToDelete(item);
    } else if (isEditMode) {
      setEditingItemId(item.id);
      setEditingVariantId(null);
      setNewStrategy({
        product: item.product,
        format: item.format,
        description: item.description
      });
      setIsModalOpen(true);
    } else {
      toggleRowExpansion(item.id);
    }
  };

  const handleVariantRowClick = (e: React.MouseEvent, variant: Variant) => {
    e.stopPropagation();
    if (isRemovalMode || isAdminDeleteMode) {
      if (isRemovalMode) {
        const hasRejectionMessages = variant.rejectionHistory && variant.rejectionHistory.filter(h => h.source === 'Editor' || h.destination === 'Strategist').length > 0;
        if (variant.status !== 'In Progress' || hasRejectionMessages) {
          setErrorModal({
            show: true,
            message: 'Only variants in "In Progress" status without rejection feedback can be removed.'
          });
          return;
        }
      }
      setVariantToDelete(variant);
    } else if (isEditMode) {
      const isVal = ['In Review', 'Live', 'Canceled'].includes(variant.status);
      if (variant.status === 'Completed' || isVal) {
        setErrorModal({ show: true, message: 'Completed or Validated variants cannot be edited by the Creative Strategist.' });
        return;
      }
      setEditingVariantId(variant.id);
      setEditingItemId(null);
      setActiveHeaderIdForVariant(variant.headerId);
      setNewVariant({
        name: variant.name,
        status: variant.status,
        landingPage: variant.landingPage,
        target: variant.target,
        concept: variant.concept,
        scriptLink: variant.scriptLink
      });
      setIsVariantModalOpen(true);
    }
  };

  const handleScriptClick = (e: React.MouseEvent, v: Variant) => {
    e.stopPropagation();
    if (isEditMode || !v.scriptLink) {
      setEditingScriptVariant(v);
      setScriptUrlInput(v.scriptLink || '');
    } else {
      window.open(v.scriptLink, '_blank');
    }
  };

  const saveScriptLink = () => {
    if (!editingScriptVariant) return;
    setStrategies(prev => prev.map(s => ({
      ...s,
      variants: s.variants.map(v => v.id === editingScriptVariant.id ? { ...v, scriptLink: scriptUrlInput } : v)
    })));
    setEditingScriptVariant(null);
    setScriptUrlInput('');
  };

  const openVariantModal = (e: React.MouseEvent, headerId: string) => {
    e.stopPropagation();
    setActiveHeaderIdForVariant(headerId);
    setEditingVariantId(null);
    setNewVariant({
      name: '',
      status: 'In Progress',
      landingPage: '',
      target: '',
      concept: '',
      scriptLink: ''
    });
    setIsVariantModalOpen(true);
  };

  const handleSaveVariant = () => {
    const headerId = activeHeaderIdForVariant;
    if (!headerId) return;

    if (newVariant.status === 'Ready to edit' && (!newVariant.scriptLink || newVariant.scriptLink.trim() === '')) {
      setErrorModal({ show: true, message: 'A script link must be provided to set status to "Ready to edit".' });
      return;
    }

    const now = emulatedDate;

    if (editingVariantId) {
      setStrategies(strategies.map(s => s.id === headerId ? {
        ...s,
        variants: s.variants.map(v => {
          if (v.id === editingVariantId) {
            const updated = {
              ...v,
              name: newVariant.name!,
              status: newVariant.status!,
              landingPage: newVariant.landingPage!,
              target: newVariant.target!,
              concept: newVariant.concept!,
              scriptLink: newVariant.scriptLink,
            };
            if (newVariant.status === 'In Progress') {
              updated.reviewDate = '';
            } else if (newVariant.status === 'Ready to edit') {
              if (!v.reviewDate) updated.reviewDate = now;
              // Clear editDate to force "Pending" status in production
              updated.editDate = '';
            }

            return updated;
          }
          return v;
        })
      } : s));
    } else {
      const variant: Variant = {
        id: Date.now().toString(),
        headerId: headerId,
        name: newVariant.name!,
        status: newVariant.status!,
        createdDate: emulatedDate,
        launchDate: '',
        reviewDate: newVariant.status === 'Ready to edit' ? now : '',
        landingPage: newVariant.landingPage!,
        target: newVariant.target!,
        concept: newVariant.concept!,
        scriptLink: newVariant.scriptLink,
      };

      setStrategies(strategies.map(s => s.id === headerId ? {
        ...s,
        variants: [...s.variants, variant]
      } : s));

      const newExpanded = new Set(expandedRows);
      newExpanded.add(headerId);
      setExpandedRows(newExpanded);
    }

    setIsVariantModalOpen(false);
    setEditingVariantId(null);
    setActiveHeaderIdForVariant(null);
    setIsEditMode(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItemId(null);
    setNewStrategy({ product: '', format: '', description: '' });
  };

  const handleSaveStrategy = () => {
    if (!isFormValid) return;

    if (editingItemId) {
      setStrategies(strategies.map(s => s.id === editingItemId ? {
        ...s,
        product: newStrategy.product,
        format: newStrategy.format,
        description: newStrategy.description
      } : s));
      setIsEditMode(false);
    } else {
      const newItem: StrategyItem = {
        id: Date.now().toString(),
        product: newStrategy.product,
        format: newStrategy.format,
        description: newStrategy.description,
        variants: []
      };
      setStrategies([...strategies, newItem]);
    }
    handleCloseModal();
  };

  const executeDelete = () => {
    if (rowToDelete) {
      setStrategies(prev => prev.filter(s => s.id !== rowToDelete.id));
      const nextExpanded = new Set(expandedRows);
      nextExpanded.delete(rowToDelete.id);
      setExpandedRows(nextExpanded);
    } else if (variantToDelete) {
      setStrategies(prev => prev.map(s =>
        s.id === variantToDelete.headerId
          ? {
            ...s,
            variants: s.variants.filter(v => v.id !== variantToDelete.id)
          }
          : s
      ));
    }
    setRowToDelete(null);
    setVariantToDelete(null);
    setIsRemovalMode(false);
    setIsAdminDeleteMode(false);
  };

  const getProductBadgeColor = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes('og plastic')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (lower.includes('led plastic')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (lower.includes('og stainless')) return 'bg-zinc-200 text-zinc-800 border-zinc-300';
    if (lower.includes('new stainless')) return 'bg-slate-300 text-slate-900 border-slate-400';
    if (lower.includes('pet filter')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    return 'bg-gray-100 text-gray-800';
  };

  const getFormatColor = (label: string) => FORMAT_OPTIONS.find(opt => opt.label === label)?.color || 'bg-gray-100 text-gray-800';
  const getStatusColor = (label: string) => {
    if (label === 'Completed') return 'bg-green-600 text-white border-green-700 shadow-sm';
    if (['In Review', 'Live', 'Canceled'].includes(label)) return 'bg-white text-emerald-600 border-emerald-600 font-bold';
    return STATUS_OPTIONS.find(opt => opt.label === label)?.color || 'bg-gray-100 text-gray-800';
  };
  const getLandingColor = (label: string) => LANDING_PAGE_OPTIONS.find(opt => opt.label === label)?.color || 'bg-gray-100 text-gray-800';

  const isFormValid = newStrategy.product && newStrategy.format && newStrategy.description.trim().length > 0;
  const isVariantFormValid = newVariant.name && newVariant.landingPage && newVariant.concept;

  const inputClass = "w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-white placeholder-slate-500 shadow-inner";
  const textareaClass = "w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none shadow-inner text-white placeholder-slate-500";

  return (
    <div className="p-8 max-w-[98%] mx-auto relative min-h-full">
      {/* Unified Action Header Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8 flex flex-wrap items-center justify-between gap-4">
        {/* Compact Action Buttons - "Squished" */}
        <div className="flex items-center gap-2">
          <button onClick={handleAddClick} className="flex items-center space-x-2 px-4 py-3 bg-indigo-50 text-indigo-700 font-black rounded-xl hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 shadow-sm whitespace-nowrap">
            <i className="fa-solid fa-plus text-xs"></i>
            <span className="text-xs uppercase tracking-widest">Add New</span>
          </button>
          <button onClick={handleEditModeToggle} className={`flex items-center space-x-2 px-4 py-3 font-black rounded-xl transition-all border shadow-sm whitespace-nowrap ${isEditMode ? 'bg-amber-600 text-white border-amber-700 shadow-amber-200 ring-2 ring-amber-200' : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100'}`}>
            <i className="fa-solid fa-pen-to-square text-xs"></i>
            <span className="text-xs uppercase tracking-widest">{isEditMode ? 'Cancel' : 'Edit'}</span>
          </button>
          <button onClick={handleRemoveModeToggle} className={`flex items-center space-x-2 px-4 py-3 font-black rounded-xl transition-all border shadow-sm whitespace-nowrap ${isRemovalMode ? 'bg-red-600 text-white border-red-700 shadow-red-200 animate-pulse' : 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100'}`}>
            <i className="fa-solid fa-trash-can text-xs"></i>
            <span className="text-xs uppercase tracking-widest">{isRemovalMode ? 'Cancel' : 'Remove'}</span>
          </button>
          <button onClick={handleAdminDeleteToggle} className={`flex items-center space-x-2 px-4 py-3 font-black rounded-xl transition-all border shadow-sm whitespace-nowrap ${isAdminDeleteMode ? 'bg-slate-900 text-white border-slate-900 shadow-slate-200 animate-bounce' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-200 hover:text-slate-800'}`}>
            <i className="fa-solid fa-user-shield text-xs"></i>
            <span className="text-xs uppercase tracking-widest">{isAdminDeleteMode ? 'Cancel Admin' : 'Admin Delete'}</span>
          </button>
        </div>

        {/* Squished Date Filter - Left Side, One Line */}
        <div className="flex items-center bg-gray-50 p-2 rounded-xl border border-gray-200 gap-3">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-calendar-day text-slate-400 text-xs"></i>
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-0.5">From</span>
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
              <span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-0.5">To</span>
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
      </div>

      {/* Table Container */}
      <div className={`bg-white rounded-2xl shadow-sm border transition-colors relative z-20 ${isRemovalMode ? 'border-red-300 ring-2 ring-red-50' : isEditMode ? 'border-amber-300 ring-2 ring-amber-50' : 'border-gray-100'}`}>
        <div className={`px-6 py-4 border-b flex justify-between items-center transition-colors ${isRemovalMode ? 'bg-red-50 border-red-100' : isEditMode ? 'bg-amber-50 border-amber-100' : 'bg-gray-50/50 border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <h3 className={`text-xl font-black uppercase tracking-tight ${isRemovalMode || isAdminDeleteMode ? 'text-red-800' : isEditMode ? 'text-amber-800' : 'text-slate-800'}`}>
              {isAdminDeleteMode ? 'Admin Delete' : isRemovalMode ? 'Removal' : isEditMode ? 'Editor' : 'Creative Queue'}
            </h3>


            {(appliedStartDate || appliedEndDate) && <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 uppercase tracking-widest">Filtered by date</span>}
          </div>
          <div className="flex items-center space-x-3">
            {isRemovalMode && <span className="text-red-600 animate-pulse text-[10px] font-black uppercase tracking-widest">Active Removal Mode</span>}
            {isEditMode && <span className="text-amber-600 animate-pulse text-[10px] font-black uppercase tracking-widest">Active Edit Mode</span>}
            {!isRemovalMode && !isEditMode && (
              <>
                <button onClick={() => setHideReadyToEdit(!hideReadyToEdit)} className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all border uppercase tracking-widest ${hideReadyToEdit ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'}`}>{hideReadyToEdit ? 'Show Ready' : 'Hide Ready'}</button>
                <button onClick={() => setHideCompleted(!hideCompleted)} className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all border uppercase tracking-widest ${hideCompleted ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'}`}>{hideCompleted ? 'Show Done' : 'Hide Done'}</button>
              </>
            )}
          </div>
        </div>
        <div className="overflow-visible">
          <table className={`w-full text-left border-collapse table-fixed transition-colors ${isEditMode ? 'bg-amber-50/10' : ''}`}>
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase font-black tracking-widest border-b border-gray-100">
                <th className="w-12 px-4 py-4"></th>
                <th className="w-[180px] px-4 py-4 relative z-50">
                  <div className="flex items-center">
                    <span>Product</span>
                    <div className="relative ml-2" ref={productMenuRef}>
                      <button onClick={() => setIsProductMenuOpen(!isProductMenuOpen)} className="flex items-center justify-center w-7 h-7 bg-white border border-gray-300 rounded shadow-sm hover:border-indigo-400 transition-colors">
                        <i className={`fa-solid fa-chevron-down text-indigo-500 text-[10px] transition-transform ${isProductMenuOpen ? 'rotate-180' : ''}`}></i>
                      </button>
                      {isProductMenuOpen && (
                        <div className="absolute top-full left-0 mt-1 w-60 bg-white border border-gray-200 shadow-2xl rounded-xl z-[999] py-3 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="px-4 pb-2 border-b border-gray-100 mb-2 flex justify-between items-center">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Filter Options</span>
                          </div>
                          {PRODUCT_OPTIONS.map(p => (
                            <label key={p} className="flex items-center px-4 py-2.5 hover:bg-slate-50 cursor-pointer group">
                              <div className="relative flex items-center justify-center w-5 h-5 mr-3">
                                <input type="checkbox" checked={checkedProducts.has(p)} onChange={() => handleProductToggle(p)} className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded bg-white checked:bg-indigo-600 checked:border-indigo-600 transition-all cursor-pointer" />
                                <i className="fa-solid fa-check text-[10px] text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"></i>
                              </div>
                              <span className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{p}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </th>
                <th className="w-[150px] px-4 py-4 relative z-40">
                  <div className="flex items-center">
                    <span>Format</span>
                    <div className="relative ml-2" ref={formatMenuRef}>
                      <button onClick={() => setIsFormatMenuOpen(!isFormatMenuOpen)} className="flex items-center justify-center w-7 h-7 bg-white border border-gray-300 rounded shadow-sm hover:border-indigo-400 transition-colors">
                        <i className={`fa-solid fa-chevron-down text-indigo-500 text-[10px] transition-transform ${isFormatMenuOpen ? 'rotate-180' : ''}`}></i>
                      </button>
                      {isFormatMenuOpen && (
                        <div className="absolute top-full left-0 mt-1 w-60 bg-white border border-gray-200 shadow-2xl rounded-xl z-[999] py-3 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="px-4 pb-2 border-b border-gray-100 mb-2 flex justify-between items-center">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Format Options</span>
                          </div>
                          {FORMAT_OPTIONS.map(f => (
                            <label key={f.label} className="flex items-center px-4 py-2.5 hover:bg-slate-50 cursor-pointer group">
                              <div className="relative flex items-center justify-center w-5 h-5 mr-3">
                                <input type="checkbox" checked={checkedFormats.has(f.label)} onChange={() => handleFormatToggle(f.label)} className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded bg-white checked:bg-indigo-600 checked:border-indigo-600 transition-all cursor-pointer" />
                                <i className="fa-solid fa-check text-[10px] text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"></i>
                              </div>
                              <span className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{f.label}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </th>

                <th className="px-4 py-4">Description</th>
                <th className="w-[100px] px-4 py-4 text-center">Variants</th>
                <th className="w-[100px] px-4 py-4 text-center">Add</th>
              </tr>
            </thead>
            <tbody>
              {sortedStrategies.map((item) => (
                <React.Fragment key={item.id}>
                  <tr onClick={() => handleHeaderRowClick(item)} className={`transition-all duration-200 border-b border-gray-50 group relative ${isRemovalMode || isAdminDeleteMode || isEditMode ? `cursor-pointer ${isRemovalMode || isAdminDeleteMode ? 'hover:bg-red-100 bg-red-50/10' : 'hover:bg-amber-100 bg-amber-50/10'}` : `hover:bg-slate-50 cursor-pointer ${expandedRows.has(item.id) ? 'bg-indigo-50/30' : ''}`}`}>
                    <td className="px-4 py-5 text-center"><i className={`fa-solid fa-chevron-right text-xs text-gray-300 transition-transform ${expandedRows.has(item.id) ? 'rotate-90 text-indigo-400' : ''}`}></i></td>
                    <td className="px-4 py-5 overflow-hidden"><span className={`px-3 py-1 rounded-full text-xs font-bold border ${getProductBadgeColor(item.product)} block truncate text-center shadow-sm`}>{item.product}</span></td>
                    <td className="px-4 py-5 overflow-hidden"><span className={`px-3 py-1 rounded-full text-xs font-bold border ${getFormatColor(item.format)} block truncate text-center shadow-sm`}>{item.format}</span></td>
                    <td className="px-4 py-5 text-base text-gray-700 truncate font-medium">{item.description}</td>
                    <td className="px-4 py-5 text-center"><span className="inline-flex items-center justify-center bg-gray-100 text-gray-700 font-bold text-xs rounded-full w-6 h-6">{item.variants.length}</span></td>
                    <td className="px-4 py-5 text-center">
                      <button onClick={(e) => openVariantModal(e, item.id)} className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><i className="fa-solid fa-plus text-xs"></i></button>
                    </td>
                  </tr>
                  {expandedRows.has(item.id) && (
                    <tr className="bg-sky-50 border-b border-sky-100">
                      <td className="px-4 py-1"></td>
                      <td colSpan={5} className="p-0">
                        <table className="w-full table-fixed bg-sky-50">
                          <thead>
                            <tr className="text-[10px] text-gray-600 uppercase font-black tracking-widest bg-sky-100">
                              <th className="w-[130px] px-3 py-3 text-left">Status</th>
                              <th className="w-[110px] px-3 py-3 text-left">
                                <div className="flex items-center cursor-pointer select-none group/sort" onClick={() => setVariantSortOrder(variantSortOrder === 'asc' ? 'desc' : 'asc')}>
                                  <span>Created</span>

                                  <i className={`fa-solid fa-sort-${variantSortOrder === 'asc' ? 'up' : 'down'} ml-1.5 text-indigo-500 group-hover/sort:scale-125 transition-transform`}></i>
                                </div>
                              </th>
                              <th className="w-[100px] px-3 py-3 text-left">Edit</th>
                              <th className="px-3 py-3 text-left border-r border-sky-100/30">Concept</th>
                              <th className="w-[140px] px-3 py-3 text-left border-r border-sky-100/30">Landing Page</th>
                              <th className="w-[60px] px-3 py-3 text-center border-r border-sky-100/30">Script</th>


                              <th className="w-[120px] px-3 py-3 text-left">Name</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const filteredVariants = item.variants
                                .filter(v => {
                                  const mappedStatus = (v.status === 'Rejected' && v.rejectionHistory?.[v.rejectionHistory.length - 1]?.destination === 'Editor') ? 'Ready to edit' : v.status;
                                  const isVal = ['Ready to Launch', 'In Review', 'Live', 'Canceled'].includes(v.status);
                                  if (hideCompleted && (v.status === 'Completed' || isVal)) return false;
                                  if (hideReadyToEdit && mappedStatus === 'Ready to edit') return false;
                                  if (appliedStartDate || appliedEndDate) {
                                    const vTime = parseDate(v.createdDate);
                                    const startTime = appliedStartDate ? new Date(appliedStartDate).getTime() : 0;
                                    const endTime = appliedEndDate ? new Date(appliedEndDate).getTime() : Infinity;
                                    if (vTime < startTime || vTime > endTime) return false;
                                  }
                                  return true;
                                })
                                .sort((a, b) => {
                                  const timeA = parseDate(a.createdDate);
                                  const timeB = parseDate(b.createdDate);
                                  if (timeA !== timeB) return variantSortOrder === 'desc' ? timeB - timeA : timeA - timeB;
                                  return variantSortOrder === 'desc' ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id);
                                });

                              if (filteredVariants.length === 0) {
                                return <tr><td colSpan={7} className="px-4 py-6 text-[10px] font-bold text-center text-gray-400 uppercase tracking-widest italic">Filtered out</td></tr>;
                              }

                              return filteredVariants.map(v => {
                                const mappedStatus = (v.status === 'Rejected' && v.rejectionHistory?.[v.rejectionHistory.length - 1]?.destination === 'Editor') ? 'Ready to edit' : v.status;
                                return (
                                  <tr key={v.id} onClick={(e) => handleVariantRowClick(e, v)} className={`border-b border-sky-100/30 transition-colors group/v ${isRemovalMode || isAdminDeleteMode || isEditMode ? `cursor-pointer ${isRemovalMode || isAdminDeleteMode ? 'hover:bg-red-200 bg-red-100/40' : 'hover:bg-amber-200 bg-amber-100/40'}` : 'hover:bg-sky-200/50'}`}>
                                    <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex items-center space-x-1.5">
                                        {v.rejectionHistory && v.rejectionHistory.filter(h => h.source === 'Editor' || h.destination === 'Strategist').length > 0 && (
                                          <button
                                            onClick={(e) => { e.stopPropagation(); setRejectionMessagesToShow(v.rejectionHistory?.filter(h => h.source === 'Editor' || h.destination === 'Strategist') || null); }}
                                            className="w-7 h-7 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 border border-rose-200 shadow-sm transition-all flex items-center justify-center shrink-0"
                                            title="View Rejection Reasoning"
                                          >
                                            <i className="fa-solid fa-comment-dots text-xs"></i>
                                          </button>
                                        )}

                                        {v.status === 'Completed' ? (
                                          <span className="flex-1 px-2 py-1.5 rounded-full text-[10px] font-black border block text-center bg-green-600 text-white border-green-700 shadow-sm uppercase">Completed</span>
                                        ) : ['Ready to Launch', 'In Review', 'Live', 'Canceled'].includes(v.status) ? (
                                          <span className="flex-1 px-2 py-1.5 rounded-full text-[10px] font-black border border-emerald-600 bg-white text-emerald-600 block text-center uppercase tracking-tighter">Validated</span>
                                        ) : (v.status === 'Ready to edit' && !v.editDate) ? (
                                          <span className="flex-1 px-2 py-1.5 rounded-full text-[10px] font-black border border-amber-600 bg-white text-amber-600 block text-center uppercase tracking-tighter italic">Pending</span>
                                        ) : (
                                          <select
                                            value={mappedStatus}
                                            onChange={(e) => handleStatusChange(e, item.id, v.id)}
                                            disabled={isRemovalMode || isAdminDeleteMode || isEditMode}
                                            className={`flex-1 px-2 py-1.5 rounded-full text-[10px] font-black border outline-none ${isRemovalMode || isAdminDeleteMode || isEditMode ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-[1.02] active:scale-95'} transition-all ${getStatusColor(mappedStatus)} appearance-none text-center shadow-sm uppercase tracking-tight`}
                                          >
                                            {STATUS_OPTIONS.filter(opt => opt.label !== 'Rejected' || v.status === 'Rejected').map(opt => <option key={opt.label} value={opt.label} className="bg-white text-slate-800">{opt.label}</option>)}
                                          </select>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-3 py-4 text-[11px] text-slate-500 font-mono italic border-r border-sky-100/30">{v.createdDate || '-'}</td>
                                    <td className="px-3 py-4 text-[11px] text-slate-600 font-mono font-bold border-r border-sky-100/30 bg-amber-50/20">{v.editDate || '-'}</td>

                                    <td className="px-3 py-4 text-sm text-slate-600 font-medium leading-relaxed truncate cursor-pointer hover:text-indigo-600 transition-colors border-r border-sky-100/30" onClick={(e) => { if (isEditMode || isRemovalMode) { handleVariantRowClick(e, v); } else { e.stopPropagation(); setSelectedConcept(v.concept); } }}>{v.concept}</td>
                                    <td className="px-3 py-4 border-r border-sky-100/30"><span className={`px-2 py-1 rounded-full text-[10px] font-black border ${getLandingColor(v.landingPage)} block truncate text-center shadow-sm uppercase tracking-tighter`}>{v.landingPage}</span></td>
                                    <td className="px-3 py-4 text-center border-r border-sky-100/30">
                                      {v.scriptLink ? (
                                        <a href={v.scriptLink} target="_blank" rel="noopener noreferrer" onClick={(e) => { if (isRemovalMode || isEditMode) e.preventDefault(); e.stopPropagation(); }} className={`inline-flex items-center justify-center w-8 h-8 ${isRemovalMode || isEditMode ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'} rounded-lg transition-all border border-indigo-100 shadow-sm`}><i className="fa-solid fa-file-lines text-xs"></i></a>
                                      ) : (
                                        <button disabled={isRemovalMode || isEditMode} onClick={(e) => handleScriptClick(e, v)} className={`inline-flex items-center justify-center w-8 h-8 ${isRemovalMode || isEditMode ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-gray-50 text-gray-400 hover:bg-indigo-600 hover:text-white'} border border-gray-100 rounded-lg transition-all shadow-sm`}><i className="fa-solid fa-plus text-xs"></i></button>
                                      )}
                                    </td>
                                    <td className="px-3 py-4 text-sm font-bold text-slate-800 truncate">{v.name}</td>
                                  </tr>
                                );
                              });

                            })()}
                          </tbody>
                        </table >
                      </td >
                    </tr >
                  )}
                </React.Fragment >
              ))}
              {
                sortedStrategies.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-20 text-center text-gray-400 italic font-black uppercase tracking-widest text-xs">No strategies match current filters.</td></tr>
                )
              }
            </tbody >
          </table >
        </div >
      </div >

      {/* Validation Error Modal */}
      {
        errorModal.show && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6"><i className="fa-solid fa-triangle-exclamation text-3xl"></i></div>
                <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Wait!</h2>
                <p className="text-gray-500 text-lg leading-relaxed font-bold">{errorModal.message}</p>
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <button onClick={() => setErrorModal({ show: false, message: '' })} className="w-full px-6 py-4 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all text-lg">Got it</button>
              </div>
            </div>
          </div>
        )
      }

      {/* Concept View Modal */}
      {
        selectedConcept && (
          <div onClick={() => setSelectedConcept(null)} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm cursor-pointer">
            <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 cursor-default">
              <div className="p-10 max-h-[80vh] overflow-y-auto text-center">
                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap text-xl font-bold italic">"{selectedConcept}"</p>
              </div>
            </div>
          </div>
        )
      }

      {/* Modals for Script Editing, Deletion, Strategy Addition, and Variant Addition follow standard patterns */}
      {
        editingScriptVariant && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">Add Script Link</h2>
                <button onClick={() => setEditingScriptVariant(null)} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-xmark text-xl"></i></button>
              </div>
              <div className="p-6 bg-gray-50/50">
                <p className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-widest">Provide the script URL for <span className="font-black text-indigo-600">"{editingScriptVariant.name}"</span></p>
                <input type="url" value={scriptUrlInput} onChange={(e) => setScriptUrlInput(e.target.value)} placeholder="https://docs.google.com/..." className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm text-slate-800 font-bold" />
              </div>
              <div className="p-4 bg-white border-t border-gray-100 flex space-x-3 justify-end">
                <button onClick={() => setEditingScriptVariant(null)} className="px-6 py-2 text-gray-400 font-black uppercase tracking-widest hover:bg-gray-100 rounded-lg text-[10px]">Cancel</button>
                <button onClick={saveScriptLink} className="px-8 py-2 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-lg shadow-lg hover:bg-indigo-700 text-[10px]">Save</button>
              </div>
            </div>
          </div>
        )
      }

      {
        (rowToDelete || variantToDelete) && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 text-center">
              <div className="p-8">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6"><i className="fa-solid fa-trash-can text-3xl"></i></div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 mb-2">Delete Row?</h2>
                <p className="text-gray-500 text-lg font-bold">Are you sure you want to delete <span className="text-red-600">"{rowToDelete ? rowToDelete.product : variantToDelete?.name}"</span>?</p>
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex space-x-3">
                <button onClick={() => { setRowToDelete(null); setVariantToDelete(null); setIsRemovalMode(false); }} className="flex-1 px-6 py-4 rounded-xl text-gray-700 font-black uppercase tracking-widest hover:bg-gray-200 transition-colors text-xs">Cancel</button>
                <button onClick={executeDelete} className="flex-1 px-6 py-4 bg-red-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-200 transition-all text-xs">Delete</button>
              </div>
            </div>
          </div>
        )
      }

      {
        isVariantModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col h-auto">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">{editingVariantId ? 'Edit Variant' : 'New Variant'}</h2>
                <button onClick={() => { setIsVariantModalOpen(false); setEditingVariantId(null); }} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-xmark text-xl"></i></button>
              </div>
              <div className="p-5 space-y-4 bg-gray-50/50">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Variant Name *</label>
                    <input type="text" value={newVariant.name || ''} onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })} placeholder="Variant Identifier" className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Initial Status *</label>
                    <div className="grid grid-cols-2 gap-1">
                      {STATUS_OPTIONS.filter(opt => opt.label !== 'Rejected').map(opt => {
                        const isSelected = newVariant.status === opt.label;
                        return <button key={opt.label} onClick={() => setNewVariant({ ...newVariant, status: opt.label })} className={`px-2 py-2 rounded-lg border-2 text-[10px] font-black uppercase tracking-widest transition-all text-center flex items-center justify-center h-[42px] ${isSelected ? `${opt.color} border-current ring-2 ring-opacity-20 ${opt.activeRing}` : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'}`}>{opt.label}</button>;
                      })}

                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 items-end">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Landing Page *</label>
                    <div className="grid grid-cols-2 gap-1">
                      {LANDING_PAGE_OPTIONS.map(opt => {
                        const isSelected = newVariant.landingPage === opt.label;
                        return <button key={opt.label} onClick={() => setNewVariant({ ...newVariant, landingPage: opt.label })} className={`px-2 py-1 rounded-lg border text-[9px] font-black uppercase tracking-tighter transition-all text-center flex items-center justify-center h-[36px] ${isSelected ? `${opt.color} border-current ring-2 ring-opacity-20 ${opt.activeRing}` : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'}`}>{opt.label}</button>;
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Script URL (Optional)</label>
                    <input type="url" value={newVariant.scriptLink || ''} onChange={(e) => setNewVariant({ ...newVariant, scriptLink: e.target.value })} placeholder="Google Doc Link" className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-bold" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Concept Brief *</label>
                  <textarea rows={3} value={newVariant.concept || ''} onChange={(e) => setNewVariant({ ...newVariant, concept: e.target.value })} placeholder="Detailed narrative and visual description..." className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none text-slate-800 font-medium" />
                </div>
              </div>
              <div className="p-5 bg-white border-t border-gray-100 flex space-x-3 justify-end shrink-0">
                <button onClick={() => { setIsVariantModalOpen(false); setEditingVariantId(null); }} className="px-4 py-2 rounded-lg text-gray-400 font-black uppercase tracking-widest hover:bg-gray-100 transition-colors text-[10px]">Cancel</button>
                <button onClick={handleSaveVariant} disabled={!isVariantFormValid} className={`px-8 py-2 rounded-lg font-black uppercase tracking-widest shadow-lg transition-all text-[10px] ${isVariantFormValid ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200' : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'}`}>{editingVariantId ? 'Save' : 'Create'}</button>
              </div>
            </div>
          </div>
        )
      }

      {
        isModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">{editingItemId ? 'Edit Header' : 'New Ad Header'}</h2>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-xmark text-2xl"></i></button>
              </div>
              <div className="p-6 space-y-6 overflow-y-auto bg-gray-50/50">
                <div>
                  <label className="block text-xs font-black text-gray-400 mb-3 uppercase tracking-widest">Select Product Category</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {PRODUCT_OPTIONS.map(p => {
                      const isSelected = newStrategy.product === p;
                      return <button key={p} onClick={() => setNewStrategy({ ...newStrategy, product: p })} className={`px-4 py-4 rounded-xl border-2 text-xs font-black uppercase tracking-widest transition-all text-center flex items-center justify-center h-full min-h-[60px] ${isSelected ? `bg-indigo-50 border-indigo-600 text-indigo-800 ring-4 ring-indigo-200 shadow-inner` : 'border-white bg-white text-gray-400 hover:border-indigo-200 shadow-sm'}`}>{p}</button>;
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 mb-3 uppercase tracking-widest">Select Visual Format</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {FORMAT_OPTIONS.map(opt => {
                      const isSelected = newStrategy.format === opt.label;
                      return <button key={opt.label} onClick={() => setNewStrategy({ ...newStrategy, format: opt.label })} className={`px-4 py-4 rounded-xl border-2 text-xs font-black uppercase tracking-widest transition-all text-center flex items-center justify-center h-full min-h-[50px] ${isSelected ? `${opt.color} border-current ring-4 ring-opacity-20 ${opt.activeRing} shadow-inner` : 'border-white bg-white text-gray-400 hover:border-indigo-200 shadow-sm'}`}>{opt.label}</button>;
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">Campaign Overview <span className="text-red-500">*</span></label>
                  <textarea rows={4} value={newStrategy.description} onChange={(e) => setNewStrategy({ ...newStrategy, description: e.target.value })} placeholder="Describe the overall objective..." className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none text-slate-800 font-medium shadow-sm" />
                </div>
              </div>
              <div className="p-6 bg-white border-t border-gray-100 flex space-x-3 justify-end shrink-0">
                <button onClick={handleCloseModal} className="px-6 py-3 rounded-lg text-gray-400 font-black uppercase tracking-widest hover:bg-gray-100 transition-colors text-xs">Cancel</button>
                <button onClick={handleSaveStrategy} disabled={!isFormValid} className={`px-10 py-3 rounded-lg font-black uppercase tracking-widest shadow-lg transition-all text-xs ${isFormValid ? `${editingItemId ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'} text-white` : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'}`}>{editingItemId ? 'Update' : 'Create Header'}</button>
              </div>
            </div>
          </div>
        )
      }
      {
        rejectionMessagesToShow && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-rose-50/30">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-comments text-lg"></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-gray-900 leading-none">Editor Feedback</h2>
                    <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mt-1">Rejection History</p>
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
                  Close Feedback
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};


export default CreativeStrategist;
