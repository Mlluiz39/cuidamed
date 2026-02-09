
import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { usePatients, useMedicationHistory } from '../hooks/useSupabaseData';
import { AdherenceStatus } from '../types';

const AlertsHistory: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  const { patients } = usePatients(userId);
  const patientIds = patients.map(p => p.id);
  const { history, loading } = useMedicationHistory({ patientIds });

  // Filtrar apenas alertas (Perdidos, Pendentes, Atrasados)
  const alerts = history.filter(h => 
    h.status === AdherenceStatus.MISSED || 
    h.status === AdherenceStatus.PENDING || 
    h.status === AdherenceStatus.DELAYED
  );

  const getPatientName = (patientId: string) => {
    return patients.find(p => p.id === patientId)?.name || 'Desconhecido';
  };

  const getStatusColor = (status: AdherenceStatus) => {
    switch (status) {
      case AdherenceStatus.MISSED:
        return 'bg-red-100 text-red-700 border-red-200';
      case AdherenceStatus.PENDING:
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case AdherenceStatus.DELAYED:
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: AdherenceStatus) => {
    switch (status) {
      case AdherenceStatus.MISSED:
        return '✗';
      case AdherenceStatus.PENDING:
        return '⏱';
      case AdherenceStatus.DELAYED:
        return '⚠';
      default:
        return '○';
    }
  };

  const getStatusLabel = (status: AdherenceStatus) => {
    switch (status) {
      case AdherenceStatus.MISSED:
        return 'Não Tomado';
      case AdherenceStatus.PENDING:
        return 'Pendente';
      case AdherenceStatus.DELAYED:
        return 'Atrasado';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Todos os Alertas</h2>
        <p className="text-slate-500">Histórico completo de medicamentos não tomados ou pendentes.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">Carregando alertas...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">Nenhum alerta registrado.</p>
            <p className="text-slate-400 text-sm mt-2">Excelente! Todos os medicamentos estão em dia.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((record) => (
              <div 
                key={record.id}
                className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-slate-800">Medicação {record.scheduledTime}</h4>
                    <p className="text-sm text-slate-600">
                      <span className="font-semibold">Paciente:</span> {getPatientName(record.patientId)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(record.status)} whitespace-nowrap`}>
                    {getStatusIcon(record.status)} {getStatusLabel(record.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Data</p>
                    <p className="font-semibold text-slate-700">{record.date}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Horário Agendado</p>
                    <p className="font-semibold text-slate-700">{record.scheduledTime}</p>
                  </div>
                  <div>
                     <button className="text-blue-600 font-bold hover:underline">
                        Resolver
                     </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsHistory;
