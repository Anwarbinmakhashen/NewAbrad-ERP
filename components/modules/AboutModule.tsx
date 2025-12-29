import React from 'react';
import { Info, Code, Server, ShieldCheck, Cpu, Smartphone } from 'lucide-react';
import { APP_NAME } from '../../constants';

const AboutModule: React.FC = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-3xl w-full relative overflow-hidden">
        
        {/* Header Background */}
        <div className="bg-slate-50 border-b border-slate-100 p-8 text-center relative">
             <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold-200 via-slate-50 to-slate-50"></div>
             
             <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center border-2 border-gold-500 mb-4">
                    <span className="text-3xl font-bold text-slate-900">N<span className="text-gold-500">A</span></span>
                </div>
                <h1 className="text-3xl font-bold text-slate-800 mb-1">{APP_NAME}</h1>
                <p className="text-slate-500 font-mono dir-ltr text-sm">Version 1.0.0 (Build 2024)</p>
             </div>
        </div>

        {/* Content */}
        <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-sm">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center gap-2 text-center">
                    <ShieldCheck className="text-gold-500" size={24} />
                    <span className="font-bold text-slate-700">أمان وحماية</span>
                    <span className="text-slate-400 text-xs">تشفير AES-256</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center gap-2 text-center">
                    <Server className="text-gold-500" size={24} />
                    <span className="font-bold text-slate-700">قاعدة بيانات محلية</span>
                    <span className="text-slate-400 text-xs">Offline First</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center gap-2 text-center">
                    <Cpu className="text-gold-500" size={24} />
                    <span className="font-bold text-slate-700">أداء عالي</span>
                    <span className="text-slate-400 text-xs">React + Electron</span>
                </div>
            </div>

            <div className="border-t border-slate-100 pt-8 flex flex-col items-center gap-6">
                
                {/* Company Credit */}
                <div className="text-center w-full">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">تصميم وتنفيذ</p>
                    <div className="bg-white p-4 rounded-xl border-2 border-slate-100 shadow-sm hover:border-gold-300 transition-colors inline-flex items-center gap-4">
                        <div className="bg-gold-50 p-3 rounded-lg text-gold-600">
                             <Code size={28} />
                        </div>
                        <div className="text-right">
                             <h3 className="text-xl font-black text-slate-800">الصالحية للنظم</h3>
                             <p className="text-sm text-slate-500 font-bold">وتقنية المعلومات</p>
                        </div>
                    </div>
                </div>

                {/* Developer Credit */}
                <div className="text-center w-full">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">برمجة وتطوير</p>
                    <div className="inline-flex items-center gap-2 bg-slate-800 text-white px-6 py-2 rounded-full shadow-lg">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                        <span className="font-bold font-mono">م / انور بن مخاشن</span>
                    </div>
                </div>

            </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 text-center text-xs text-slate-400 border-t border-slate-200 font-mono">
            جميع الحقوق محفوظة © {new Date().getFullYear()} - NewAbrad Logistics
        </div>
      </div>
    </div>
  );
};

export default AboutModule;