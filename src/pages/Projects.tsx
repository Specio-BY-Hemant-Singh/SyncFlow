import React, { useState } from 'react';
import { collection, query, where, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuthStore } from '@/src/store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Briefcase, ChevronRight, Loader2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const AVAILABLE_TEAMS = ['Engineering', 'Design', 'Marketing', 'Sales', 'Support'];

export default function Projects() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  
  // Adding query to filter projects based on list query if user is role 'member'
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects', user?.uid],
    queryFn: async () => {
      try {
        let q;
        if (user?.role === 'admin' || user?.role === 'team_lead') {
          q = query(collection(db, 'projects'));
        } else if (user?.team) {
          q = query(collection(db, 'projects'), where('teams', 'array-contains', user.team));
        } else {
          return [];
        }
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
        return docs;
      } catch (err: any) {
        console.error("Failed to fetch projects:", err);
        return [];
      }
    },
    enabled: !!user
  });

  const createProject = useMutation({
    mutationFn: async ({ title, teams }: { title: string, teams: string[] }) => {
      const newProj = {
        workspaceId: 'default-workspace', 
        title,
        status: 'active',
        teams,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await addDoc(collection(db, 'projects'), newProj);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsCreating(false);
      setNewTitle('');
      setSelectedTeams([]);
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role === 'member') {
      alert("Unauthorized: Only Admins or Team Leads can create projects.");
      return;
    }
    if (newTitle.trim()) {
      createProject.mutate({ title: newTitle.trim(), teams: selectedTeams });
    }
  };

  const toggleTeam = (team: string) => {
    setSelectedTeams(prev => 
      prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Projects</h1>
          <p className="text-slate-500 mt-1">Manage your active operations and teams.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="mb-6 bg-slate-100 border border-slate-200 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex gap-4 items-center">
            <input 
              autoFocus
              type="text" 
              placeholder="Project name..."
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
            <button 
              type="submit" 
              disabled={createProject.isPending || !newTitle.trim()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {createProject.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
            </button>
            <button 
              type="button" 
              onClick={() => { setIsCreating(false); setSelectedTeams([]); }}
              className="bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Assign Teams (Optional)</span>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TEAMS.map(team => (
                <button
                  key={team}
                  type="button"
                  onClick={() => toggleTeam(team)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${selectedTeams.includes(team) ? 'bg-indigo-100 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {team}
                </button>
              ))}
            </div>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects?.map((item: any) => (
            <Link key={item.id} to={`/projects/${item.id}`}>
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white border border-slate-200 hover:border-indigo-500/50 hover:shadow-lg transition-all rounded-xl p-6 cursor-pointer group flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-400 group-hover:text-slate-900 transition-colors">
                    <Briefcase className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{item.title}</h3>
                
                <div className="mt-2 flex-1">
                  {item.teams && item.teams.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                       {item.teams.map((t: string) => (
                         <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-full">
                           {t}
                         </span>
                       ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 text-[10px] block mt-2">No teams assigned</span>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between text-slate-500 text-xs border-t border-slate-100 pt-4">
                  <span className="uppercase tracking-wider font-semibold">{item.status}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>
            </Link>
          ))}
          {projects?.length === 0 && !isCreating && (
            <div className="col-span-full py-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-100">
              <Briefcase className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <h3 className="text-slate-600 text-sm font-medium mb-1">No projects yet</h3>
              <p className="text-slate-500 text-xs">Create a project to start collaborating.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
