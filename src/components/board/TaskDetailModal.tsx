import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Flag, AlignLeft, UserPlus, Trash2, CheckCircle2, MessageSquare, Send, Pin } from 'lucide-react';
import { doc, updateDoc, deleteDoc, collection, addDoc, query, where, orderBy, onSnapshot, getDocs, getDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { sendNotification } from '@/src/lib/notifier';
import { format, parseISO } from 'date-fns';
import { useAuthStore } from '@/src/store';

interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigneeId?: string;
  dueDate?: number;
  createdAt: number;
}

interface Comment {
  id: string;
  taskId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: number;
  isPinned?: boolean;
}

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
}

export function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('todo');
  const [dueDate, setDueDate] = useState<string>('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    async function fetchTeam() {
      if (!user) return;
      try {
        let q;
        if (user.role === 'admin' || user.role === 'team_lead') {
          q = query(collection(db, 'users'));
        } else if (user.team) {
          q = query(collection(db, 'users'), where('team', '==', user.team));
        } else {
          q = query(collection(db, 'users'), where('uid', '==', user.uid));
        }
        const snap = await getDocs(q);
        setTeamMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Failed to load assignee options", err);
      }
    }
    fetchTeam();
  }, [user]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setStatus(task.status);
      setAssigneeId(task.assigneeId || '');
      setDueDate(task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '');
    }
  }, [task]);

  useEffect(() => {
    if (!task) return;

    const q = query(
      collection(db, 'comments'),
      where('taskId', '==', task.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      
      // Sort pinned comments to the top, while keeping the rest descending
      fetchedComments.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0; // both true or both false, keep original order (desc)
      });
      
      setComments(fetchedComments);
    });

    return () => unsubscribe();
  }, [task]);

  if (!task) return null;

  const handleSave = async (e?: React.FormEvent | boolean, closeAfterSave = false) => {
    if (typeof e === 'object' && e.preventDefault) e.preventDefault();
    const shouldClose = typeof e === 'boolean' ? e : closeAfterSave;
    
    if (!title.trim() || isSaving) return;

    try {
      setIsSaving(true);
      const updateData: any = {
        title: title.trim(),
        description: description.trim(),
        priority,
        status,
        assigneeId,
        updatedAt: Date.now()
      };
      if (dueDate) {
        updateData.dueDate = parseISO(dueDate).getTime();
      }
      await updateDoc(doc(db, 'tasks', task.id), updateData);
      if (shouldClose) {
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('Missing or insufficient permissions')) {
        alert("Unauthorized: You do not have permission to modify this task.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingComment || !user) return;

    try {
      setIsSubmittingComment(true);
      const commentContent = newComment.trim();
      await addDoc(collection(db, 'comments'), {
        taskId: task.id,
        content: commentContent,
        authorId: user.uid,
        authorName: user.name || user.email,
        createdAt: Date.now()
      });
      setNewComment('');

      // Send notification
      let assigneeEmail = '';
      let assigneeName = '';
      if (task.assigneeId && task.assigneeId !== user.uid) {
        const assigneeMatch = teamMembers.find(m => m.id === task.assigneeId);
        if (assigneeMatch) {
          assigneeEmail = assigneeMatch.email;
          assigneeName = assigneeMatch.name || assigneeMatch.email;
        }
      }
      
      sendNotification({
        title: `New Comment on task: ${task.title}`,
        message: `${user.name || user.email} commented:\n"${commentContent}"`,
        userEmail: assigneeEmail,
        userName: assigneeName
      });

    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleTogglePin = async (commentId: string, currentPinStatus: boolean) => {
    if (user?.role !== 'admin' && user?.role !== 'team_lead') return;
    try {
      await updateDoc(doc(db, 'comments', commentId), {
        isPinned: !currentPinStatus
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (user?.role === 'member') {
      alert("Unauthorized: Only Admins or Team Leads can delete tasks.");
      return;
    }
    try {
      await deleteDoc(doc(db, 'tasks', task.id));
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('Missing or insufficient permissions')) {
        alert("Unauthorized: You do not have permission to delete this task.");
      }
    }
  };

  return (
    <AnimatePresence>
      {task && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-lg z-50 overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-white">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {task.projectId.slice(0, 5)} - Task Detail
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-slate-900 p-1 rounded-md hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-transparent text-2xl font-bold text-slate-900 mb-6 focus:outline-none focus:border-b border-indigo-500/50 pb-1 -ml-1 px-1 rounded-md"
                  placeholder="Task Title"
                />

                <div className="flex flex-wrap items-center gap-6 mb-8 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium w-20">Status</span>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="bg-white border border-slate-200 text-slate-700 rounded-md py-1.5 px-3 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium w-20">Priority</span>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="bg-white border border-slate-200 text-slate-700 rounded-md py-1.5 px-3 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <span className="text-slate-500 font-medium w-20">Assignee</span>
                    <select
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      className="bg-white border border-slate-200 text-slate-700 rounded-md py-1.5 px-3 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Unassigned</option>
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.name || m.email}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium w-20">Due Date</span>
                    <input
                      type="date"
                      value={dueDate}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="bg-white border border-slate-200 text-slate-700 rounded-md py-1.5 px-3 focus:outline-none focus:border-indigo-500 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <AlignLeft className="w-4 h-4" />
                    Description
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a more detailed description..."
                    className="w-full min-h-[150px] bg-slate-100 border border-slate-200 rounded-xl p-4 text-slate-600 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-y"
                  />
                </div>
              </div>

              <div className="w-full md:w-72 flex flex-col border-t md:border-t-0 md:border-l border-slate-200 pt-6 md:pt-0 md:pl-6">
                <div className="flex items-center gap-2 text-slate-600 font-medium mb-4">
                  <MessageSquare className="w-4 h-4" />
                  Comments
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-hide min-h-[200px]">
                  {comments.length === 0 ? (
                    <div className="text-xs text-slate-500 text-center py-4">No comments yet.</div>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.id} className={`rounded-lg p-3 text-sm border ${comment.isPinned ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-100 border-transparent'}`}>
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <span className="font-medium text-slate-700 text-xs flex items-center gap-1.5">
                              {comment.authorName}
                              {comment.isPinned && <Pin className="w-3 h-3 text-indigo-500 fill-indigo-200" />}
                            </span>
                            <span className="text-[10px] text-slate-500">{format(new Date(comment.createdAt), 'MMM d, h:mm a')}</span>
                          </div>
                          {(user?.role === 'admin' || user?.role === 'team_lead') && (
                            <button 
                              onClick={() => handleTogglePin(comment.id, !!comment.isPinned)}
                              title={comment.isPinned ? "Unpin comment" : "Pin comment"}
                              className="text-slate-400 hover:text-indigo-500 transition-colors"
                            >
                              <Pin className={`w-3.5 h-3.5 ${comment.isPinned ? 'fill-indigo-500 text-indigo-500' : ''}`} />
                            </button>
                          )}
                        </div>
                        <p className="text-slate-600 text-xs leading-relaxed mt-1">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddComment} className="relative mt-auto">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 pr-10 text-slate-600 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none min-h-[80px]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim() || isSubmittingComment}
                    className="absolute bottom-3 right-3 p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-md transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border border-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <span className="text-xs text-slate-500 hidden sm:block">
                  Created {format(new Date(task.createdAt), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => handleSave(e, true)}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
