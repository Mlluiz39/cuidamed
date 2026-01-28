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
    birthDate: '',
    phone: '',
    caregiverName: '',
    caregiverPhone: '',
  });

  useEffect(() => {
    if (isOpen && patientToEdit) {
      setFormData({
        name: patientToEdit.name,
        birthDate: patientToEdit.birthDate || '',
        phone: patientToEdit.phone || '',
        caregiverName: patientToEdit.caregiverName || '',
        caregiverPhone: patientToEdit.caregiverPhone || '',
      });
    } else if (isOpen && !patientToEdit) {
      setFormData({
        name: '',
        birthDate: '',
        phone: '',
        caregiverName: '',
        caregiverPhone: '',
      });
    }
  }, [isOpen, patientToEdit]);

  if (!isOpen) return null;

  const ensureOrganizationExists = async (userId: string, userEmail?: string) => {
    try {
      // Verificar se a organização existe
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', userId)
        .single();

      if (existingOrg) {
        return true; // Organização já existe
      }

      // Criar organização se não existir
      const { error: orgError } = await supabase
        .from('organizations')
        .insert({
          id: userId,
          name: userEmail?.split('@')[0] || 'Minha Organização',
          created_at: new Date().toISOString(),
        });

      if (orgError) {
        // Se erro 23505 (duplicate key), a organização já existe, está tudo bem
        if (orgError.code === '23505') {
          return true;
        }
        throw orgError;
      }

      return true;
    } catch (error) {
      console.error('Erro ao criar organização:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Usuário não autenticado');

      if (!formData.birthDate) {
        throw new Error('Data de nascimento é obrigatória');
      }

      if (patientToEdit) {
        // ATUALIZAR
        const { error } = await supabase
          .from('patients')
          .update({
            name: formData.name,
            birth_date: formData.birthDate,
            phone: formData.phone || null,
            caregiver_name: formData.caregiverName,
            caregiver_phone: formData.caregiverPhone,
          })
          .eq('id', patientToEdit.id);

        if (error) throw error;
        addToast('Paciente atualizado com sucesso!', 'success');
      } else {
        // INSERIR NOVO
        // Garantir que a organização existe antes de inserir
        await ensureOrganizationExists(user.id, user.email);

        const { error } = await supabase
          .from('patients')
          .insert({
            organization_id: user.id,
            name: formData.name,
            birth_date: formData.birthDate,
            phone: formData.phone || null,
            caregiver_name: formData.caregiverName,
            caregiver_phone: formData.caregiverPhone,
            active: true,
            timezone: 'America/Sao_Paulo',
          });

        if (error) throw error;
        addToast('Paciente cadastrado com sucesso!', 'success');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar paciente:', error);
      const errorMessage = error.message || error.hint || 'Erro desconhecido';
      addToast(`Erro ao salvar paciente: ${errorMessage}`, 'error');
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
              
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Data de Nascimento *</label>
                <input
                  type="date"
                  required
                  value={formData.birthDate}
                  onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="col-span-2">
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