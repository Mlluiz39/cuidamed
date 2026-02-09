
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useWhatsAppLogs } from '../hooks/useSupabaseData';

const WhatsAppMonitor: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  const { logs, loading, error } = useWhatsAppLogs(userId);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageTypeLabel = (type: string) => {
    switch (type) {
      case 'system':
        return '🤖 Sistema CuidaMed';
      case 'user':
        return '👤 Paciente';
      case 'caregiver':
        return '👨‍⚕️ Cuidador';
      default:
        return '💬 Mensagem';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Monitor WhatsApp</h2>
          <p className="text-slate-500">Acompanhe em tempo real as automações da EvolutionAPI.</p>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            API Conectada
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[600px]">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <span className="font-bold text-slate-700">Log de Comunicação</span>
          </div>
          <button className="text-sm font-semibold text-blue-600">Limpar Log</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="text-center py-20">
              <p className="text-slate-400">Carregando logs...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-500">Erro ao carregar logs: {error}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-400 text-lg">Nenhum log de comunicação ainda.</p>
              <p className="text-slate-400 text-sm mt-2">As mensagens do WhatsApp aparecerão aqui.</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className={`flex gap-4 ${log.message_type === 'user' || log.message_type === 'caregiver' ? 'justify-end' : ''}`}>
                <div className={`max-w-[80%] rounded-2xl p-4 ${
                  log.message_type === 'system' 
                    ? 'bg-slate-50 border border-slate-100 text-slate-600' 
                    : 'bg-blue-600 text-white'
                }`}>
                  <div className="flex items-center justify-between mb-2 gap-4">
                    <span className="text-[10px] font-bold uppercase opacity-60">
                      {getMessageTypeLabel(log.message_type)}
                    </span>
                    <span className="text-[10px] opacity-60">{formatTime(log.sent_at)}</span>
                  </div>
                  <p className="text-sm font-medium">{log.message}</p>
                  {log.status === 'error' && (
                    <span className="mt-2 inline-block px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">
                      ERRO NO ENVIO
                    </span>
                  )}
                  {log.status === 'alert' && (
                    <span className="mt-2 inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold">
                      ALERTA ENVIADO
                    </span>
                  )}
                  {log.status === 'delivered' && log.message_type === 'system' && (
                    <span className="mt-2 inline-block px-2 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-bold">
                      ✓ ENTREGUE
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <p className="text-xs text-center text-slate-400">
            Este é um monitor de fluxo da EvolutionAPI. Todas as mensagens são integradas diretamente ao WhatsApp dos pacientes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppMonitor;
