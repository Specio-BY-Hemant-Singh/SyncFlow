import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/src/lib/firebase';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Loader2 } from 'lucide-react';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type SignupForm = z.infer<typeof signupSchema>;

export default function Signup() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      await updateProfile(userCredential.user, {
        displayName: data.name
      });

      // According to firestore rules, users create their own document
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: data.email,
        name: data.name,
        role: 'member',
        createdAt: Date.now()
      });

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm mb-8 flex flex-col items-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
          <Sparkles className="w-6 h-6 text-slate-900" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create your account</h1>
        <p className="text-slate-500 mt-2 text-sm text-center">
          Join SyncFlow today.
        </p>
      </div>

      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">{error}</div>}
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
            <input
              {...register('name')}
              type="text"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-shadow"
              placeholder="Jane Doe"
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email address</label>
            <input
              {...register('email')}
              type="email"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-shadow"
              placeholder="name@company.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
            <input
              {...register('password')}
              type="password"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-shadow"
              placeholder="••••••••"
            />
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 text-sm"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Sign Up
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-slate-900 hover:text-indigo-400 font-semibold transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
