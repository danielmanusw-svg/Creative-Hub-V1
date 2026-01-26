
import React from 'react';
import { AppView, NavItem } from '../types';

interface SidebarProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
}

const NAV_ITEMS: NavItem[] = [
  { id: AppView.CREATIVES, label: 'Creative Strategist', icon: 'fa-solid fa-wand-magic-sparkles' },
  { id: AppView.EDITOR, label: 'Editor', icon: 'fa-solid fa-clapperboard' },
  { id: AppView.VA, label: 'VA', icon: 'fa-solid fa-list-check' },
  { id: AppView.REVIEW, label: 'Review', icon: 'fa-solid fa-chart-line' },
];

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen border-r border-slate-800 shadow-xl shrink-0">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <i className="fa-solid fa-brain text-xl"></i>
          </div>
          <span className="text-xl font-bold tracking-tight">Visionary</span>
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <i className={`${item.icon} text-lg ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`}></i>
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-slate-800">
        <p className="text-xs text-slate-500 text-center italic">Visionary Creative v1.0</p>
      </div>
    </aside>
  );
};

export default Sidebar;
