import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { usePatients } from '../hooks/useSupabaseData';
import PatientModal from './PatientModal';
import { useToast } from '../contexts/ToastContext';
import { useConfirmationModal } from '../contexts/ConfirmationModalContext';
import { Patient } from '../types';

interface PatientListProps {
  onViewHistory?: (patientId: string) => void;
}

const PatientList: React.FC<PatientListProps> = ({ onViewHistory }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const { addToast } = useToast();
  const { confirmModal } = useConfirmationModal();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  const { patients, loading, error, refetch } = usePatients(userId);

  const handleEdit = (patient: Patient) => {
    setPatientToEdit(patient);
    setIsModalOpen(true);
    setMenuOpenId(null);
  };

  const handleNewPatient = () => {
    setPatientToEdit(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (patient: Patient) => {
    setMenuOpenId(null);
    const confirmed = await confirmModal({
      title: 'Excluir Paciente',
      message: `Tem certeza que deseja excluir o paciente ${patient.name}? Isso removerá todos os medicamentos e históricos associados.`,
      confirmText: 'Excluir Definitivamente',
      type: 'danger'
    });

    if (confirmed) {
      try {
        // Excluir medicamentos primeiro para evitar FK errors se não tiver cascade setado no banco
        // Nota: Assumindo que o banco tem ON DELETE CASCADE para simplificar, se não tiver precisaria deletar filhos manual
        const { error } = await supabase.from('patients').delete().eq('id', patient.id);
        
        if (error) throw error;
        
        addToast('Paciente excluído com sucesso.', 'success');
        refetch();
      } catch (error) {
        console.error('Erro ao excluir:', error);
        addToast('Erro ao excluir paciente. Pode haver registros vinculados.', 'error');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Pacientes</h2>
          <p className="text-slate-500">Gerencie os idosos sob seus cuidados.</p>
        </div>
        <button 
          onClick={handleNewPatient}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
        >
          + Novo Paciente
        </button>
      </div>

      <PatientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={refetch} 
        patientToEdit={patientToEdit}
      />

      {loading ? (
        <div className="text-center py-20">
          <p className="text-slate-400">Carregando pacientes...</p>
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-red-500">Erro ao carregar pacientes: {error}</p>
        </div>
      ) : patients.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-400">Nenhum paciente cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {patients.map((patient) => (
          <div key={patient.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-visible hover:shadow-md transition-shadow relative">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <img src={patient.avatar} alt={patient.name} className="w-16 h-16 rounded-full object-cover border-2 border-blue-50" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800">{patient.name}</h3>
                  <p className="text-slate-500 text-sm">{patient.age} anos • {patient.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase">Adesão</p>
                  <p className={`text-2xl font-black ${patient.lastAdherence > 80 ? 'text-green-500' : 'text-amber-500'}`}>
                    {patient.lastAdherence}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Responsável</p>
                  <p className="text-sm font-semibold text-slate-700">{patient.caregiverName}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Contato Urgência</p>
                  <p className="text-sm font-semibold text-slate-700">{patient.caregiverPhone}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button 
                  onClick={() => onViewHistory && onViewHistory(patient.id)}
                  className="flex-1 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors"
                >
                  Ver Prontuário
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setMenuOpenId(menuOpenId === patient.id ? null : patient.id)}
                    className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                     ⚙️
                  </button>
                  
                  {menuOpenId === patient.id && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-10 overflow-hidden animate-fadeIn">
                      <button 
                        onClick={() => handleEdit(patient)}
                        className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        ✏️ Editar Dados
                      </button>
                      <button 
                        onClick={() => handleDelete(patient)}
                        className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        🗑️ Excluir Paciente
                      </button>
                    </div>
                  )}
                  {/* Backdrop invisível para fechar menu ao clicar fora */}
                  {menuOpenId === patient.id && (
                    <div 
                      className="fixed inset-0 z-0 bg-transparent cursor-default" 
                      onClick={() => setMenuOpenId(null)}
                      style={{ pointerEvents: 'auto' }}
                    ></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
};

export default PatientList;
