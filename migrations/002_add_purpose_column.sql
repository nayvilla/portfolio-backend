-- =========================================================
-- Migración: Agregar columna purpose a contact_messages
-- Fecha: 2026-04-08
-- Descripción: Campo opcional para categorizar el propósito del mensaje
-- =========================================================

-- Agregar columna purpose (opcional)
ALTER TABLE contact_messages ADD COLUMN purpose TEXT CHECK (purpose IS NULL OR purpose IN ('freelance', 'job_offer', 'question', 'collaboration', 'other'));

-- Crear índice para filtrar por propósito
CREATE INDEX IF NOT EXISTS idx_contact_messages_purpose ON contact_messages(purpose);
