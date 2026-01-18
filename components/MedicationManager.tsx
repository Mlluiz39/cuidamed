
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { usePatients, useMedications } from '../hooks/useSupabaseData';
import { Medication } from '../types';

import { useToast } from '../contexts/ToastContext';
import { useConfirmationModal } from '../contexts/ConfirmationModalContext';

const MedicationManager: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<string>('all');
  const [formData, setFormData] = useState<Partial<Medication>>({
    patientId: '',
    name: '',
    dosage: '',
    frequency: '',
    times: [],
    active: true
  });

  const { addToast } = useToast();
  const { confirmModal } = useConfirmationModal();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  const { patients } = usePatients(userId);
  const { medications, loading, refetch } = useMedications(selectedPatient === 'all' ? undefined : selectedPatient);

  const filteredMedications = selectedPatient === 'all' 
    ? medications 
    : medications.filter(m => m.patientId === selectedPatient);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        // Editar medicamento existente
        const { error } = await supabase
          .from('medications')
          .update({
            patient_id: formData.patientId,
            name: formData.name,
            dosage: formData.dosage,
            frequency: formData.frequency,
            times: formData.times,
            active: formData.active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (error) throw error;
        setEditingId(null);
        addToast('Medicamento atualizado com sucesso!', 'success');
      } else {
        // Adicionar novo medicamento
        const { error } = await supabase
          .from('medications')
          .insert({
            patient_id: formData.patientId,
            name: formData.name,
            dosage: formData.dosage,
            frequency: formData.frequency,
            times: formData.times,
            active: formData.active ?? true,
          });

        if (error) throw error;
        setIsAddingNew(false);
        addToast('Medicamento adicionado com sucesso!', 'success');
      }
      
      // Atualizar lista
      refetch();
      
      // Reset form
      setFormData({
        patientId: '',
        name: '',
        dosage: '',
        frequency: '',
        times: [],
        active: true
      });
    } catch (error) {
      console.error('Erro ao salvar medicamento:', error);
      addToast('Erro ao salvar medicamento. Tente novamente.', 'error');
    }
  };

  const handleEdit = (med: Medication) => {
    setFormData(med);
    setEditingId(med.id);
    setIsAddingNew(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmModal({
      title: 'Excluir Medicamento',
      message: 'Tem certeza que deseja excluir permanentemente este medicamento? Esta ação não pode ser desfeita e removerá os agendamentos.',
      confirmText: 'Sim, Excluir',
      cancelText: 'Cancelar',
      type: 'danger'
    });

    if (confirmed) {
      try {
        const { error } = await supabase
          .from('medications')
          .delete()
          .eq('id', id);

        if (error) {
          // Se erro for de chave estrangeira (tem histórico), oferecer arquivar
          if (error.code === '23503') {
             const shouldArchive = await confirmModal({
               title: 'Não é possível excluir',
               message: 'Este medicamento possui histórico registrado e não pode ser excluído permanentemente. Deseja arquivá-lo (desativar) em vez disso?',
               confirmText: 'Arquivar',
               cancelText: 'Cancelar',
               type: 'warning'
             });

             if (shouldArchive) {
                const { error: archiveError } = await supabase
                  .from('medications')
                  .update({ active: false })
                  .eq('id', id);
                
                if (archiveError) throw archiveError;
                addToast('Medicamento arquivado com sucesso.', 'info');
                refetch();
                return;
             }
          }
          throw error;
        }
        addToast('Medicamento excluído com sucesso.', 'success');
        refetch();
      } catch (error) {
        console.error('Erro ao excluir medicamento:', error);
        addToast('Erro ao excluir medicamento.', 'error');
      }
    }
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingId(null);
    setFormData({
      patientId: '',
      name: '',
        dosage: '',
      frequency: '',
      times: [],
      active: true
    });
  };

  const getPatientName = (patientId: string) => {
    return patients.find(p => p.id === patientId)?.name || 'Desconhecido';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Medicamentos</h2>
          <p className="text-slate-500">Gerencie os medicamentos de todos os pacientes.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <select 
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-slate-200 rounded-xl bg-white text-slate-700 font-medium text-sm"
          >
            <option value="all">Todos os Pacientes</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button 
            onClick={() => setIsAddingNew(true)}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 whitespace-nowrap"
          >
            + Novo Medicamento
          </button>
        </div>
      </div>

      {/* Formulário de Adicionar/Editar */}
      {isAddingNew && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">
            {editingId ? 'Editar Medicamento' : 'Novo Medicamento'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Paciente *</label>
                <select
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um paciente</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nome do Medicamento *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Ex: Losartana 50mg"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Dosagem *</label>
                <input
                  type="text"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  required
                  placeholder="Ex: 1 comprimido"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Frequência *</label>
                <input
                  type="text"
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  required
                  placeholder="Ex: 2 vezes ao dia"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Horários *</label>
                <div className="space-y-3">
                  {(formData.times || []).map((time, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => {
                          const newTimes = [...(formData.times || [])];
                          newTimes[index] = e.target.value;
                          setFormData({ ...formData, times: newTimes });
                        }}
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newTimes = (formData.times || []).filter((_, i) => i !== index);
                          setFormData({ ...formData, times: newTimes });
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remover horário"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, times: [...(formData.times || []), '08:00'] });
                    }}
                    className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    + Adicionar Horário
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">Adicione todos os horários que o paciente deve tomar este medicamento.</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="active" className="text-sm font-semibold text-slate-700">
                  Medicamento Ativo
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                {editingId ? 'Salvar Alterações' : 'Adicionar Medicamento'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Medicamentos */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
            <p className="text-slate-400 text-lg">Carregando medicamentos...</p>
          </div>
        ) : filteredMedications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
            <p className="text-slate-400 text-lg">Nenhum medicamento encontrado.</p>
            <p className="text-slate-400 text-sm mt-2">Adicione um novo medicamento para começar.</p>
          </div>
        ) : (
          filteredMedications.map((med) => (
            <div 
              key={med.id} 
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-slate-800">{med.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      med.active 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {med.active ? '✓ Ativo' : '○ Inativo'}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm mb-3">
                    <span className="font-semibold text-slate-700">Paciente:</span> {getPatientName(med.patientId)}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Dosagem</p>
                      <p className="text-sm font-semibold text-slate-700">{med.dosage}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Frequência</p>
                      <p className="text-sm font-semibold text-slate-700">{med.frequency}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Horários</p>
                      <p className="text-sm font-semibold text-slate-700">{med.times.join(', ')}</p>
                    </div>
                  </div>
                </div>
                <div className="flex md:flex-col gap-2">
                  <button 
                    onClick={() => handleEdit(med)}
                    className="flex-1 md:flex-none px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors"
                  >
                    ✏️ Editar
                  </button>
                  <button 
                    onClick={() => handleDelete(med.id)}
                    className="flex-1 md:flex-none px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
                  >
                    🗑️ Excluir
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MedicationManager;
