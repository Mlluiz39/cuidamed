-- =====================================================
-- CUIDAMED - SCHEMA DO SUPABASE
-- =====================================================
-- Este arquivo contém toda a estrutura do banco de dados
-- para o aplicativo CuidaMed
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA: users
-- Informações adicionais dos usuários/cuidadores
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: patients
-- Informações dos pacientes idosos
-- =====================================================
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age > 0 AND age < 150),
  phone TEXT,
  avatar TEXT,
  caregiver_name TEXT NOT NULL,
  caregiver_phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: medications
-- Medicamentos associados aos pacientes
-- =====================================================
CREATE TABLE IF NOT EXISTS public.medications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  times TEXT[] NOT NULL, -- Array de horários, ex: ['08:00', '20:00']
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: medication_history
-- Histórico de administração de medicamentos
-- =====================================================
CREATE TYPE adherence_status AS ENUM ('taken', 'missed', 'pending', 'delayed');

CREATE TABLE IF NOT EXISTS public.medication_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  medication_id UUID REFERENCES public.medications(id) ON DELETE SET NULL,
  medication_name TEXT NOT NULL, -- Armazenado separadamente caso o medicamento seja deletado
  scheduled_time TIME NOT NULL,
  actual_time TIME,
  status adherence_status NOT NULL DEFAULT 'pending',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: whatsapp_logs
-- Logs de comunicação via WhatsApp
-- =====================================================
CREATE TYPE message_type AS ENUM ('system', 'user', 'caregiver');
CREATE TYPE message_status AS ENUM ('pending', 'delivered', 'read', 'failed', 'error', 'success', 'alert');

CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  message_type message_type NOT NULL,
  message TEXT NOT NULL,
  status message_status NOT NULL DEFAULT 'pending',
  sent_to TEXT, -- Número de telefone do destinatário
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para patients
CREATE INDEX idx_patients_user_id ON public.patients(user_id);
CREATE INDEX idx_patients_name ON public.patients(name);

-- Índices para medications
CREATE INDEX idx_medications_patient_id ON public.medications(patient_id);
CREATE INDEX idx_medications_active ON public.medications(active);

-- Índices para medication_history
CREATE INDEX idx_medication_history_patient_id ON public.medication_history(patient_id);
CREATE INDEX idx_medication_history_medication_id ON public.medication_history(medication_id);
CREATE INDEX idx_medication_history_date ON public.medication_history(date DESC);
CREATE INDEX idx_medication_history_status ON public.medication_history(status);
CREATE INDEX idx_medication_history_patient_date ON public.medication_history(patient_id, date DESC);

-- Índices para whatsapp_logs
CREATE INDEX idx_whatsapp_logs_patient_id ON public.whatsapp_logs(patient_id);
CREATE INDEX idx_whatsapp_logs_sent_at ON public.whatsapp_logs(sent_at DESC);

-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medications_updated_at
  BEFORE UPDATE ON public.medications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medication_history_updated_at
  BEFORE UPDATE ON public.medication_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNÇÃO: Calcular taxa de adesão do paciente
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_patient_adherence(patient_uuid UUID, days_back INTEGER DEFAULT 7)
RETURNS NUMERIC AS $$
DECLARE
  total_count INTEGER;
  taken_count INTEGER;
  adherence_rate NUMERIC;
BEGIN
  -- Contar total de registros nos últimos N dias
  SELECT COUNT(*) INTO total_count
  FROM public.medication_history
  WHERE patient_id = patient_uuid
    AND date >= CURRENT_DATE - days_back;
  
  -- Se não há registros, retorna 0
  IF total_count = 0 THEN
    RETURN 0;
  END IF;
  
  -- Contar medicamentos tomados
  SELECT COUNT(*) INTO taken_count
  FROM public.medication_history
  WHERE patient_id = patient_uuid
    AND date >= CURRENT_DATE - days_back
    AND status = 'taken';
  
  -- Calcular taxa de adesão
  adherence_rate := (taken_count::NUMERIC / total_count::NUMERIC) * 100;
  
  RETURN ROUND(adherence_rate, 0);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS: users
-- =====================================================

-- Usuários podem ver apenas seus próprios dados
CREATE POLICY "Users can view own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Usuários podem atualizar apenas seus próprios dados
CREATE POLICY "Users can update own data"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Usuários podem inserir seus próprios dados
CREATE POLICY "Users can insert own data"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- POLÍTICAS RLS: patients
-- =====================================================

-- Usuários podem ver apenas seus próprios pacientes
CREATE POLICY "Users can view own patients"
  ON public.patients FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem criar pacientes
CREATE POLICY "Users can create patients"
  ON public.patients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios pacientes
CREATE POLICY "Users can update own patients"
  ON public.patients FOR UPDATE
  USING (auth.uid() = user_id);

-- Usuários podem deletar seus próprios pacientes
CREATE POLICY "Users can delete own patients"
  ON public.patients FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS RLS: medications
-- =====================================================

-- Usuários podem ver medicamentos de seus pacientes
CREATE POLICY "Users can view medications of own patients"
  ON public.medications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = medications.patient_id
        AND patients.user_id = auth.uid()
    )
  );

-- Usuários podem criar medicamentos para seus pacientes
CREATE POLICY "Users can create medications for own patients"
  ON public.medications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = medications.patient_id
        AND patients.user_id = auth.uid()
    )
  );

-- Usuários podem atualizar medicamentos de seus pacientes
CREATE POLICY "Users can update medications of own patients"
  ON public.medications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = medications.patient_id
        AND patients.user_id = auth.uid()
    )
  );

-- Usuários podem deletar medicamentos de seus pacientes
CREATE POLICY "Users can delete medications of own patients"
  ON public.medications FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = medications.patient_id
        AND patients.user_id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS RLS: medication_history
-- =====================================================

-- Usuários podem ver histórico de seus pacientes
CREATE POLICY "Users can view history of own patients"
  ON public.medication_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = medication_history.patient_id
        AND patients.user_id = auth.uid()
    )
  );

-- Usuários podem criar histórico para seus pacientes
CREATE POLICY "Users can create history for own patients"
  ON public.medication_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = medication_history.patient_id
        AND patients.user_id = auth.uid()
    )
  );

-- Usuários podem atualizar histórico de seus pacientes
CREATE POLICY "Users can update history of own patients"
  ON public.medication_history FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = medication_history.patient_id
        AND patients.user_id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS RLS: whatsapp_logs
-- =====================================================

-- Usuários podem ver logs de seus pacientes
CREATE POLICY "Users can view logs of own patients"
  ON public.whatsapp_logs FOR SELECT
  USING (
    patient_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = whatsapp_logs.patient_id
        AND patients.user_id = auth.uid()
    )
  );

-- Usuários podem criar logs para seus pacientes
CREATE POLICY "Users can create logs for own patients"
  ON public.whatsapp_logs FOR INSERT
  WITH CHECK (
    patient_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = whatsapp_logs.patient_id
        AND patients.user_id = auth.uid()
    )
  );

-- =====================================================
-- FIM DO SCHEMA
-- =====================================================
