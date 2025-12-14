import React from "react";
import { useNavigate } from "react-router-dom";
import { Camera, ShieldCheck, User, ArrowRight } from "lucide-react";

export default function RoleSelection() {
  const navigate = useNavigate();

  return (
    // 1. Main Background Container
    <div className="min-h-screen flex flex-col items-center justify-center px-4 
                    bg-[url('https://images.unsplash.com/photo-1668453814676-c8093305fae6?w=1920&q=80')]
                    bg-cover bg-center relative font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* 2. Overlay: Slightly warmer dark tint to blend better with the photo's warmth */}
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[1px]"></div>

      {/* 3. Main Content Wrapper */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
        
        {/* --- Brand Header --- */}
        <div className="flex flex-col items-center gap-3 mb-10 animate-fade-in-down">
          {/* Logo Icon - Added a slight warm glow */}
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-2 ring-white/20 backdrop-blur-md">
             <Camera className="w-6 h-6 text-white" />
          </div>
          
          <h1 className="font-bold text-4xl tracking-tight text-white drop-shadow-lg">
              Snap<span className="text-indigo-300">Hub</span>
          </h1>
          
          <p className="text-stone-200 text-sm font-medium tracking-wide opacity-90">
              Studio Management System
          </p>
        </div>

        {/* --- The Two Containers (Warm Glassmorphism) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          
          {/* Container A: Client / User */}
          <div 
            onClick={() => navigate("/user-auth")}
            // The magic happens here: bg-stone-50/80 creates a warm, milky glass effect.
            className="group relative rounded-[2rem] p-8 
                       bg-stone-50/80 backdrop-blur-xl 
                       ring-1 ring-white/40 shadow-2xl shadow-black/10
                       transition-all duration-500 ease-out
                       hover:scale-[1.02] hover:bg-indigo-50/90 hover:ring-indigo-300/50
                       cursor-pointer overflow-hidden"
          >
            <div className="relative z-10 flex flex-col h-full items-start">
              {/* Icon Circle */}
              <div className="p-4 bg-white/70 text-indigo-600 rounded-2xl mb-6 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                <User size={28} />
              </div>
              
              <h2 className="text-2xl font-bold text-stone-800 mb-3">Client Portal</h2>
              <p className="text-stone-600 text-sm mb-10 leading-relaxed font-medium">
                Access your personal account, book new sessions, and Submit ID application.
              </p>

              <div className="mt-auto flex items-center font-bold text-indigo-700 group-hover:translate-x-2 transition-transform duration-300">
                <span>Enter as Client</span>
                <ArrowRight className="ml-2 w-5 h-5" />
              </div>
            </div>
            
            {/* Subtle decorative gradient blob on hover */}
             <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-400/20 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
          </div>

          {/* Container B: Admin */}
          <div 
            onClick={() => navigate("/admin-login")}
            className="group relative rounded-4xl p-8 
                       bg-stone-50/80 backdrop-blur-xl 
                       ring-1 ring-white/40 shadow-2xl shadow-black/10
                       transition-all duration-500 ease-out
                       hover:scale-[1.02] hover:bg-white/95 hover:ring-stone-300/50
                       cursor-pointer overflow-hidden"
          >
            <div className="relative z-10 flex flex-col h-full items-start">
              {/* Icon Circle */}
              <div className="p-4 bg-white/70 text-stone-600 rounded-2xl mb-6 shadow-sm group-hover:bg-stone-800 group-hover:text-white transition-colors duration-300">
                <ShieldCheck size={28} />
              </div>
              
              <h2 className="text-2xl font-bold text-stone-800 mb-3">Admin Access</h2>
              <p className="text-stone-600 text-sm mb-10 leading-relaxed font-medium">
                Full system controls, financial dashboards, and booking management.
              </p>

              <div className="mt-auto flex items-center font-bold text-stone-700 group-hover:translate-x-2 transition-transform duration-300">
                <span>Admin Login</span>
                <ArrowRight className="ml-2 w-5 h-5" />
              </div>
            </div>
             {/* Subtle decorative gradient blob on hover */}
             <div className="absolute bottom-0 right-0 w-64 h-64 bg-stone-400/20 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-12 text-white/60 text-sm font-medium tracking-wider">
          &copy; {new Date().getFullYear()} SnapHub Studios
        </div>
      </div>
    </div>
  );
}