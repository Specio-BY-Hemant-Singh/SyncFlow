import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard, SortableTaskCard } from './TaskCard';
import { Plus } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export function Column({ column, tasks, onAdd, onTaskClick }: { key?: React.Key, column: any; tasks: any[]; onAdd: () => void; onTaskClick?: (task: any) => void }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  return (
    <div 
      className={cn(
        "bg-transparent flex flex-col shrink-0 flex-1 w-[280px]",
        isOver && "opacity-80"
      )}
    >
      <div className="flex items-center justify-between mb-4 px-1 select-none">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{column.title}</span>
          <span className="text-xs bg-slate-100 px-2 rounded-full text-slate-500">
            {tasks.length}
          </span>
        </div>
        <button 
          onClick={onAdd}
          className="text-slate-500 hover:text-slate-900 transition-colors text-lg leading-none p-1"
        >
          +
        </button>
      </div>

      <div 
        ref={setNodeRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-1 flex flex-col gap-3 min-h-[150px]"
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <SortableTaskCard key={task.id} task={task} onClick={() => onTaskClick?.(task)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
