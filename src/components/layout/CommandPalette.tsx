import React, { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { Search, Folder, CheckSquare, Sparkles, X } from 'lucide-react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useNavigate } from 'react-router-dom';

export function CommandPalette({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const [inputValue, setInputValue] = useState('');
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        const [projSnap, taskSnap] = await Promise.all([
          getDocs(query(collection(db, 'projects'))),
          getDocs(query(collection(db, 'tasks')))
        ]);
        setProjects(projSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setTasks(taskSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      }
    }
    if (open) {
      fetchData();
    }
  }, [open]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setOpen]);

  return (
    <Command.Dialog 
      open={open} 
      onOpenChange={setOpen}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-lg z-50 overflow-hidden"
    >
      <div className="flex items-center border-b border-slate-200 px-4">
        <Search className="w-5 h-5 text-slate-500 mr-2" />
        <Command.Input 
          autoFocus
          value={inputValue}
          onValueChange={setInputValue}
          className="flex-1 bg-transparent border-none outline-none py-4 text-slate-900 placeholder-slate-500 text-sm" 
          placeholder="Search projects, tasks, or ask Copilot..." 
        />
        <button onClick={() => setOpen(false)} className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200">
          <X className="w-4 h-4" />
        </button>
      </div>

      <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-hide">
        <Command.Empty className="py-6 text-center text-sm text-slate-500">
          No results found for "{inputValue}"
        </Command.Empty>
        
        {projects.length > 0 && (
          <Command.Group heading="Projects" className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2 mt-2">
            {projects.map(project => (
              <Command.Item 
                key={project.id}
                onSelect={() => {
                  setOpen(false);
                  navigate(`/projects/${project.id}`);
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors"
                value={`${project.title} ${project.description || ''}`}
              >
                <Folder className="w-4 h-4 text-indigo-400" />
                <span>{project.title}</span>
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {tasks.length > 0 && (
          <Command.Group heading="Tasks" className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2 mt-4">
            {tasks.map(task => (
              <Command.Item 
                key={task.id}
                onSelect={() => {
                  setOpen(false);
                  navigate(`/projects/${task.projectId}`);
                }}
                className="flex flex-col gap-1 px-3 py-2 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors border border-transparent"
                value={`${task.title} ${task.description || ''}`}
              >
                <div className="flex justify-between items-center w-full text-sm text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                    <span>{task.title}</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 ml-6 uppercase font-bold">{task.status.replace('_', ' ')}</span>
              </Command.Item>
            ))}
          </Command.Group>
        )}
      </Command.List>
    </Command.Dialog>
  );
}
