
import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass-nav text-white py-4 shadow-2xl sticky top-0 z-50 no-print border-b border-[#B4975A]/30">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center space-x-6 space-x-reverse">
            <div className="logo-container animate-float">
              {/* تم استخدام تمثيل بصري للشعار المرفوع باستخدام SVG مخصص يحاكي الروح الخطية والبصمة */}
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(180,151,90,0.4)] border-2 border-[#B4975A]">
                <svg viewBox="0 0 100 100" className="w-10 h-10">
                  <path d="M50 20 C30 20 20 40 20 60 C20 80 40 85 50 85 C60 85 80 80 80 60 C80 40 70 20 50 20" fill="none" stroke="#1E1B4B" strokeWidth="2" strokeDasharray="2,2" opacity="0.3" />
                  <text x="50" y="65" textAnchor="middle" fontSize="45" fontFamily="Tajawal" fontWeight="900" fill="#1E1B4B">أ</text>
                  <path d="M40 35 L50 25 L60 35 L50 45 Z" fill="#B4975A" />
                  <path d="M30 45 L40 35 L50 45 L40 55 Z" fill="#B4975A" opacity="0.8" />
                  <path d="M50 45 L60 35 L70 45 L60 55 Z" fill="#B4975A" opacity="0.8" />
                </svg>
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-3xl font-black tracking-tighter leading-none text-white">أثر | ATHAR</h1>
              <div className="mt-1">
                <p className="slogan-glow text-sm tracking-tight">أثر | لأن التغيير يبدأ بخطة</p>
                <p className="text-[#B4975A] text-[9px] font-bold uppercase tracking-[0.2em] opacity-90 mt-0.5">Humanitarian Project Architect</p>
              </div>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center space-x-4 space-x-reverse">
            <div className="h-8 w-[1px] bg-white/10 mx-4"></div>
            <span className="text-[10px] font-bold text-indigo-200 tracking-widest uppercase">Smart Governance & Planning</span>
          </div>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4">
        {children}
      </main>
      
      <footer className="py-16 text-center no-print">
        <div className="max-w-md mx-auto space-y-6">
          <div className="h-[1px] bg-gradient-to-r from-transparent via-[#B4975A]/40 to-transparent"></div>
          <div className="inline-block px-10 py-4 bg-white shadow-xl rounded-2xl border border-[#B4975A]/20">
            <p className="text-[#1E1B4B] font-black text-base">إعداد وبرمجة أ: نبيل الحميد</p>
          </div>
          <div className="text-slate-500 text-xs font-semibold">
            <p className="text-[10px] tracking-widest uppercase opacity-50 font-black">
              &copy; {new Date().getFullYear()} Athar Architect • All Rights Reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
