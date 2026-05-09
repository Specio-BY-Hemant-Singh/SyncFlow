import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreHorizontal, Paperclip, MessageSquare } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { format } from 'date-fns';

export function TaskCard({ task, dragOverlay = false, onClick }: { task: any; dragOverlay?: boolean; onClick?: () => void }) {
  
  const priorityColor = {
    low: 'text-slate-500 bg-slate-100',
    medium: 'text-blue-400 bg-blue-500/10',
    high: 'text-orange-400 bg-orange-500/10',
    critical: 'text-red-400 bg-red-500/10',
  }[task.priority as string] || 'text-slate-500 bg-slate-100';

  return (
    <div 
      onClick={onClick}
      className={cn(
      "p-4 bg-white border border-slate-200 rounded-xl cursor-grab active:cursor-grabbing hover:border-indigo-500/50 transition-all shadow-sm group",
      dragOverlay && "rotate-2 scale-105 shadow-lg border-indigo-500/50 bg-white"
    )}>
      <div className="flex items-center gap-2 mb-2">
        <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", priorityColor)}>
          {task.priority || "Medium"}
        </span>
      </div>
      
      <h3 className="text-sm font-medium text-slate-700 group-hover:text-slate-900 mb-3">{task.title}</h3>
      
      <div className="flex items-center justify-between text-slate-500">
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span className="text-[11px]">{format(new Date(task.dueDate), 'MMM d')}</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs">
          {task.commentCount > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SortableTaskCard({ task, onClick }: { key?: React.Key, task: any, onClick?: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div 
        ref={setNodeRef}
        style={style}
        className="bg-slate-100 border border-dashed border-slate-300 rounded-xl h-[100px] opacity-40"
      />
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onClick={onClick} />
    </div>
  );
}
