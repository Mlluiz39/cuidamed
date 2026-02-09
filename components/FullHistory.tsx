
import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { usePatients, useMedications, useMedicationHistory } from '../hooks/useSupabaseData';
import { HistoryRecord, AdherenceStatus } from '../types';

interface FullHistoryProps {
  initialPatientId?: string;
}

const FullHistory: React.FC<FullHistoryProps> = ({ initialPatientId }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    if (initialPatientId) {
      setSelectedPatient(initialPatientId);
    }
  }, [initialPatientId]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  const { patients } = usePatients(userId);
  const patientIds = patients.map(p => p.id);
  const { medications } = useMedications();
  const { history, loading } = useMedicationHistory({
    patientId: selectedPatient === 'all' ? undefined : selectedPatient,
    patientIds: selectedPatient === 'all' ? patientIds : undefined,
    status: selectedStatus === 'all' ? undefined : (selectedStatus as AdherenceStatus),
  });

  // Calcular estatísticas
  const totalRecords = history.length;
  const takenCount = history.filter(h => h.status === AdherenceStatus.TAKEN).length;
  const missedCount = history.filter(h => h.status === AdherenceStatus.MISSED).length;
  const pendingCount = history.filter(h => h.status === AdherenceStatus.PENDING).length;
  const delayedCount = history.filter(h => h.status === AdherenceStatus.DELAYED).length;
  const adherenceRate = totalRecords > 0 ? Math.round((takenCount / totalRecords) * 100) : 0;



  const getPatientName = (patientId: string) => {
    return patients.find(p => p.id === patientId)?.name || 'Desconhecido';
  };

  const getStatusColor = (status: AdherenceStatus) => {
    switch (status) {
      case AdherenceStatus.TAKEN:
        return 'bg-green-100 text-green-700 border-green-200';
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
      case AdherenceStatus.TAKEN:
        return '✓';
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
      case AdherenceStatus.TAKEN:
        return 'Tomado';
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
        <h2 className="text-2xl font-bold text-slate-800">Histórico Completo</h2>
        <p className="text-slate-500">Visualize todo o histórico de medicação com filtros e estatísticas.</p>
      </div>

      {/* Estatísticas Resumidas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total</p>
          <p className="text-2xl font-bold text-slate-800">{totalRecords}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-2xl shadow-sm border border-green-100">
          <p className="text-xs font-bold text-green-600 uppercase mb-1">Tomados</p>
          <p className="text-2xl font-bold text-green-700">{takenCount}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-2xl shadow-sm border border-red-100">
          <p className="text-xs font-bold text-red-600 uppercase mb-1">Perdidos</p>
          <p className="text-2xl font-bold text-red-700">{missedCount}</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-2xl shadow-sm border border-amber-100">
          <p className="text-xs font-bold text-amber-600 uppercase mb-1">Pendentes</p>
          <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-2xl shadow-sm border border-blue-100">
          <p className="text-xs font-bold text-blue-600 uppercase mb-1">Adesão</p>
          <p className="text-2xl font-bold text-blue-700">{adherenceRate}%</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Paciente</label>
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Pacientes</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Status</option>
              <option value={AdherenceStatus.TAKEN}>Tomado</option>
              <option value={AdherenceStatus.MISSED}>Não Tomado</option>
              <option value={AdherenceStatus.PENDING}>Pendente</option>
              <option value={AdherenceStatus.DELAYED}>Atrasado</option>
            </select>
          </div>


        </div>

        {(selectedPatient !== 'all' || selectedStatus !== 'all') && (
          <button
            onClick={() => {
              setSelectedPatient('all');
              setSelectedStatus('all');
            }}
            className="mt-4 text-sm font-semibold text-blue-600 hover:underline"
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Timeline de Histórico */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Timeline de Eventos</h3>
        
        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">Carregando histórico...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">Nenhum registro encontrado.</p>
            <p className="text-slate-400 text-sm mt-2">Ajuste os filtros para visualizar mais dados.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((record, idx) => (
              <div 
                key={record.id}
                className="relative pl-8 pb-6 border-l-2 border-slate-200 last:border-l-0 last:pb-0"
              >
                {/* Indicador na timeline */}
                <div className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full border-2 ${
                  record.status === AdherenceStatus.TAKEN ? 'bg-green-500 border-green-600' :
                  record.status === AdherenceStatus.MISSED ? 'bg-red-500 border-red-600' :
                  record.status === AdherenceStatus.PENDING ? 'bg-amber-500 border-amber-600' :
                  'bg-orange-500 border-orange-600'
                }`}></div>

                {/* Conteúdo do evento */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-slate-800">Medicação às {record.scheduledTime}</h4>
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold">Paciente:</span> {getPatientName(record.patientId)}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(record.status)} whitespace-nowrap`}>
                      {getStatusIcon(record.status)} {getStatusLabel(record.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Data</p>
                      <p className="font-semibold text-slate-700">{record.date}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Horário Agendado</p>
                      <p className="font-semibold text-slate-700">{record.scheduledTime}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botão de Exportação (preparado para futura implementação) */}
      <div className="flex justify-end">
        <button className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors shadow-lg">
          📊 Exportar Relatório (Em breve)
        </button>
      </div>
    </div>
  );
};

export default FullHistory;
