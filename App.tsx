
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import CreativeStrategist from './components/CreativeStrategist';
import Editor from './components/Editor';
import Validation from './components/Validation';
import Review from './components/Review';
import { AppView, StrategyItem } from './types';

const INITIAL_STRATEGIES: StrategyItem[] = [];

const App: React.FC = () => {
  const formatDate = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const [activeView, setActiveView] = useState<AppView>(AppView.CREATIVES);
  const [strategies, setStrategies] = useState<StrategyItem[]>(INITIAL_STRATEGIES);
  const [emulatedDate, setEmulatedDate] = useState<string>(formatDate(new Date()));

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // YYYY-MM-DD
    if (!val) {
      setEmulatedDate(formatDate(new Date()));
      return;
    }
    const [y, m, d] = val.split('-');
    setEmulatedDate(`${d}/${m}/${y}`);
  };

  const renderView = () => {
    switch (activeView) {
      case AppView.CREATIVES:
        return <CreativeStrategist strategies={strategies} setStrategies={setStrategies} emulatedDate={emulatedDate} />;
      case AppView.EDITOR:
        return <Editor strategies={strategies} setStrategies={setStrategies} emulatedDate={emulatedDate} />;
      case AppView.VA:
        return <Validation strategies={strategies} setStrategies={setStrategies} emulatedDate={emulatedDate} />;
      case AppView.REVIEW:
        return <Review strategies={strategies} setStrategies={setStrategies} emulatedDate={emulatedDate} />;
      default:
        return <CreativeStrategist strategies={strategies} setStrategies={setStrategies} emulatedDate={emulatedDate} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-slate-900">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0 z-10">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider font-bold">Visionary Dashboard</span>
            <span className="text-gray-400">/</span>
            <span className="text-sm font-black text-indigo-600 uppercase tracking-widest">{activeView}</span>
          </div>

          <div className="flex items-center space-x-4 bg-amber-50 border border-amber-200 px-4 py-1.5 rounded-xl shadow-sm">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest leading-none mb-1">Testing: Emulated Date</span>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  onChange={handleDateChange}
                  className="text-[10px] bg-white border border-amber-300 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-amber-500 font-bold"
                />
                <span className="text-[10px] font-mono font-bold text-amber-700 bg-white px-2 py-0.5 rounded border border-amber-200 shadow-inner">{emulatedDate}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right mr-2 hidden md:block">
              <p className="text-xs font-black text-slate-800 uppercase tracking-tight">John Doe</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Administrator</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black border-2 border-indigo-200 shadow-md">
              JD
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto">
          {renderView()}
        </section>
      </main>
    </div>
  );
};

export default App;
