-- =====================================================================
-- PARTE 9: COLUMNA motivo EN schedule_blocks
-- Ejecutar después de parte_08_motivo_rechazo.sql
-- =====================================================================

ALTER TABLE public.schedule_blocks
  ADD COLUMN IF NOT EXISTS motivo TEXT NULL;

COMMENT ON COLUMN public.schedule_blocks.motivo
  IS 'Razón del bloqueo: mantenimiento, convenio, limpieza, capacitación, etc.';

-- Columna para tipo de bloqueo (para categorización rápida)
ALTER TABLE public.schedule_blocks
  ADD COLUMN IF NOT EXISTS tipo_bloqueo TEXT NULL
  CHECK (tipo_bloqueo IN ('mantenimiento', 'convenio', 'limpieza', 'capacitacion', 'emergencia', 'otro') OR tipo_bloqueo IS NULL);

COMMENT ON COLUMN public.schedule_blocks.tipo_bloqueo
  IS 'Categoría del bloqueo para filtros y reportes';
