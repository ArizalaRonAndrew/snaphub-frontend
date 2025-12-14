import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, User, Loader2, ArrowRight } from "lucide-react";
import { AuthService } from "../services/AuthService"; 

// FIX 1: Removed manual API URL constant

export default function UserAuth() {
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Tiyaking empty string ang simula
  const [userName, setUserName] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFeedback({ type: "", message: "" });
    // Optional: Clear fields pag nagpapalit ng mode
    // setUserName(""); 
    // setUserPassword("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: "", message: "" });
    setIsLoading(true);

    try {
      let data;
      
      if (isLogin) {
        // FIX 2: Use AuthService.userLogin
        data = await AuthService.userLogin(userName, userPassword);
        
        // FIX 3: Use AuthService.setSession to store token and user object
        AuthService.setSession(data.token, data.user); 
        
        navigate("/home");
      } else {
        // FIX 4: Use AuthService.userRegister
        data = await AuthService.userRegister(userName, userPassword); 
        
        setFeedback({ 
            type: "success", 
            message: "Account created! Please log in." 
        });
        setIsLogin(true);
        setUserName("");
        setUserPassword("");
      }

    } catch (err) {
      // FIX 5: Improved error handling
      const message = err.message || "Failed to process request.";
      setFeedback({ type: "error", message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 
                    bg-[url('https://images.unsplash.com/photo-1668453814676-c8093305fae6?w=1920&q=80')] 
                    bg-cover bg-center relative font-sans">
      
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>

      <div className="relative z-10 bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20 transition-all duration-300">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-stone-800 tracking-tight">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-stone-500 mt-2 text-sm">
            {isLogin 
              ? "Enter your credentials to access your account" 
              : "Sign up today to get started"}
          </p>
        </div>

        {feedback.message && (
          <div className={`p-4 mb-6 text-sm rounded-lg flex items-center gap-2 animate-fade-in
            ${feedback.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Input */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider ml-1">
              Username
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400 group-focus-within:text-stone-800 transition-colors">
                <User size={18} />
              </div>
              <input
                type="text"
                name="username" // Helps browser identify field
                autoComplete="username" // Enables suggestions
                className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-stone-800 focus:border-transparent outline-none transition-all duration-200"
                placeholder="Enter your username"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider ml-1">
              Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400 group-focus-within:text-stone-800 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                // Dynamic autocomplete
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="w-full pl-10 pr-10 py-3 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-stone-800 focus:border-transparent outline-none transition-all duration-200"
                placeholder="••••••••"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
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
            type="submit" // Changed to submit for proper form handling
            disabled={isLoading}
            className="w-full bg-stone-900 text-white py-3.5 rounded-lg font-semibold hover:bg-stone-800 active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{isLogin ? "Sign In" : "Create Account"}</span>
                {isLogin && <ArrowRight size={18} />}
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-stone-100 text-center">
          <p className="text-stone-500 text-sm mb-2">
            {isLogin ? "Don't have an account yet?" : "Already have an account?"}
          </p>
          <button
            onClick={toggleMode}
            className="text-stone-800 font-bold hover:underline decoration-2 underline-offset-4 transition-all"
          >
            {isLogin ? "Register for free" : "Log in here"}
          </button>
        </div>
      </div>
    </div>
  );
}