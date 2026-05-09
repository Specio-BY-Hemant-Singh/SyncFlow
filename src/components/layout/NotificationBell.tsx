import React, { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuthStore } from '@/src/store';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

interface Notification {
  id: string;
  taskId: string;
  taskTitle: string;
  projectId: string;
  createdAt: number;
  read: boolean;
}

export default function NotificationBell() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const bellRef = useRef<HTMLDivElement>(null);
  const initialLoad = useRef(true);
  const [toastMessage, setToastMessage] = useState<{ title: string; taskId: string } | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'tasks'),
      where('assigneeId', '==', user.uid),
      orderBy('updatedAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications: Notification[] = [];
      let newUnread = 0;

      const readTaskIds = JSON.parse(localStorage.getItem(`read_tasks_${user.uid}`) || '[]');

      snapshot.docChanges().forEach((change) => {
        const taskData = change.doc.data();
        if (!initialLoad.current && (change.type === 'added' || change.type === 'modified')) {
          setToastMessage({ title: taskData.title, taskId: change.doc.id });
          setTimeout(() => setToastMessage(null), 5000);
        }
      });

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const isRead = readTaskIds.includes(doc.id);
        if (!isRead) newUnread++;
        
        newNotifications.push({
          id: doc.id,
          taskId: doc.id,
          taskTitle: data.title,
          projectId: data.projectId,
          createdAt: data.updatedAt || data.createdAt || Date.now(),
          read: isRead,
        });
      });

      setNotifications(newNotifications);
      setUnreadCount(newUnread);
      initialLoad.current = false;
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      const allTaskIds = notifications.map(n => n.taskId);
      localStorage.setItem(`read_tasks_${user?.uid}`, JSON.stringify(allTaskIds));
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    }
  };

  return (
    <div className="relative" ref={bellRef}>
      <button 
        onClick={handleOpen}
        className="relative p-2 text-slate-500 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-100"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-50"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 focus:outline-none"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
              {unreadCount > 0 && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{unreadCount} new</span>}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">
                  You have no notifications right now.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 hover:bg-slate-50 transition-colors flex flex-col gap-1 cursor-pointer ${!notification.read ? 'bg-indigo-50/30' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <p className={`text-sm ${!notification.read ? 'text-slate-900 font-medium' : 'text-slate-700'}`}>
                          You were assigned to: <span className="font-semibold">{notification.taskTitle}</span>
                        </p>
                        {!notification.read && <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0 ml-3"></span>}
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-6 left-1/2 z-[100] flex items-start gap-3 bg-white p-4 rounded-xl shadow-2xl border border-slate-200 pointer-events-auto min-w-[320px] max-w-sm"
          >
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-slate-900">New Task Assigned</h4>
              <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">You were assigned to <span className="font-medium text-slate-900">{toastMessage.title}</span></p>
            </div>
            <button 
              onClick={() => setToastMessage(null)}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
