import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useToast } from '../contexts/ToastContext';
import { Patient } from '../types';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patientToEdit?: Patient | null;
}

const PatientModal: React.FC<PatientModalProps> = ({ isOpen, onClose, onSuccess, patientToEdit }) => {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    phone: '',
    caregiverName: '',
    caregiverPhone: '',
  });

  useEffect(() => {
    if (isOpen && patientToEdit) {
      setFormData({
        name: patientToEdit.name,
        age: patientToEdit.age.toString(),
        phone: patientToEdit.phone || '',
        caregiverName: patientToEdit.caregiverName,
        caregiverPhone: patientToEdit.caregiverPhone,
      });
    } else if (isOpen && !patientToEdit) {
      // Limpar form se for novo cadastro
      setFormData({
        name: '',
        age: '',
        phone: '',
        caregiverName: '',
        caregiverPhone: '',
      });
    }
  }, [isOpen, patientToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Usuário não autenticado');

      const ageInt = parseInt(formData.age);
      if (isNaN(ageInt)) {
        throw new Error('Idade inválida');
      }

      if (patientToEdit) {
        // Atualizar
        const { error } = await supabase
          .from('patients')
          .update({
            name: formData.name,
            age: ageInt,
            phone: formData.phone,
            caregiver_name: formData.caregiverName,
            caregiver_phone: formData.caregiverPhone,
          })
          .eq('id', patientToEdit.id);

        if (error) throw error;
        addToast('Paciente atualizado com sucesso!', 'success');
      } else {
        // Inserir
        const { error } = await supabase
          .from('patients')
          .insert({
            user_id: user.id,
            name: formData.name,
            age: ageInt,
            phone: formData.phone,
            caregiver_name: formData.caregiverName,
            caregiver_phone: formData.caregiverPhone,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`,
          });

        if (error) {
          if (error.code === '23503') {
             // Lógica de auto-fix para FK (mantida simplificada para brevidade, mas idealmente reutilizável)
             console.log('Tentando auto-fix de usuário...');
             const { error: userError } = await supabase.from('users').insert({
                id: user.id,
                email: user.email,
                name: user.email?.split('@')[0] || 'Usuário',
                created_at: new Date().toISOString(),
             });
             if (userError && userError.code !== '23505') throw userError;

             // Retry
             const { error: retryError } = await supabase.from('patients').insert({
                user_id: user.id,
                name: formData.name,
                age: ageInt,
                phone: formData.phone,
                caregiver_name: formData.caregiverName,
                caregiver_phone: formData.caregiverPhone,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`,
             });
             if (retryError) throw retryError;
          } else {
             throw error;
          }
        }
        addToast('Paciente cadastrado com sucesso!', 'success');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar paciente:', error);
      addToast(`Erro ao salvar paciente: ${error.message || 'Erro desconhecido'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-slate-800 mb-6">
          {patientToEdit ? 'Editar Paciente' : 'Novo Paciente'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wide">Dados do Paciente</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do paciente"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Idade *</label>
                <input
                  type="number"
                  required
                  value={formData.age}
                  onChange={e => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="anos"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Telefone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(99) 99999-9999"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-4">
            <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wide">Dados do Cuidador / Responsável</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nome do Responsável *</label>
                <input
                  type="text"
                  required
                  value={formData.caregiverName}
                  onChange={e => setFormData({ ...formData, caregiverName: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do cuidador ou familiar"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Telefone de Contato (WhatsApp) *</label>
                <input
                  type="tel"
                  required
                  value={formData.caregiverPhone}
                  onChange={e => setFormData({ ...formData, caregiverPhone: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(99) 99999-9999"
                />
                <p className="text-xs text-slate-400 mt-1">Este número receberá os alertas do sistema.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : (patientToEdit ? 'Atualizar Paciente' : 'Cadastrar Paciente')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientModal;
