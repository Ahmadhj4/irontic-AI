'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await signIn('credentials', { email, password, redirect: false });
      if (res?.error) {
        setError('Invalid credentials. Please try again.');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      {error && (
        <div className="bg-red-500/10 border border-red-500/25 rounded-lg px-4 py-3 text-xs text-red-400">
          {error}
        </div>
      )}
      <div>
        <label className="block text-xs font-medium text-white/50 mb-1.5">Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
          placeholder="you@irontic.ai"
          className="w-full bg-white/[0.04] border border-white/[0.10] rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-irontic-purple/50 transition-colors" />
      </div>
      <div>
        <label className="block text-xs font-medium text-white/50 mb-1.5">Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
          placeholder="••••••••"
          className="w-full bg-white/[0.04] border border-white/[0.10] rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-irontic-purple/50 transition-colors" />
      </div>
      <button type="submit" disabled={loading}
        className="w-full py-2.5 bg-irontic-purple hover:bg-irontic-purple/80 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
}
