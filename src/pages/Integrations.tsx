import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/src/store';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';

export default function Integrations() {
  const { user } = useAuthStore();
  
  const [slackWebhook, setSlackWebhook] = useState('');
  const [isSlackSaving, setIsSlackSaving] = useState(false);
  const [isSlackConnected, setIsSlackConnected] = useState(false);
  
  const [emailServiceId, setEmailServiceId] = useState('');
  const [emailTemplateId, setEmailTemplateId] = useState('');
  const [emailPublicKey, setEmailPublicKey] = useState('');
  const [isEmailEnabled, setIsEmailEnabled] = useState(false);
  const [isEmailSaving, setIsEmailSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const snap = await getDoc(doc(db, 'integrations', 'workspace'));
      if (snap.exists()) {
        const data = snap.data();
        if (data.slackWebhook) {
          setSlackWebhook(data.slackWebhook);
          setIsSlackConnected(true);
        }
        if (data.emailServiceId) {
           setEmailServiceId(data.emailServiceId);
           setEmailTemplateId(data.emailTemplateId);
           setEmailPublicKey(data.emailPublicKey);
           setIsEmailEnabled(!!data.isEmailEnabled);
        }
      }
    }
    loadSettings();
  }, []);

  const handleSaveSlack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slackWebhook.trim()) return;
    setIsSlackSaving(true);
    try {
      await setDoc(doc(db, 'integrations', 'workspace'), {
        slackWebhook: slackWebhook.trim()
      }, { merge: true });
      setIsSlackConnected(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSlackSaving(false);
    }
  };
  
  const handleDisconnectSlack = async () => {
    try {
      await setDoc(doc(db, 'integrations', 'workspace'), { slackWebhook: '' }, { merge: true });
      setIsSlackConnected(false);
      setSlackWebhook('');
    } catch (err) {}
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEmailSaving(true);
    const enabled = !isEmailEnabled; // toggle
    if (enabled && (!emailServiceId || !emailTemplateId || !emailPublicKey)) {
       alert("Please fill in all EmailJS fields to enable.");
       setIsEmailSaving(false);
       return;
    }
    try {
      await setDoc(doc(db, 'integrations', 'workspace'), {
        emailServiceId,
        emailTemplateId,
        emailPublicKey,
        isEmailEnabled: enabled
      }, { merge: true });
      setIsEmailEnabled(enabled);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEmailSaving(false);
    }
  };

  if (user?.role === 'member') {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">Integrations</h1>
        <p className="text-slate-500">Only Admin and Team Lead can configure integrations.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-1">Integrations</h1>
          <p className="text-sm text-slate-500">Connect external services to boost your team's productivity.</p>
        </div>
      </div>

      <div className="grid gap-6">
        
        {/* Slack Integration */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center -mt-1">
                <MessageSquare className="w-6 h-6 text-[#E01E5A]" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Slack Notifications</h3>
                <p className="text-xs text-slate-500 mt-1">Receive task updates and comments directly in your Slack channel via Webhook.</p>
              </div>
            </div>
            {isSlackConnected && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <CheckCircle2 className="w-4 h-4" />
                Connected
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSlack} className="mt-6 flex gap-3">
             <input
                type="text"
                placeholder="https://hooks.slack.com/services/..."
                value={slackWebhook}
                onChange={(e) => setSlackWebhook(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                disabled={isSlackConnected}
             />
             <button
               type="submit"
               disabled={!slackWebhook.trim() || isSlackSaving || isSlackConnected}
               className="bg-[#E01E5A] hover:bg-[#C0194C] disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium min-w-[100px] flex items-center justify-center transition"
             >
                {isSlackSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isSlackConnected ? 'Saved' : 'Connect'}
             </button>
          </form>
          {isSlackConnected && (
            <button 
              onClick={handleDisconnectSlack}
              className="text-xs text-slate-400 hover:text-slate-600 mt-3 font-medium transition"
            >
              Disconnect Webhook
            </button>
          )}
        </div>

        {/* Email Integration */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
           <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center -mt-1">
                <Mail className="w-6 h-6 text-[#1A73E8]" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">EmailJS Integration</h3>
                <p className="text-xs text-slate-500 mt-1">Configure your EmailJS credentials to send task notifications to users.</p>
              </div>
            </div>
          </div>
          
          <form className="mt-6 border-t border-slate-100 pt-5 space-y-4">
             <div>
               <label className="block text-xs font-medium text-slate-700 mb-1">Service ID</label>
               <input
                 type="text"
                 value={emailServiceId}
                 onChange={e => setEmailServiceId(e.target.value)}
                 disabled={isEmailEnabled}
                 placeholder="service_xxxxx"
                 className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-70"
               />
             </div>
             <div>
               <label className="block text-xs font-medium text-slate-700 mb-1">Template ID</label>
               <input
                 type="text"
                 value={emailTemplateId}
                 onChange={e => setEmailTemplateId(e.target.value)}
                 disabled={isEmailEnabled}
                 placeholder="template_xxxxx"
                 className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-70"
               />
             </div>
             <div>
               <label className="block text-xs font-medium text-slate-700 mb-1">Public Key</label>
               <input
                 type="text"
                 value={emailPublicKey}
                 onChange={e => setEmailPublicKey(e.target.value)}
                 disabled={isEmailEnabled}
                 placeholder="xxxxxxxxx"
                 className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-70"
               />
             </div>
             
             <div className="flex justify-end pt-3">
               <button
                 type="button"
                 onClick={handleSaveEmail}
                 disabled={isEmailSaving || (!isEmailEnabled && (!emailServiceId || !emailTemplateId || !emailPublicKey))}
                 className={`${isEmailEnabled ? 'bg-rose-500 hover:bg-rose-600' : 'bg-indigo-600 hover:bg-indigo-700'} text-white px-4 py-2 rounded-lg text-sm font-medium w-full sm:w-auto transition-colors flex items-center justify-center`}
               >
                 {isEmailSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEmailEnabled ? 'Disable EmailJS' : 'Enable & Save'}
               </button>
             </div>
          </form>

          {isEmailEnabled && (
             <div className="mt-4 p-4 bg-indigo-50/50 rounded-lg border border-indigo-100 flex items-center gap-2">
               <CheckCircle2 className="w-5 h-5 text-indigo-500" />
               <div>
                 <span className="text-xs text-indigo-800 font-medium block">
                   EmailJS is currently active.
                 </span>
                 <p className="text-[10px] text-indigo-600 mt-0.5">Task assignments will trigger email notifications.</p>
               </div>
             </div>
          )}
        </div>

      </div>
    </div>
  );
}
