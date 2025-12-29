import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginScreen from './components/LoginScreen';
import { ModuleType } from './types';
import { StorageService } from './services/storageService';

// Module Imports
import DashboardModule from './components/modules/DashboardModule';
import AccountingModule from './components/modules/AccountingModule';
import FleetModule from './components/modules/FleetModule';
import HRModule from './components/modules/HRModule';
import StoreModule from './components/modules/StoreModule';
import AdminModule from './components/modules/AdminModule';
import TradeModule from './components/modules/TradeModule';
import TasksModule from './components/modules/TasksModule';
import CostingModule from './components/modules/CostingModule';
import StatsModule from './components/modules/StatsModule';
import HelpModule from './components/modules/HelpModule';
import SystemSetup from './components/modules/SystemSetup';
import AboutModule from './components/modules/AboutModule';

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleType>(ModuleType.DASHBOARD);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize System & Print Styles
  useEffect(() => {
    const initSystem = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 800)); 
        StorageService.init();
        
        // Check Config
        const config = StorageService.getConfig();
        if (config && config.isConfigured) {
          setIsConfigured(true);
          
          // Apply Global Print Styles (Dynamic Injection)
          if (config.printHeader || config.printFooter || config.companySeal) {
              const style = document.createElement('style');
              style.innerHTML = `
                @media print {
                    :root {
                        --print-header: url('${config.printHeader || ''}');
                        --print-footer: url('${config.printFooter || ''}');
                        --print-seal: url('${config.companySeal || ''}');
                    }
                }
              `;
              document.head.appendChild(style);
          }

          // Check if already logged in (optional for desktop app, usually require login on start)
          const currentUser = StorageService.getCurrentUser();
          if (currentUser) {
              setIsAuthenticated(true);
          }
        } else {
          setIsConfigured(false);
        }

        setIsLoading(false);
      } catch (e) {
        console.error("System Initialization Failed", e);
      }
    };
    initSystem();
  }, []);

  const handleLogout = () => {
      StorageService.setCurrentUser(null);
      setIsAuthenticated(false);
  };

  const handleSetupComplete = () => {
    setIsConfigured(true);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-white flex flex-col items-center justify-center text-slate-800">
        <div className="w-16 h-16 border-4 border-slate-200 border-t-gold-500 rounded-full animate-spin mb-4"></div>
        <h1 className="text-2xl font-bold font-arabic text-slate-900">نيو أبراد</h1>
        <p className="text-slate-500 text-sm mt-2">جاري تحميل النظام...</p>
      </div>
    );
  }

  // 1. SETUP WIZARD
  if (!isConfigured) {
    return <SystemSetup onSetupComplete={handleSetupComplete} />;
  }

  // 2. LOGIN SCREEN
  if (!isAuthenticated) {
      return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  // 3. MAIN APP
  const renderContent = () => {
    switch (activeModule) {
        case ModuleType.DASHBOARD:
            return <DashboardModule />;
        case ModuleType.ACCOUNTS:
            return <AccountingModule />;
        case ModuleType.FLEET:
            return <FleetModule />;
        case ModuleType.HR:
            return <HRModule />;
        case ModuleType.STORE:
            return <StoreModule />;
        case ModuleType.ADMIN:
            return <AdminModule />;
        case ModuleType.TRADE:
            return <TradeModule />;
        case ModuleType.TASKS:
            return <TasksModule />;
        case ModuleType.COSTING:
            return <CostingModule />;
        case ModuleType.STATS:
            return <StatsModule />;
        case ModuleType.HELP:
            return <HelpModule />;
        case ModuleType.ABOUT:
            return <AboutModule />;
        default:
            return (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center max-w-md">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <span className="text-2xl font-bold">!</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2 font-arabic">النظام قيد التوسعة</h3>
                        <p className="text-slate-500 font-arabic">
                            وحدة <span className="text-gold-600 font-bold mx-1">{activeModule}</span> جاهزة للربط.
                            <br/>
                            يرجى استخدام الوحدات المفعلة حالياً.
                        </p>
                    </div>
                </div>
            );
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-arabic dir-rtl">
      
      {/* Global Print Header/Footer Containers (Only Visible in Print) */}
      <div className="print-header-container hidden print:block fixed top-0 left-0 w-full h-[150px] bg-no-repeat bg-contain bg-center" style={{ backgroundImage: 'var(--print-header)' }}></div>
      <div className="print-footer-container hidden print:block fixed bottom-0 left-0 w-full h-[100px] bg-no-repeat bg-contain bg-center" style={{ backgroundImage: 'var(--print-footer)' }}></div>
      <div className="print-seal-container hidden print:block fixed bottom-[120px] left-[50px] w-[150px] h-[150px] bg-no-repeat bg-contain bg-center opacity-80" style={{ backgroundImage: 'var(--print-seal)' }}></div>

      {/* Sidebar - Fixed Left (RTL: Right) */}
      <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} onLogout={handleLogout} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white/50 print:bg-white">
        <Header activeModule={activeModule} />
        
        <main className="flex-1 overflow-auto p-6 relative print:p-0 print:overflow-visible">
          {/* Dynamic Module Content */}
          <div className="h-full w-full max-w-7xl mx-auto print:max-w-none print:w-full">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;