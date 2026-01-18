import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Patient, Medication, HistoryRecord, DashboardStats, AdherenceStatus } from '../types';

// Hook para buscar pacientes
export function usePatients(userId: string | null) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = async () => {
    if (!userId) {
      setPatients([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (supabaseError) throw supabaseError;

      // Mapear dados do Supabase para o tipo Patient
      const mappedPatients: Patient[] = (data || []).map(p => ({
        id: p.id,
        name: p.name,
        age: p.age,
        phone: p.phone || '',
        avatar: p.avatar || `https://picsum.photos/seed/${p.id}/200/200`,
        caregiverName: p.caregiver_name,
        caregiverPhone: p.caregiver_phone,
        lastAdherence: 0, // Será calculado depois
      }));

      setPatients(mappedPatients);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pacientes');
      console.error('Erro ao buscar pacientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [userId]);

  return { patients, loading, error, refetch: fetchPatients };
}

// Hook para buscar medicamentos
export function useMedications(patientId?: string) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMedications = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('medications')
        .select('*')
        .eq('active', true)
        .order('name');

      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      const { data, error: supabaseError } = await query;

      if (supabaseError) throw supabaseError;

      // Mapear dados do Supabase para o tipo Medication
      const mappedMedications: Medication[] = (data || []).map(m => ({
        id: m.id,
        patientId: m.patient_id,
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        times: m.times || [],
        active: m.active,
      }));

      setMedications(mappedMedications);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar medicamentos');
      console.error('Erro ao buscar medicamentos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, [patientId]);

  return { medications, loading, error, refetch: fetchMedications };
}

// Hook para buscar histórico de medicamentos
interface HistoryFilters {
  patientId?: string;
  startDate?: string;
  endDate?: string;
  status?: AdherenceStatus;
}

export function useMedicationHistory(filters: HistoryFilters = {}) {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('medication_history')
        .select('*')
        .order('date', { ascending: false })
        .order('scheduled_time', { ascending: false });

      if (filters.patientId) {
        query = query.eq('patient_id', filters.patientId);
      }
      if (filters.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('date', filters.endDate);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error: supabaseError } = await query;

      if (supabaseError) throw supabaseError;

      // Mapear dados do Supabase para o tipo HistoryRecord
      const mappedHistory: HistoryRecord[] = (data || []).map(h => ({
        id: h.id,
        patientId: h.patient_id,
        medicationName: h.medication_name,
        scheduledTime: h.scheduled_time,
        actualTime: h.actual_time || undefined,
        status: h.status as AdherenceStatus,
        date: h.date,
      }));

      setHistory(mappedHistory);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar histórico');
      console.error('Erro ao buscar histórico:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filters.patientId, filters.startDate, filters.endDate, filters.status]);

  return { history, loading, error, refetch: fetchHistory };
}

// Hook para estatísticas do dashboard
export function useDashboardStats(userId: string | null) {
  const [stats, setStats] = useState<DashboardStats>({
    activePatients: 0,
    adherenceRate: 0,
    pendingAlerts: 0,
    medicationsToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Buscar pacientes ativos
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', userId);

      if (patientsError) throw patientsError;

      const patientIds = (patients || []).map(p => p.id);
      const activePatients = patientIds.length;

      if (activePatients === 0) {
        setStats({
          activePatients: 0,
          adherenceRate: 0,
          pendingAlerts: 0,
          medicationsToday: 0,
        });
        setLoading(false);
        return;
      }

      // Buscar histórico dos últimos 7 dias
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);

      const { data: history, error: historyError } = await supabase
        .from('medication_history')
        .select('*')
        .in('patient_id', patientIds)
        .gte('date', sevenDaysAgo.toISOString().split('T')[0]);

      if (historyError) throw historyError;

      // Calcular adesão média
      const totalRecords = history?.length || 0;
      const takenRecords = history?.filter(h => h.status === 'taken').length || 0;
      const adherenceRate = totalRecords > 0 ? Math.round((takenRecords / totalRecords) * 100) : 0;

      // Contar alertas pendentes (hoje)
      const todayStr = today.toISOString().split('T')[0];
      const pendingAlerts = history?.filter(
        h => h.date === todayStr && (h.status === 'missed' || h.status === 'pending')
      ).length || 0;

      // Buscar medicamentos de hoje
      const { data: medications, error: medsError } = await supabase
        .from('medications')
        .select('times')
        .in('patient_id', patientIds)
        .eq('active', true);

      if (medsError) throw medsError;

      const medicationsToday = medications?.reduce((sum, med) => sum + (med.times?.length || 0), 0) || 0;

      setStats({
        activePatients,
        adherenceRate,
        pendingAlerts,
        medicationsToday,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
      console.error('Erro ao buscar estatísticas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [userId]);

  return { stats, loading, error, refetch: fetchStats };
}

// Hook para buscar logs do WhatsApp
export interface WhatsAppLog {
  id: string;
  patient_id: string | null;
  message_type: 'system' | 'user' | 'caregiver';
  message: string;
  status: 'pending' | 'delivered' | 'read' | 'failed' | 'error' | 'success' | 'alert';
  sent_to: string | null;
  sent_at: string;
  delivered_at: string | null;
  created_at: string;
}

export function useWhatsAppLogs(userId: string | null) {
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    if (!userId) {
      setLogs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Buscar pacientes do usuário primeiro para filtrar logs
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', userId);

      if (patientsError) throw patientsError;

      const patientIds = (patients || []).map(p => p.id);

      if (patientIds.length === 0) {
        setLogs([]);
        setLoading(false);
        return;
      }

      // Buscar logs relacionados aos pacientes do usuário
      const { data, error: logsError } = await supabase
        .from('whatsapp_logs')
        .select('*')
        .or(`patient_id.in.(${patientIds.join(',')}),patient_id.is.null`)
        .order('sent_at', { ascending: false })
        .limit(50);

      if (logsError) throw logsError;

      setLogs(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar logs do WhatsApp');
      console.error('Erro ao buscar logs do WhatsApp:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [userId]);

  return { logs, loading, error, refetch: fetchLogs };
}
