import { useAuthStore } from '@/src/store';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuthStore();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard', user?.uid],
    queryFn: async () => {
      const tsksSnap = await getDocs(query(collection(db, 'tasks')));
      const allTasks = tsksSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      
      const activeTasks = allTasks.filter(t => t.status !== 'completed');
      const completedTasks = allTasks.filter(t => t.status === 'completed');
      const overdueTasks = activeTasks.filter(t => t.dueDate && t.dueDate < Date.now());
      
      // Recent activity (most recently updated tasks)
      const recentTasks = allTasks.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 5);

      const velocity = allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0;

      return {
        activeCount: activeTasks.length,
        overdueCount: overdueTasks.length,
        velocity: velocity,
        recentActivity: recentTasks
      };
    },
    enabled: !!user
  });

  if (isLoading) {
    return <div className="max-w-7xl mx-auto flex justify-center py-20"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">Welcome back, {user?.name || user?.email}</h1>
        <p className="text-sm text-slate-500">Here is what's happening across your workspace today.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard title="Active Tasks" value={dashboardData?.activeCount.toString() || "0"} trend="Tasks in progress" />
        <MetricCard title="Overdue Tasks" value={dashboardData?.overdueCount.toString() || "0"} trend={dashboardData?.overdueCount ? "Action required" : "On track"} isAlert={!!dashboardData?.overdueCount} />
        <MetricCard title="Completion Rate" value={`${dashboardData?.velocity || 0}%`} trend="Based on total tasks" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 min-h-[400px]">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Recent Activity</h2>
          {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.recentActivity.map(task => (
                <Link key={task.id} to={`/projects/${task.projectId}`} className="flex flex-col gap-1 p-3 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 cursor-pointer block">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{task.title}</span>
                    <span className="text-[10px] text-slate-500">{format(new Date(task.updatedAt || task.createdAt), 'MMM d, h:mm a')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase font-bold">{task.status.replace('_', ' ')}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs">
              No activity yet.
            </div>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 min-h-[400px]">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Project Insights</h2>
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs text-center px-4">
            <span className="mb-2">📊</span>
            <p>Your team's completion rate is {dashboardData?.velocity || 0}%. {dashboardData?.overdueCount ? `There are ${dashboardData.overdueCount} overdue tasks that need attention.` : 'Everything is on track.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, isAlert = false }: { title: string, value: string, trend: string, isAlert?: boolean }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-xl border border-slate-200 p-6 shadow-sm ${isAlert ? 'bg-red-500/5 border-red-500/20' : 'bg-white'}`}
    >
      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{title}</h3>
      <div className="text-3xl font-bold text-slate-900 mb-2">{value}</div>
      <div className={`text-[11px] ${isAlert ? 'text-red-400' : 'text-slate-500'}`}>{trend}</div>
    </motion.div>
  );
}

