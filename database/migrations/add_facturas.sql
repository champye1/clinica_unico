-- =====================================================
-- MIGRACIÓN: Módulo de Facturación Electrónica (DTE)
-- Descripción: Tabla facturas ligada a cirugías,
--              integración con OpenFactura (Haulmer)
-- =====================================================

-- Enum estado del DTE
DO $$ BEGIN
  CREATE TYPE dte_estado AS ENUM (
    'pendiente',
    'emitido',
    'anulado',
    'error'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enum tipo de DTE chileno
DO $$ BEGIN
  CREATE TYPE dte_tipo AS ENUM (
    'boleta',
    'factura'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabla principal de facturas/boletas emitidas
CREATE TABLE IF NOT EXISTS public.facturas (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  surgery_id        UUID        REFERENCES public.surgeries(id) ON DELETE SET NULL,
  surgery_request_id UUID       REFERENCES public.surgery_requests(id) ON DELETE SET NULL,

  -- Tipo y estado DTE
  tipo              dte_tipo    NOT NULL DEFAULT 'boleta',
  estado            dte_estado  NOT NULL DEFAULT 'pendiente',

  -- Datos del receptor (quien paga)
  receptor_rut      TEXT,
  receptor_nombre   TEXT        NOT NULL,
  receptor_giro     TEXT,
  receptor_dir      TEXT,
  receptor_comuna   TEXT,

  -- Detalle de cobro
  descripcion       TEXT        NOT NULL,
  monto_neto        INTEGER,
  iva               INTEGER,
  monto_total       INTEGER     NOT NULL,

  -- Respuesta de OpenFactura
  folio             INTEGER,
  pdf_url           TEXT,
  xml_url           TEXT,
  openfactura_id    TEXT,
  error_detalle     TEXT,

  -- Ambiente (sandbox o produccion)
  sandbox           BOOLEAN     NOT NULL DEFAULT true,

  -- Auditoría
  emitido_por       UUID        REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_facturas_surgery_id
  ON public.facturas(surgery_id);
CREATE INDEX IF NOT EXISTS idx_facturas_surgery_request_id
  ON public.facturas(surgery_request_id);
CREATE INDEX IF NOT EXISTS idx_facturas_estado
  ON public.facturas(estado);
CREATE INDEX IF NOT EXISTS idx_facturas_created_at
  ON public.facturas(created_at DESC);

-- RLS
ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "facturas_pabellon_all" ON public.facturas;
CREATE POLICY "facturas_pabellon_all"
  ON public.facturas
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'pabellon'
        AND u.deleted_at IS NULL
    )
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_facturas_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_facturas_updated_at ON public.facturas;
CREATE TRIGGER trg_facturas_updated_at
  BEFORE UPDATE ON public.facturas
  FOR EACH ROW EXECUTE FUNCTION update_facturas_updated_at();

COMMENT ON TABLE public.facturas IS 'DTEs emitidos via OpenFactura: boletas y facturas electrónicas ligadas a cirugías';
