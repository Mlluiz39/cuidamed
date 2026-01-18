-- =====================================================
-- CUIDAMED - DADOS DE EXEMPLO (SEED)
-- =====================================================
-- Este arquivo contém dados de exemplo para popular o banco
-- APENAS PARA DESENVOLVIMENTO E TESTES
-- =====================================================

-- NOTA: Você precisará substituir os UUIDs de usuário pelos IDs reais
-- após criar as contas no Supabase Auth

-- =====================================================
-- SEED: patients
-- =====================================================
-- Substitua 'SEU_USER_ID_AQUI' pelo UUID real do usuário autenticado

INSERT INTO public.patients (id, user_id, name, age, phone, avatar, caregiver_name, caregiver_phone) VALUES
  (
    'b7e2a8d3-4c5f-4a1b-9c3e-7f8d2a1b5c4e',
    'SEU_USER_ID_AQUI', -- Substitua pelo UUID do auth.users
    'Dona Maria Silva',
    78,
    '+55 11 98888-1111',
    'https://picsum.photos/seed/maria/200/200',
    'Ana Clara (Filha)',
    '+55 11 97777-2222'
  ),
  (
    'c8f3b9e4-5d6g-5b2c-0d4f-8g9e3b2c6d5f',
    'SEU_USER_ID_AQUI', -- Substitua pelo UUID do auth.users
    'Sr. João Oliveira',
    82,
    '+55 11 98888-3333',
    'https://picsum.photos/seed/joao/200/200',
    'Carlos Oliveira (Neto)',
    '+55 11 97777-4444'
  ),
  (
    'd9g4c0f5-6e7h-6c3d-1e5g-9h0f4c3d7e6g',
    'SEU_USER_ID_AQUI', -- Substitua pelo UUID do auth.users
    'Dona Helena Souza',
    75,
    '+55 11 98888-5555',
    'https://picsum.photos/seed/helena/200/200',
    'Márcia Souza (Cuidadora)',
    '+55 11 97777-6666'
  );

-- =====================================================
-- SEED: medications
-- =====================================================

INSERT INTO public.medications (patient_id, name, dosage, frequency, times, active) VALUES
  (
    'b7e2a8d3-4c5f-4a1b-9c3e-7f8d2a1b5c4e', -- Dona Maria Silva
    'Losartana 50mg',
    '1 comprimido',
    '2 vezes ao dia',
    ARRAY['08:00', '20:00'],
    TRUE
  ),
  (
    'b7e2a8d3-4c5f-4a1b-9c3e-7f8d2a1b5c4e', -- Dona Maria Silva
    'Metformina 850mg',
    '1 comprimido',
    '1 vez ao dia',
    ARRAY['12:00'],
    TRUE
  ),
  (
    'c8f3b9e4-5d6g-5b2c-0d4f-8g9e3b2c6d5f', -- Sr. João Oliveira
    'Aspirina 100mg',
    '1 comprimido',
    '1 vez ao dia',
    ARRAY['09:00'],
    TRUE
  ),
  (
    'd9g4c0f5-6e7h-6c3d-1e5g-9h0f4c3d7e6g', -- Dona Helena Souza
    'Vitamina D 2000 UI',
    '1 cápsula',
    '1 vez ao dia',
    ARRAY['07:00'],
    TRUE
  );

-- =====================================================
-- SEED: medication_history
-- =====================================================

-- Obter IDs dos medicamentos (assumindo que foram inseridos na ordem acima)
DO $$
DECLARE
  med1_id UUID;
  med2_id UUID;
  med3_id UUID;
  med4_id UUID;
BEGIN
  -- Buscar IDs dos medicamentos recém-criados
  SELECT id INTO med1_id FROM public.medications WHERE name = 'Losartana 50mg' LIMIT 1;
  SELECT id INTO med2_id FROM public.medications WHERE name = 'Metformina 850mg' LIMIT 1;
  SELECT id INTO med3_id FROM public.medications WHERE name = 'Aspirina 100mg' LIMIT 1;
  SELECT id INTO med4_id FROM public.medications WHERE name = 'Vitamina D 2000 UI' LIMIT 1;

  -- Inserir histórico
  INSERT INTO public.medication_history (patient_id, medication_id, medication_name, scheduled_time, actual_time, status, date) VALUES
    (
      'b7e2a8d3-4c5f-4a1b-9c3e-7f8d2a1b5c4e',
      med1_id,
      'Losartana 50mg',
      '08:00',
      '08:05',
      'taken',
      CURRENT_DATE
    ),
    (
      'b7e2a8d3-4c5f-4a1b-9c3e-7f8d2a1b5c4e',
      med2_id,
      'Metformina 850mg',
      '12:00',
      NULL,
      'pending',
      CURRENT_DATE
    ),
    (
      'c8f3b9e4-5d6g-5b2c-0d4f-8g9e3b2c6d5f',
      med3_id,
      'Aspirina 100mg',
      '09:00',
      NULL,
      'missed',
      CURRENT_DATE
    ),
    (
      'd9g4c0f5-6e7h-6c3d-1e5g-9h0f4c3d7e6g',
      med4_id,
      'Vitamina D 2000 UI',
      '07:00',
      '07:00',
      'taken',
      CURRENT_DATE
    ),
    -- Histórico de dias anteriores
    (
      'b7e2a8d3-4c5f-4a1b-9c3e-7f8d2a1b5c4e',
      med1_id,
      'Losartana 50mg',
      '08:00',
      '08:02',
      'taken',
      CURRENT_DATE - INTERVAL '1 day'
    ),
    (
      'b7e2a8d3-4c5f-4a1b-9c3e-7f8d2a1b5c4e',
      med1_id,
      'Losartana 50mg',
      '20:00',
      '20:15',
      'delayed',
      CURRENT_DATE - INTERVAL '1 day'
    );
END $$;

-- =====================================================
-- SEED: whatsapp_logs
-- =====================================================

INSERT INTO public.whatsapp_logs (patient_id, message_type, message, status, sent_to, delivered_at) VALUES
  (
    'b7e2a8d3-4c5f-4a1b-9c3e-7f8d2a1b5c4e',
    'system',
    'Lembrete enviado para Dona Maria: Metformina 850mg.',
    'delivered',
    '+55 11 98888-1111',
    NOW() - INTERVAL '10 minutes'
  ),
  (
    'b7e2a8d3-4c5f-4a1b-9c3e-7f8d2a1b5c4e',
    'user',
    'Tomei',
    'success',
    NULL,
    NOW() - INTERVAL '5 minutes'
  ),
  (
    'c8f3b9e4-5d6g-5b2c-0d4f-8g9e3b2c6d5f',
    'system',
    'Lembrete enviado para Sr. João: Aspirina 100mg.',
    'delivered',
    '+55 11 98888-3333',
    NOW() - INTERVAL '2 hours'
  ),
  (
    'c8f3b9e4-5d6g-5b2c-0d4f-8g9e3b2c6d5f',
    'system',
    'ALERTA: Sr. João não confirmou a medicação das 09:00.',
    'error',
    NULL,
    NOW() - INTERVAL '30 minutes'
  );

-- =====================================================
-- FIM DOS DADOS DE EXEMPLO
-- =====================================================

-- Para verificar os dados inseridos:
-- SELECT * FROM public.patients;
-- SELECT * FROM public.medications;
-- SELECT * FROM public.medication_history;
-- SELECT * FROM public.whatsapp_logs;

-- Para calcular adesão de um paciente (últimos 7 dias):
-- SELECT calculate_patient_adherence('b7e2a8d3-4c5f-4a1b-9c3e-7f8d2a1b5c4e', 7);
