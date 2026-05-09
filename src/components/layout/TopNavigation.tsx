import { useState } from 'react';
import { Search, Command } from 'lucide-react';
import { CommandPalette } from './CommandPalette';
import NotificationBell from './NotificationBell';

export default function TopNavigation() {
  const [cmdkOpen, setCmdkOpen] = useState(false);

  return (
    <header className="h-[56px] border-b border-slate-200 bg-slate-50/80 backdrop-blur-md flex items-center px-6 justify-between shrink-0 sticky top-0 z-20">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={() => setCmdkOpen(true)}
          className="flex items-center gap-3 text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md px-3 py-1.5 transition-colors w-64"
        >
          <Search className="w-4 h-4 text-slate-500" />
          <span className="flex-1 text-left text-xs">Search anything...</span>
          <div className="flex items-center gap-1 text-[10px] font-mono font-medium text-slate-500 border border-slate-300 rounded px-1.5 py-0.5">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
      </div>

      <CommandPalette open={cmdkOpen} setOpen={setCmdkOpen} />
    </header>
  );
}
