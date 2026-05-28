# Guía de Resolución de Problemas

Referencia rápida para los problemas más frecuentes en desarrollo y producción.

---

## Autenticación

### El doctor no puede iniciar sesión — "Credenciales incorrectas"

1. Verificar que el doctor tenga `acceso_web_enabled = true` en la tabla `doctors`.
2. Verificar que exista un registro en `users` con `role = 'doctor'` vinculado al mismo `auth.users.id`.
3. Ejecutar el script `database/utilities/verificar_medicos.sql` en el SQL Editor de Supabase.
4. Si la función `get_doctor_email_by_username` retorna NULL para el username dado, el `username` no coincide con ningún registro en `users`.

```sql
-- Verificar si el username existe
SELECT * FROM users WHERE username = 'el_username_del_doctor';
```

### El usuario pabellón no puede iniciar sesión

1. El login de pabellón usa email directamente contra `auth.users` — verificar que el email sea correcto en Supabase Auth → Users.
2. Verificar que `users.role = 'pabellon'` para ese usuario.
3. Ejecutar `database/fixes/solucionar_login_pabellon.sql` si el problema persiste.

### La sesión expira inmediatamente

El token JWT de Supabase dura 1 hora por defecto. Si el sistema muestra la advertencia de sesión por vencer antes de ese tiempo, revisar que el reloj del servidor del navegador sea correcto (desfase de zona horaria puede causar falsos positivos).

---

## Base de Datos

### Error "relation does not exist"

Ocurre cuando la base de datos no tiene todas las migraciones aplicadas. Ejecutar en orden:

```
1. database/schema.sql
2. database/rls_policies.sql
3. database/migrations/*.sql  (en orden cronológico)
```

Para verificar qué tablas existen:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;
```

### Error "permission denied for table X"

Las políticas RLS bloquean el acceso. Causas comunes:

| Causa | Solución |
|---|---|
| `rls_policies.sql` no ejecutado | Ejecutar el archivo |
| La sesión del usuario no tiene `role` correcto en `users` | Verificar `users.role` |
| Consulta desde `anon` a tabla protegida | Usar una RPC con `SECURITY DEFINER` |

Para listar las políticas activas de una tabla:
```sql
SELECT * FROM pg_policies WHERE tablename = 'nombre_tabla';
```

### `audit_logs` no registra cambios

1. Verificar que los triggers estén creados: `SELECT * FROM pg_trigger WHERE tgname LIKE 'audit_%';`
2. Si no existen, volver a ejecutar `database/partes/parte_03_funciones_triggers.sql`.
3. Verificar permisos con `database/fixes/fix_audit_logs_permissions.sql`.

### El stock de un insumo no actualiza

El stock se actualiza mediante triggers en `surgery_supplies` y `supply_movements`. Si el valor parece incorrecto:

```sql
-- Ver movimientos de un insumo
SELECT * FROM supply_movements WHERE supply_id = 'uuid_insumo' ORDER BY created_at DESC;

-- Recalcular manualmente (ajuste)
UPDATE supplies SET stock_actual = <nuevo_valor> WHERE id = 'uuid_insumo';
INSERT INTO supply_movements (supply_id, tipo, cantidad, motivo, relacionado_tipo, created_by)
VALUES ('uuid_insumo', 'ajuste', <cantidad>, 'Corrección manual', 'ajuste_manual', 'uuid_usuario');
```

---

## Funciones RPC

### `programar_cirugia_completa` retorna `success: false`

El mensaje en `data.message` indica la causa. Los más comunes:

| Mensaje | Causa | Solución |
|---|---|---|
| "El pabellón no está disponible" | Slot ya ocupado o bloqueado | Elegir otro horario |
| "Solicitud no encontrada" | UUID inválido o eliminada | Verificar que la solicitud exista en `surgery_requests` |
| "La solicitud ya fue procesada" | Estado diferente a `'pendiente'` | La solicitud ya fue aceptada/rechazada |

### `get_estado_slots_pabellon` no devuelve datos

Verificar que existan pabellones con `activo = true` en `operating_rooms`:
```sql
SELECT id, nombre, activo FROM operating_rooms;
```

### Error "function X does not exist"

La función RPC no está creada en la base de datos. Ejecutar el archivo correspondiente:
- Todas las RPCs del sistema: `database/partes/parte_04_rpc.sql`
- `get_doctor_email_by_username` específicamente: `database/migrations/add_get_doctor_email_by_username.sql`

---

## Frontend

### El calendario anual no muestra colores de médicos

Los colores se asignan en base a `doctor_id` devuelto por la consulta de cirugías del año. Verificar que la sub-consulta incluya `doctors (id, apellido)`:

```js
// En Calendario.jsx — la consulta de cirugias debe incluir:
.select('..., doctors (id, apellido), ...')
```

### La búsqueda global (Cmd+K) no encuentra resultados

- Requiere mínimo 2 caracteres.
- Busca en `patients`, `doctors`, `surgery_requests` y `supplies` en paralelo.
- Si una tabla tiene RLS muy restrictiva puede devolver 0 resultados sin error. Verificar políticas de la tabla en Supabase.

### La exportación .ics no abre en el calendario

El archivo requiere que el cliente de correo o calendario soporte el tipo MIME `text/calendar`. En iOS/macOS suele funcionar automáticamente. En Windows puede requerir asociar la extensión `.ics` a Outlook o Google Calendar.

### Paginación desincronizada tras ordenar columnas

El sort de columnas resetea `currentPage` a 1 para evitar páginas vacías. Si persiste, verificar que `handleSort` llame a `setCurrentPage(1)` antes de actualizar `sortField`/`sortDir`.

---

## Tests

### Tests fallan con "localStorage is not a function"

Los archivos `.js` de Vitest (sin JSX) no tienen `localStorage` disponible por defecto en entornos `node`. Usar el stub de Proxy definido en `src/__tests__/utils/rateLimiter.test.js`:

```js
beforeEach(() => {
  vi.stubGlobal('localStorage', makeLocalStorageMock())
})
afterEach(() => {
  vi.unstubAllGlobals()
})
```

### Tests de componentes fallan con "No X export is defined on the lucide-react mock"

Agregar el ícono faltante al mock compartido en `src/__tests__/helpers/lucideMock.js`:

```js
export const lucideIcons = {
  // ... existentes
  NuevoIcono: Stub,
}
```

### Tests de hooks fallan — el estado no cambia

Para hooks que usan `setTimeout`/`setInterval`, usar `vi.useFakeTimers()` + `vi.advanceTimersByTime(ms)` + `act()`. Ver `src/__tests__/hooks/useDebounce.test.js` como referencia.

---

## Despliegue

### Variables de entorno faltantes en producción

El proyecto requiere exactamente dos variables en `.env`:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

En Vercel/Netlify configurarlas como variables de entorno del proyecto. Sin ellas la app carga pero todas las consultas a Supabase fallan con "supabaseUrl is required".

### Build falla por import circular

Vitest y Vite detectan imports circulares con `--reporter=verbose`. Revisar la consola de build. La causa más común es importar un componente de layout dentro de un componente de página que el layout también importa.

### Sentry no captura errores en producción

Verificar que `VITE_SENTRY_DSN` esté definido en las variables de entorno del entorno de producción. En desarrollo la integración está desactivada intencionalmente para no contaminar los reportes.
