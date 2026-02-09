
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../services/supabaseClient';
import { AdherenceStatus } from '../types';
import { useDashboardStats, useMedicationHistory, usePatients } from '../hooks/useSupabaseData';

interface DashboardProps {
  onViewAllAlerts?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onViewAllAlerts }) => {
  const [userId, setUserId] = useState<string | null>(null);

  // Buscar usuário autenticado
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Hooks para buscar dados
  const { stats, loading: loadingStats } = useDashboardStats(userId);
  const { patients } = usePatients(userId);
  const patientIds = patients.map(p => p.id);
  const { history, loading: loadingHistory } = useMedicationHistory({ patientIds });

  // Dados para o gráfico (exemplo com dados estáticos, pode ser calculado do histórico)
  const chartData = [
    { name: 'Seg', taken: 40, missed: 5 },
    { name: 'Ter', taken: 45, missed: 2 },
    { name: 'Qua', taken: 38, missed: 8 },
    { name: 'Qui', taken: 42, missed: 4 },
    { name: 'Sex', taken: 48, missed: 1 },
    { name: 'Sab', taken: 35, missed: 10 },
    { name: 'Dom', taken: 44, missed: 3 },
  ];

  const recentAlerts = history.filter(
    h => h.status === AdherenceStatus.MISSED || h.status === AdherenceStatus.PENDING
  ).slice(0, 5);

  const statsDisplay = [
    { label: 'Pacientes Ativos', value: loadingStats ? '...' : stats.activePatients.toString(), icon: '👥', color: 'bg-blue-500' },
    { label: 'Adesão Média', value: loadingStats ? '...' : `${stats.adherenceRate}%`, icon: '📈', color: 'bg-green-500' },
    { label: 'Alertas Pendentes', value: loadingStats ? '...' : stats.pendingAlerts.toString(), icon: '⚠️', color: 'bg-amber-500' },
    { label: 'Meds Hoje', value: loadingStats ? '...' : stats.medicationsToday.toString(), icon: '💊', color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      <header>
        <h2 className="text-2xl font-bold text-slate-800">Bem-vindo, Administrador</h2>
        <p className="text-slate-500">Aqui está o resumo dos cuidados de hoje.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsDisplay.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center text-2xl text-white`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Adesão Semanal Coletiva</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                  cursor={{fill: '#f8fafc'}}
                />
                <Bar dataKey="taken" name="Tomados" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="missed" name="Não Tomados" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Alertas Críticos</h3>
          <div className="space-y-4 flex-1">
            {loadingHistory ? (
              <div className="text-center py-10">
                <p className="text-slate-400">Carregando alertas...</p>
              </div>
            ) : recentAlerts.length > 0 ? (
              recentAlerts.map((alert) => {
                const patient = patients.find(p => p.id === alert.patientId);
                return (
                  <div key={alert.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">
                      !
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {patient?.name || 'Paciente desconhecido'}
                      </p>
                       <p className="text-xs text-slate-500">Medicamento às {alert.scheduledTime}</p>
                      <button className="mt-2 text-xs font-bold text-blue-600 hover:underline">
                        Enviar Lembrete Manual
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10">
                <p className="text-slate-400">Nenhum alerta crítico no momento.</p>
              </div>
            )}
          </div>
          <button 
            onClick={onViewAllAlerts}
            className="mt-4 w-full py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Ver Todos Alertas
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
