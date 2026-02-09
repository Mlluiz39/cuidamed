
import React from 'react';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentTab, setTab, isOpen = false, onClose }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: '📊' },
    { id: 'patients', label: 'Pacientes', icon: '👥' },
    { id: 'medications', label: 'Medicamentos', icon: '💊' },
    { id: 'approvals', label: 'Aprovações', icon: '✅' },
    { id: 'history', label: 'Histórico', icon: '📜' },
    { id: 'whatsapp', label: 'Monitor WhatsApp', icon: '💬' },
  ];

  const handleItemClick = (id: string) => {
    setTab(id);
    if (window.innerWidth < 768) {
      onClose?.();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <div className={`
        w-64 bg-white h-screen border-r border-slate-200 flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        ${isOpen ? 'flex' : 'hidden md:flex'}
      `}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
              C
            </div>
            <h1 className="text-xl font-bold text-slate-800">CuidaMed</h1>
          </div>
          {/* Close button for mobile */}
          <button 
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                currentTab === item.id
                  ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
           <button
              onClick={async () => {
                const { supabase } = await import('../services/supabaseClient');
                await supabase.auth.signOut();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-red-600 hover:bg-red-50"
            >
              <span className="text-xl">🚪</span>
              <span className="font-medium">Sair</span>
            </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
