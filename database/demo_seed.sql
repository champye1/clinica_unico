-- ============================================================
-- DEMO SEED DATA — QuirúrgicaPro
-- Clínica Quirúrgica Demostracion Ltda.
-- Ejecutar SOLO en ambiente de demo/desarrollo
-- ============================================================

-- ── 1. Configuración de la clínica ──────────────────────────
INSERT INTO clinic_settings (key, value, updated_at) VALUES
('clinic_info', '{
  "nombre": "Clínica Quirúrgica Viña del Mar",
  "tagline": "Sistema de Gestión Quirúrgica",
  "rut": "76.543.210-8",
  "telefono": "+56 32 234 5678",
  "direccion": "Av. Libertad 1234, Viña del Mar, Valparaíso"
}', now()),
('whatsapp_config', '{
  "numero": "",
  "token": "",
  "instancia": "",
  "activo": false
}', now())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- ── 2. Pabellones ────────────────────────────────────────────
INSERT INTO operating_rooms (id, nombre, activo) VALUES
('a1b2c3d4-0001-0001-0001-000000000001', 'Pabellón 1 — General',       true),
('a1b2c3d4-0001-0001-0001-000000000002', 'Pabellón 2 — Cardiovascular', true),
('a1b2c3d4-0001-0001-0001-000000000003', 'Pabellón 3 — Oftalmología',   true),
('a1b2c3d4-0001-0001-0001-000000000004', 'Pabellón 4 — Emergencias',    true)
ON CONFLICT (id) DO NOTHING;

-- ── 3. Insumos ───────────────────────────────────────────────
INSERT INTO supplies (id, nombre, codigo, grupo_prestacion, unidad, stock_actual, stock_minimo, activo) VALUES
('b2c3d4e5-0002-0002-0002-000000000001', 'Guantes de látex talla M',        'GLAT-M',  'general',   'caja',  48, 20, true),
('b2c3d4e5-0002-0002-0002-000000000002', 'Guantes de látex talla L',        'GLAT-L',  'general',   'caja',  35, 20, true),
('b2c3d4e5-0002-0002-0002-000000000003', 'Mascarilla quirúrgica N95',        'MASN95',  'general',   'caja',   8, 15, true),
('b2c3d4e5-0002-0002-0002-000000000004', 'Bisturí desechable #10',           'BIST-10', 'general',   'unidad', 120, 50, true),
('b2c3d4e5-0002-0002-0002-000000000005', 'Suturas Vicryl 2-0',               'SUT-V20', 'general',   'caja',  24, 10, true),
('b2c3d4e5-0002-0002-0002-000000000006', 'Malla hernia inguinal 15x15cm',    'MALL-HI', 'hernia',    'unidad',  6,  5, true),
('b2c3d4e5-0002-0002-0002-000000000007', 'Catéter venoso central 7Fr',       'CVC-7FR', 'cardiovascular', 'unidad', 12, 5, true),
('b2c3d4e5-0002-0002-0002-000000000008', 'Solución fisiológica 500mL',       'SF-500',  'general',   'unidad', 200, 50, true),
('b2c3d4e5-0002-0002-0002-000000000009', 'Hilo de sutura Prolene 3-0',       'PROL-30', 'general',   'caja',   3, 10, true),
('b2c3d4e5-0002-0002-0002-000000000010', 'Drenaje Jackson-Pratt 10mm',       'DJP-10',  'general',   'unidad', 18, 10, true)
ON CONFLICT (id) DO NOTHING;

-- ── 4. Usuarios pabellón (contraseña: Demo2024!) ─────────────
-- Nota: Crear manualmente en Supabase Auth o usar create-doctor Edge Function.
-- Los registros de la tabla users se insertan automáticamente via trigger.

-- ── 5. Solicitudes de ejemplo (pendientes) ───────────────────
-- Se recomienda crear solicitudes desde la interfaz del médico
-- para que el flujo completo quede demostrado correctamente.

-- ── 6. Rate limit logs (tabla limpia para demo) ──────────────
DELETE FROM rate_limit_logs WHERE created_at < now() - interval '1 day';

-- ── FIN DEL SEED ─────────────────────────────────────────────
-- Para restablecer el demo, ejecutar:
--   TRUNCATE operating_rooms CASCADE;
--   TRUNCATE supplies CASCADE;
--   y re-ejecutar este script.
