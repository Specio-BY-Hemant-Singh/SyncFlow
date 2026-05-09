import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavigation from './TopNavigation';

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-slate-50 text-slate-600 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <TopNavigation />
        <main className="flex-1 overflow-auto p-4 md:p-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
