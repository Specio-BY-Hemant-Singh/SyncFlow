import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, getDocs, orderBy, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuthStore } from '@/src/store';
import { Users, Mail, User, Shield, Loader2, X, Send, Briefcase } from 'lucide-react';

interface WorkspaceUser {
  uid: string;
  name: string;
  email: string;
  role: string;
  team?: string;
  createdAt: number;
}

export default function Team() {
  const { user: currentUser } = useAuthStore();
  const [teamMembers, setTeamMembers] = useState<WorkspaceUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'success'>('idle');

  const fetchTeam = async () => {
    if (!currentUser) return;
    try {
      let q;
      if (currentUser.role === 'admin' || currentUser.role === 'team_lead') {
        q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      } else if (currentUser.team) {
        q = query(collection(db, 'users'), where('team', '==', currentUser.team));
      } else {
        q = query(collection(db, 'users'), where('uid', '==', currentUser.uid));
      }
      
      const querySnapshot = await getDocs(q);
      const members = querySnapshot.docs.map(doc => doc.data() as WorkspaceUser);
      if (currentUser.role !== 'admin' && currentUser.role !== 'team_lead') {
        members.sort((a, b) => b.createdAt - a.createdAt);
      }
      setTeamMembers(members);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchTeam();
    }
  }, [currentUser]);

  const handleUpdateMember = async (memberId: string, updates: Partial<WorkspaceUser>) => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'team_lead') {
      alert('Unauthorized: You do not have permission to modify team members.');
      return;
    }
    try {
      setTeamMembers(prev => prev.map(m => m.uid === memberId ? { ...m, ...updates } : m));
      await updateDoc(doc(db, 'users', memberId), updates);
    } catch (err) {
      console.error('Failed to update member:', err);
      fetchTeam(); // Reset on error
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full pt-20">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role === 'member') {
      alert("Unauthorized: Only Admins or Team Leads can invite members.");
      return;
    }
    if (!inviteEmail) return;
    setInviteStatus('sending');
    // Simulate sending invite
    setTimeout(() => {
      setInviteStatus('success');
      setTimeout(() => {
        setIsInviteModalOpen(false);
        setInviteStatus('idle');
        setInviteEmail('');
      }, 2000);
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 relative">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2 flex items-center gap-3">
              <Users className="w-8 h-8 text-indigo-500" />
              Workspace Team
            </h1>
            <p className="text-sm text-slate-500">Manage your team members and roles.</p>
          </div>
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Invite Member
          </button>
        </div>
      </motion.div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Member</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Team</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {teamMembers.map((member) => (
                <tr key={member.uid} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-slate-200 flex items-center justify-center flex-shrink-0">
                        {member.name ? member.name.charAt(0).toUpperCase() : <User className="w-5 h-5 text-indigo-400" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                          {member.name || 'Unnamed User'}
                          {currentUser?.uid === member.uid && (
                            <span className="ml-2 text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-bold uppercase">You</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Mail className="w-4 h-4" />
                      {member.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 list-none">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      {currentUser?.role === 'admin' ? (
                        <select
                          value={member.team || ''}
                          onChange={(e) => handleUpdateMember(member.uid, { team: e.target.value })}
                          className="bg-transparent border-none text-sm text-slate-600 focus:ring-0 cursor-pointer hover:text-slate-900 p-0 m-0"
                        >
                          <option value="">Unassigned</option>
                          <option value="Engineering">Engineering</option>
                          <option value="Design">Design</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Sales">Sales</option>
                          <option value="Support">Support</option>
                        </select>
                      ) : (
                        <span className="text-sm text-slate-600">{member.team || 'Unassigned'}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Shield className={`w-3.5 h-3.5 ${member.role === 'admin' ? 'text-purple-400' : 'text-slate-500'}`} />
                      {currentUser?.role === 'admin' && currentUser.uid !== member.uid ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleUpdateMember(member.uid, { role: e.target.value })}
                          className="bg-transparent border-none text-sm text-slate-600 capitalize focus:ring-0 cursor-pointer hover:text-slate-900 p-0 m-0"
                        >
                          <option value="member">Member</option>
                          <option value="team_lead">Team Lead</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className="text-sm text-slate-600 capitalize">{member.role || 'Member'}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-right">
                    {new Date(member.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
              {teamMembers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">
                    No team members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isInviteModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInviteModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden"
              >
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Invite to Workspace</h3>
                  <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-500 hover:text-slate-900 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={handleInvite} className="p-6 space-y-4">
                  {inviteStatus === 'success' ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-lg text-sm text-center">
                      Invitation sent successfully to {inviteEmail}!
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email address</label>
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="colleague@company.com"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-shadow"
                          autoFocus
                          required
                        />
                      </div>
                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          disabled={!inviteEmail || inviteStatus === 'sending'}
                          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {inviteStatus === 'sending' ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Send Invite
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </form>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
