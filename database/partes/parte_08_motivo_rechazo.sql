-- =====================================================================
-- PARTE 8: COLUMNA motivo_rechazo EN surgery_requests
-- Ejecutar después de parte_07_rls_hardening.sql
-- =====================================================================

ALTER TABLE public.surgery_requests
  ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT NULL;

COMMENT ON COLUMN public.surgery_requests.motivo_rechazo
  IS 'Motivo por el que pabellón rechazó la solicitud — visible para el médico solicitante';
