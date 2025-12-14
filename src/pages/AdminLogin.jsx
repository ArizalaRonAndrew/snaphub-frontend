import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../services/AuthService"; 
import { ShieldCheck, Lock, User, Eye, EyeOff, Loader2, KeyRound } from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Tiyaking empty string "" ang initial state para walang laman sa simula
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
        // FIX 1: Use the dedicated adminLogin function from AuthService
        const result = await AuthService.adminLogin(username, password);

        if (result.success || result.token) {
            // FIX 2: Store session data correctly. Using AuthService.setSession for consistency.
            AuthService.setSession(result.token || "admin-session", result.user || { id: "admin", userName: username });
            navigate("/admin/dashboard");
        } else {
            setError(result.message || "Access Denied: Invalid credentials.");
        }
    } catch (err) {
        // FIX 3: Catch the error thrown by AuthService
        setError(err.message || "System Error: Unable to verify credentials.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 
                    bg-[url('https://images.unsplash.com/photo-1668453814676-c8093305fae6?w=1920&q=80')] 
                    bg-cover bg-center relative font-sans">
      
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[3px]"></div>

      <div className="relative z-10 bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm border-t-4 border-stone-800 animate-in fade-in zoom-in duration-300">
        
        <div className="flex flex-col items-center justify-center mb-8">
            <div className="bg-stone-100 p-3 rounded-full mb-4 shadow-inner">
                <ShieldCheck size={32} className="text-stone-800" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
                Admin Portal
            </h2>
            <p className="text-stone-500 text-xs font-medium uppercase tracking-widest mt-1 flex items-center gap-1">
                <Lock size={12} /> Restricted Access
            </p>
        </div>
        
        {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-600 p-3 rounded-r text-sm text-red-700 flex items-center gap-2">
                <KeyRound size={16} />
                <span>{error}</span>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase text-stone-500 ml-1">
                Administrator ID
            </label>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400 group-focus-within:text-stone-800 transition-colors">
                    <User size={18} />
                </div>
                <input 
                    type="text"
                    name="username" // Best practice for browsers
                    autoComplete="username" // Suggests saved usernames
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded focus:bg-white focus:ring-2 focus:ring-stone-800 focus:border-transparent outline-none transition-all font-medium text-stone-900" 
                    placeholder="admin_user"
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    required 
                />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase text-stone-500 ml-1">
                Secure Key
            </label>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400 group-focus-within:text-stone-800 transition-colors">
                    <Lock size={18} />
                </div>
                <input 
                    type={showPassword ? "text" : "password"}
                    name="password" // Best practice
                    autoComplete="current-password" // Suggests saved passwords for this site
                    className="w-full pl-10 pr-10 py-3 bg-stone-50 border border-stone-200 rounded focus:bg-white focus:ring-2 focus:ring-stone-800 focus:border-transparent outline-none transition-all font-medium text-stone-900" 
                    placeholder="••••••••••••"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 transition-colors"
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
          </div>
          
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-stone-900 text-white py-3 rounded font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-2"
          >
            {isLoading ? (
                <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Verifying...</span>
                </>
            ) : (
                "Access Dashboard"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
            <p className="text-xs text-stone-400">
                Authorized personnel only. All activities are monitored.
            </p>
        </div>
      </div>
    </div>
  );
}