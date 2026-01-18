
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ConfirmationModalContextType {
  confirmModal: (options: ConfirmationOptions) => Promise<boolean>;
  closeModal: () => void;
  isOpen: boolean;
  options: ConfirmationOptions | null;
}

const ConfirmationModalContext = createContext<ConfirmationModalContextType | undefined>(undefined);

export const ConfirmationModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirmModal = (options: ConfirmationOptions) => {
    setOptions(options);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  };

  const closeModal = () => {
    setIsOpen(false);
    if (resolver) {
      resolver(false); // Resolve como cancelado se fechar sem confirmar
      setResolver(null);
    }
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolver) {
      resolver(true);
      setResolver(null);
    }
  };

  const handleCancel = () => {
    closeModal();
  };

  return (
    <ConfirmationModalContext.Provider value={{ confirmModal, closeModal, isOpen, options }}>
      {children}
      {isOpen && options && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fadeIn">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCancel}></div>
          
          {/* Modal */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden transform transition-all scale-100 p-6">
            <h3 className={`text-xl font-bold mb-2 ${options.type === 'danger' ? 'text-red-600' : 'text-slate-800'}`}>
              {options.title}
            </h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              {options.message}
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
              >
                {options.cancelText || 'Cancelar'}
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 rounded-xl font-bold text-white transition-colors shadow-lg ${
                  options.type === 'danger' 
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-200' 
                    : options.type === 'warning'
                      ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                }`}
              >
                {options.confirmText || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmationModalContext.Provider>
  );
};

export const useConfirmationModal = () => {
  const context = useContext(ConfirmationModalContext);
  if (!context) {
    throw new Error('useConfirmationModal deve ser usado dentro de um ConfirmationModalProvider');
  }
  return context;
};
