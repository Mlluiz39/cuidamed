-- Migration: Rename telegram_logs to whatsatsapp_logs
-- Created at: 2026-02-09
-- Versão simplificada - apenas renomeia a tabela

-- Rename table
ALTER TABLE IF EXISTS public.telegram_logs RENAME TO whatsapp_logs;

-- Rename indexes (if they exist with telegram_logs prefix)
ALTER INDEX IF EXISTS idx_telegram_logs_patient_id RENAME TO idx_whatsapp_logs_patient_id;
ALTER INDEX IF EXISTS idx_telegram_logs_sent_at RENAME TO idx_whatsapp_logs_sent_at;

-- Enable RLS (if not already enabled)
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;
