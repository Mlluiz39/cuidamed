-- Migration: Fix RLS policies - change user_id to organization_id
-- Created at: 2026-02-09

-- Drop existing policies for medication_history
DROP POLICY IF EXISTS "Users can view history of own patients" ON public.medication_history;
DROP POLICY IF EXISTS "Users can create history for own patients" ON public.medication_history;
DROP POLICY IF EXISTS "Users can update history of own patients" ON public.medication_history;

-- Recreate policies with organization_id
CREATE POLICY "Users can view history of own patients"
  ON public.medication_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = medication_history.patient_id
        AND patients.organization_id = auth.uid()
    )
  );

CREATE POLICY "Users can create history for own patients"
  ON public.medication_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = medication_history.patient_id
        AND patients.organization_id = auth.uid()
    )
  );

CREATE POLICY "Users can update history of own patients"
  ON public.medication_history FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = medication_history.patient_id
        AND patients.organization_id = auth.uid()
    )
  );

-- Fix whatsapp_logs policies too
DROP POLICY IF EXISTS "Users can view logs of own patients" ON public.whatsapp_logs;
DROP POLICY IF EXISTS "Users can insert logs for own patients" ON public.whatsapp_logs;

CREATE POLICY "Users can view logs of own patients"
  ON public.whatsapp_logs FOR SELECT
  USING (
    patient_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = whatsapp_logs.patient_id
        AND patients.organization_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert logs for own patients"
  ON public.whatsapp_logs FOR INSERT
  WITH CHECK (
    patient_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = whatsapp_logs.patient_id
        AND patients.organization_id = auth.uid()
    )
  );
