
import { createClient } from '@supabase/supabase-js';

// Validar variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variáveis de ambiente do Supabase não configuradas. ' +
    'Certifique-se de ter VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.local'
  );
}

// Criar e exportar cliente do Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// =====================================================
// TIPOS PARA O SUPABASE (Database Types)
// =====================================================

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      patients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          age: number;
          phone: string | null;
          avatar: string | null;
          caregiver_name: string;
          caregiver_phone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          age: number;
          phone?: string | null;
          avatar?: string | null;
          caregiver_name: string;
          caregiver_phone: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          age?: number;
          phone?: string | null;
          avatar?: string | null;
          caregiver_name?: string;
          caregiver_phone?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      medications: {
        Row: {
          id: string;
          patient_id: string;
          name: string;
          dosage: string;
          frequency: string;
          times: string[];
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          name: string;
          dosage: string;
          frequency: string;
          times: string[];
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          name?: string;
          dosage?: string;
          frequency?: string;
          times?: string[];
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      medication_history: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          medication_id: string | null;
          scheduled_time: string;
          scheduled_minutes: number;
          status: 'taken' | 'missed' | 'pending' | 'delayed';
          date: string;
          unique_id: string | null;
          short_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          medication_id?: string | null;
          scheduled_time: string;
          scheduled_minutes: number;
          status?: 'taken' | 'missed' | 'pending' | 'delayed';
          date?: string;
          unique_id?: string | null;
          short_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string;
          medication_id?: string | null;
          scheduled_time?: string;
          scheduled_minutes?: number;
          status?: 'taken' | 'missed' | 'pending' | 'delayed';
          date?: string;
          unique_id?: string | null;
          short_id?: string | null;
          created_at?: string;
        };
      };
      whatsapp_logs: {
        Row: {
          id: string;
          patient_id: string | null;
          message_type: 'system' | 'user' | 'caregiver';
          message: string;
          status: 'pending' | 'delivered' | 'read' | 'failed' | 'error' | 'success' | 'alert';
          sent_to: string | null;
          sent_at: string;
          delivered_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id?: string | null;
          message_type: 'system' | 'user' | 'caregiver';
          message: string;
          status?: 'pending' | 'delivered' | 'read' | 'failed' | 'error' | 'success' | 'alert';
          sent_to?: string | null;
          sent_at?: string;
          delivered_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string | null;
          message_type?: 'system' | 'user' | 'caregiver';
          message?: string;
          status?: 'pending' | 'delivered' | 'read' | 'failed' | 'error' | 'success' | 'alert';
          sent_to?: string | null;
          sent_at?: string;
          delivered_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      calculate_patient_adherence: {
        Args: {
          patient_uuid: string;
          days_back?: number;
        };
        Returns: number;
      };
    };
    Enums: {
      adherence_status: 'taken' | 'missed' | 'pending' | 'delayed';
      message_type: 'system' | 'user' | 'caregiver';
      message_status: 'pending' | 'delivered' | 'read' | 'failed' | 'error' | 'success' | 'alert';
    };
  };
};
