import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function PatientApproval() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchPendingPatients();
    
    // Atualiza a cada 10 segundos
    const interval = setInterval(fetchPendingPatients, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchPendingPatients() {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
    } finally {
      setLoading(false);
    }
  }

  async function activatePatient(patientId, patientName) {
    setActivating(patientId);
    setMessage(null);
    
    try {
      const { error } = await supabase
        .from('patients')
        .update({ status: 'active' })
        .eq('id', patientId);
      
      if (error) throw error;
      
      setMessage({
        type: 'success',
        text: `Paciente ${patientName} ativado com sucesso!`
      });
      
      fetchPendingPatients();
      
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Erro ao ativar paciente: ${error.message}`
      });
    } finally {
      setActivating(null);
    }
  }

  async function rejectPatient(patientId) {
    if (!confirm('Tem certeza que deseja rejeitar este paciente?')) return;
    
    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId);
      
      if (error) throw error;
      
      fetchPendingPatients();
      setMessage({
        type: 'success',
        text: 'Paciente rejeitado e removido.'
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Erro ao rejeitar: ${error.message}`
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Carregando pacientes...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Aprovação de Pacientes
            </h2>
            <p className="text-gray-600 mt-1">
              Pacientes aguardando ativação para receber alertas
            </p>
          </div>
          <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-semibold">
            {patients.length} pendente{patients.length !== 1 ? 's' : ''}
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {patients.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-4 text-gray-500">Nenhum paciente pendente de aprovação.</p>
            <p className="text-sm text-gray-400 mt-1">
              Quando um novo paciente enviar /start no bot, ele aparecerá aqui.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>💡 Dica:</strong> Certifique-se de ativar apenas pacientes que têm ID do Telegram cadastrado. 
                Pacientes sem ID do Telegram não receberão mensagens no bot.
              </p>
            </div>
            
            {patients.some(p => !p.telegram_id) && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm font-semibold">
                  ⚠️ Atenção: Existem pacientes sem ID do Telegram! 
                  Eles não receberão mensagens mesmo após a ativação.
                </p>
              </div>
            )}
          </>
        )}
        
        {patients.length > 0 && (
          <div className="space-y-4">
            {patients.map((patient) => (
              <div 
                key={patient.id} 
                className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                  patient.telegram_id 
                    ? 'border-gray-200 bg-white' 
                    : 'border-red-300 bg-red-50'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {patient.name}
                      </h3>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        Pendente
                      </span>
                      {!patient.telegram_id && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-bold">
                          ⚠️ Sem Telegram ID
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        ID Telegram: <code className="bg-gray-100 px-2 py-0.5 rounded">{patient.telegram_id}</code>
                      </p>
                      <p className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Cadastrado em: {new Date(patient.created_at).toLocaleString('pt-BR')}
                      </p>
                      {patient.username && (
                        <p className="flex items-center gap-2 text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Username: @{patient.username}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {!patient.telegram_id && (
                      <p className="text-xs text-red-600 mb-1">
                        ❌ Este paciente não tem ID do Telegram cadastrado e não receberá mensagens!
                      </p>
                    )}
                    <div className="flex gap-2">
                    <button
                      onClick={() => activatePatient(patient.id, patient.name)}
                      disabled={activating === patient.id || !patient.telegram_id}
                      title={!patient.telegram_id ? 'Não é possível ativar sem ID do Telegram' : ''}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        activating === patient.id || !patient.telegram_id
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-green-500 hover:bg-green-600 text-white shadow-sm hover:shadow'
                      }`}
                    >
                      {activating === patient.id ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Ativando...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Ativar
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => rejectPatient(patient.id)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Rejeitar paciente"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
