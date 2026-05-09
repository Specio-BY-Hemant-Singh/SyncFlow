import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { DndContext, DragOverlay, closestCorners, TouchSensor, MouseSensor, useSensor, useSensors, DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Column } from './Column';
import { TaskCard } from './TaskCard';
import { TaskDetailModal } from './TaskDetailModal';
import { Plus } from 'lucide-react';

import { Filter, SortAsc } from 'lucide-react';
import { useAuthStore } from '@/src/store';
import { getDocs } from 'firebase/firestore';

const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'completed', title: 'Completed' },
];

export default function KanbanBoard({ projectId }: { projectId: string }) {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<any[]>([]);
  const [activeTask, setActiveTask] = useState<any | null>(null);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [columns, setColumns] = useState(COLUMNS);
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [sortBy, setSortBy] = useState('creation'); // 'creation' | 'dueDate'
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    async function fetchTeam() {
      if (!user) return;
      try {
        let qTeam;
        if (user.role === 'admin' || user.role === 'team_lead') {
          qTeam = query(collection(db, 'users'));
        } else if (user.team) {
          qTeam = query(collection(db, 'users'), where('team', '==', user.team));
        } else {
          qTeam = query(collection(db, 'users'), where('uid', '==', user.uid));
        }
        const snap = await getDocs(qTeam);
        setTeamMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Failed to load assignee options", err);
      }
    }
    fetchTeam();
  }, [user]);

  useEffect(() => {
    const q = query(collection(db, 'tasks'), where('projectId', '==', projectId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbTasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setTasks(dbTasks);
    });
    return () => unsubscribe();
  }, [projectId]);

  const sortedAndFilteredTasks = [...tasks]
    .filter(t => !filterPriority || t.priority === filterPriority)
    .filter(t => !filterAssignee || t.assigneeId === filterAssignee)
    .sort((a, b) => {
      if (sortBy === 'dueDate') {
        const aDate = a.dueDate || Infinity;
        const bDate = b.dueDate || Infinity;
        return aDate - bDate;
      }
      return b.createdAt - a.createdAt; // Default to newest first
    });

  const addEmptyTask = async (status: string) => {
    const newTask = {
      projectId,
      title: 'New Task',
      description: '',
      status,
      priority: 'medium',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await addDoc(collection(db, 'tasks'), newTask);
  };

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveTask(tasks.find(t => t.id === active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    let newStatus = task.status;
    
    // Check if dropping onto a column
    if (COLUMNS.find(c => c.id === overId)) {
      newStatus = overId;
    } else {
      // Check if dropping onto another task
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
      }
    }

    if (task.status !== newStatus) {
      // Optimistically update
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      
      // Update DB
      const ref = doc(db, 'tasks', taskId);
      await updateDoc(ref, { 
        status: newStatus,
        updatedAt: Date.now()
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex flex-col sm:flex-row gap-3 px-2">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm text-sm">
          <Filter className="w-4 h-4 text-slate-500" />
          <select 
            value={filterPriority} 
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-transparent text-slate-700 outline-none pr-4"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <div className="w-px h-4 bg-slate-200 mx-1"></div>
          <select 
            value={filterAssignee} 
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="bg-transparent text-slate-700 outline-none pr-4"
          >
            <option value="">All Assignees</option>
            {teamMembers.map(m => (
              <option key={m.id} value={m.id}>{m.name || m.email}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm text-sm">
          <SortAsc className="w-4 h-4 text-slate-500" />
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent text-slate-700 outline-none pr-4"
          >
            <option value="creation">Newest First</option>
            <option value="dueDate">Due Date</option>
          </select>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex xl:justify-start gap-4 px-2 h-full items-start flex-1 overflow-x-auto pb-4">
          {columns.map(col => (
            <Column 
              key={col.id} 
              column={col} 
              tasks={sortedAndFilteredTasks.filter(t => t.status === col.id)} 
              onAdd={() => addEmptyTask(col.id)} 
              onTaskClick={setSelectedTask} 
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} dragOverlay /> : null}
        </DragOverlay>

        <TaskDetailModal 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)} 
        />
      </DndContext>
    </div>
  );
}
