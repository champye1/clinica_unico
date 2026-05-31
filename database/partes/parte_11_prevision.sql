-- parte_11_prevision.sql
-- Módulo de previsión de salud: agrega campo prevision a patients

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS prevision TEXT
    CHECK (prevision IN ('fonasa', 'isapre', 'particular', 'otro'));

COMMENT ON COLUMN patients.prevision IS 'Previsión de salud del paciente: fonasa, isapre, particular u otro';
