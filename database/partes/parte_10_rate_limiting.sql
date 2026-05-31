-- Tabla de auditoría para rate limiting en Edge Functions
-- Solo accesible por service_role (usado por Edge Functions)
CREATE TABLE IF NOT EXISTS rate_limit_logs (
  id          uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    text         NOT NULL,
  created_at  timestamptz  DEFAULT now() NOT NULL
);

-- Índice compuesto para consultas rápidas (user + endpoint + ventana de tiempo)
CREATE INDEX IF NOT EXISTS idx_rate_limit_user_endpoint_time
  ON rate_limit_logs (user_id, endpoint, created_at DESC);

-- RLS: solo el service_role puede operar esta tabla (Edge Functions)
ALTER TABLE rate_limit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only" ON rate_limit_logs
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Limpieza automática de registros > 24h via pg_cron (si disponible)
-- Si pg_cron no está habilitado, se puede ejecutar manualmente:
-- DELETE FROM rate_limit_logs WHERE created_at < now() - interval '24 hours';
