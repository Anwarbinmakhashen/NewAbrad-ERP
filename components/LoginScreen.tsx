import React, { useState } from 'react';
import { StorageService } from '../services/storageService';
import { Lock, User, ArrowRight, AlertCircle, Code } from 'lucide-react';
import { APP_NAME } from '../constants';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate Network Delay for UX
    setTimeout(() => {
        const users = StorageService.getUsers();
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            StorageService.setCurrentUser(user);
            onLogin();
        } else {
            setError('اسم المستخدم أو كلمة المرور غير صحيحة');
            setIsLoading(false);
        }
    }, 800);
  };

  return (
    <div className="h-screen w-screen bg-white flex items-center justify-center font-arabic dir-rtl overflow-hidden relative">
        {/* Background Effects (Subtle Light) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-50 to-white"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px]"></div>

        <div className="bg-white border border-slate-100 p-10 rounded-2xl shadow-2xl w-full max-w-md relative z-10 animate-fadeIn flex flex-col justify-center min-h-[500px]">
            <div>
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-gold-500/20 mb-4 transform rotate-3">
                        <h1 className="text-4xl font-bold text-white">N</h1>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-wide">{APP_NAME}</h2>
                    <p className="text-slate-500 text-sm mt-1">نظام إدارة الموارد المؤسسية</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">اسم المستخدم</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <User size={18} className="text-slate-400" />
                            </div>
                            <input 
                                type="text" 
                                className="block w-full pr-10 pl-3 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all shadow-sm" 
                                placeholder="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">كلمة المرور</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <Lock size={18} className="text-slate-400" />
                            </div>
                            <input 
                                type="password" 
                                className="block w-full pr-10 pl-3 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all shadow-sm" 
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-center gap-2 text-red-600 text-sm animate-pulse">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-gold-500/20 text-sm font-bold text-white bg-gold-500 hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>تسجيل الدخول <ArrowRight size={16} /></>
                        )}
                    </button>
                </form>
            </div>
        </div>

        {/* Developer Credits Footer */}
        <div className="absolute bottom-6 flex flex-col items-center gap-1 text-center opacity-70 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                <Code size={14} />
                <span>تصميم وتطوير: الصالحية للنظم وتقنية المعلومات</span>
            </div>
            <div className="text-[10px] text-slate-300 font-mono">
                Eng. Anwar Bin Makhashen
            </div>
        </div>
    </div>
  );
};

export default LoginScreen;