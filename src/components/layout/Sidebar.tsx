import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FolderKanban, Users, Sparkles, LogOut, X, Loader2, User, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/src/store';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/src/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const NAV_ITEMS = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: FolderKanban, label: 'Projects', path: '/projects' },
  { icon: Users, label: 'Team', path: '/team' },
  { icon: LinkIcon, label: 'Integrations', path: '/integrations' },
];

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuthStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    try {
      setIsSaving(true);
      await updateDoc(doc(db, 'users', user.uid), {
        name: name.trim()
      });
      setIsProfileOpen(false);
    } catch (err) {
      console.error('Error updating profile', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="w-60 border-r border-slate-200 bg-white flex flex-col h-full shrink-0">
        <div className="p-4 flex items-center gap-3 border-b border-slate-200 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-slate-900" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900 leading-tight">SyncFlow</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Workspace</span>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors group relative",
                  isActive ? "text-slate-900 bg-slate-100" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-500 rounded-r-full"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={cn("w-4 h-4", isActive ? "text-indigo-400" : "opacity-50")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-200 mt-auto">
          <div className="flex items-center justify-between">
            <div 
              onClick={() => {
                setName(user?.name || '');
                setIsProfileOpen(true);
              }}
              className="flex items-center gap-3 min-w-0 cursor-pointer hover:bg-slate-100 p-1 -ml-1 rounded-md transition-colors flex-1"
            >
              <div className="w-8 h-8 rounded-full bg-slate-700 flex flex-shrink-0 items-center justify-center overflow-hidden">
                {user?.name ? (
                  <span className="text-xs text-slate-900 font-medium">{user.name.charAt(0).toUpperCase()}</span>
                ) : (
                  <User className="w-4 h-4 text-slate-600" />
                )}
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-xs font-medium truncate text-slate-900">{user?.name || 'Set Name'}</p>
                <p className="text-[10px] text-slate-500 truncate capitalize">{user?.role || 'Member'}</p>
              </div>
            </div>
            <button 
              onClick={() => signOut(auth)}
              className="text-slate-500 hover:text-red-400 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isProfileOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsProfileOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-md"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-slate-900">Edit Profile</h2>
                <button onClick={() => setIsProfileOpen(false)} className="text-slate-500 hover:text-slate-900">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="E.g. Jane Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-slate-100 text-slate-500 border border-slate-200 rounded-lg px-3 py-2 text-sm cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Email cannot be changed.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Role</label>
                  <div className="w-full bg-slate-100 text-slate-500 border border-slate-200 rounded-lg px-3 py-2 text-sm capitalize">
                    {user?.role || 'Member'}
                  </div>
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !name.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                  >
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
