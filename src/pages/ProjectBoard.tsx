import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Loader2, Settings, X, Trash2 } from 'lucide-react';
import KanbanBoard from '@/src/components/board/KanbanBoard';
import { useAuthStore } from '@/src/store';

const AVAILABLE_TEAMS = ['Engineering', 'Design', 'Marketing', 'Sales', 'Support'];

export default function ProjectBoard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [title, setTitle] = useState('');

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id) return null;
      const ref = doc(db, 'projects', id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setTitle(data.title);
        setSelectedTeams(data.teams || []);
        return { id: snap.id, ...data };
      }
      return null;
    },
    enabled: !!id
  });

  const updateProject = useMutation({
    mutationFn: async () => {
      if (!id) return;
      await updateDoc(doc(db, 'projects', id), {
        title,
        teams: selectedTeams,
        updatedAt: Date.now()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      setIsSettingsOpen(false);
    }
  });

  const deleteProject = useMutation({
    mutationFn: async () => {
      if (!id) return;
      await deleteDoc(doc(db, 'projects', id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate('/projects');
    }
  });

  if (isLoading) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>;
  }

  if (!project) {
    return <div className="p-6 text-slate-500">Project not found.</div>;
  }

  const toggleTeam = (team: string) => {
    setSelectedTeams(prev => 
      prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]
    );
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      updateProject.mutate();
    }
  };

  const handleDeleteProject = () => {
    if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      deleteProject.mutate();
    }
  };

  return (
    <div className="h-full flex flex-col pt-4 relative">
      <div className="mb-4 flex flex-col md:flex-row md:justify-between md:items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-500">Projects</span>
            <span className="text-xs text-slate-500">/</span>
            <span className="text-sm font-medium text-slate-900">{(project as any).title}</span>
          </div>
        </div>
        {(user?.role === 'admin' || user?.role === 'team_lead') && (
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mt-2 md:mt-0 bg-white border border-slate-200 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
          >
            <Settings className="w-4 h-4" />
            Project Settings
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        {id && <KanbanBoard projectId={id} />}
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden relative">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 block">Project Settings</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveSettings} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Project Name</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Assigned Teams</label>
                <p className="text-[10px] text-slate-500 mb-2">Select which teams can access this project.</p>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TEAMS.map(team => (
                    <button
                      key={team}
                      type="button"
                      onClick={() => toggleTeam(team)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedTeams.includes(team) ? 'bg-indigo-100 border-indigo-200 text-indigo-700 font-medium' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      {team}
                    </button>
                  ))}
                </div>
              </div>

              {user?.role === 'admin' && (
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-semibold text-red-600 mb-2 uppercase tracking-wider">Danger Zone</h3>
                  <button
                    type="button"
                    onClick={handleDeleteProject}
                    disabled={deleteProject.isPending}
                    className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
                  >
                    {deleteProject.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Delete Project
                  </button>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateProject.isPending}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-50"
                >
                  {updateProject.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
