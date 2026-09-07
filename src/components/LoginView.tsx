import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, Warehouse, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const LoginView: React.FC = () => {
  const { login, demoLogin } = useAuth();
  const [email, setEmail] = useState('finishmcd@gmail.com');
  const [password, setPassword] = useState('290144');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) {
      setErrorMsg(result.error || 'Invalid credentials.');
    }
  };

  const handleQuickDemo = async () => {
    setEmail('finishmcd@gmail.com');
    setPassword('290144');
    setLoading(true);
    await demoLogin();
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-800 via-teal-700 to-emerald-800 relative overflow-hidden p-4">
      {/* Background Decorative Rings */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600/40 border border-emerald-400/40 shadow-inner mb-3 text-white">
            <Warehouse className="size-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            GMS FINISH FABRIC MCD
          </h1>
          <p className="text-teal-200/80 text-sm mt-1 font-medium">
            Warehouse Fabric Received Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/25 p-8 border border-white/50 backdrop-blur-sm">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Sign In to Warehouse</h2>
              <p className="text-xs text-gray-500">Access task manager & inventory ledger</p>
            </div>
            <div className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 text-[11px] font-semibold flex items-center gap-1 border border-emerald-200">
              <ShieldCheck className="size-3.5" />
              <span>Verified Portal</span>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address / User ID
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="finishmcd@gmail.com"
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="login-password" className="block text-xs font-semibold text-gray-700">
                  Password
                </label>
                <span className="text-[11px] text-emerald-600 font-medium">Default: 290144</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  required
                  className="w-full pl-9 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-colors disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <span>Sign In to System</span>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Box */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleQuickDemo}
              className="w-full py-2 px-3 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 text-xs font-medium text-center transition-colors"
            >
              ✨ Quick 1-Click Login as <span className="font-bold">finishmcd@gmail.com</span> (Pass: 290144)
            </button>
          </div>
        </div>

        <p className="text-center text-teal-200/60 text-xs mt-6">
          GMS Finish Fabric MCD © {new Date().getFullYear()} • Real-Time Warehouse Platform
        </p>
      </div>
    </div>
  );
};
