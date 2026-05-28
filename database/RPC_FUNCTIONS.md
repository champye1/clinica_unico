# Funciones RPC de Supabase

Estas funciones se invocan desde el frontend con `supabase.rpc('nombre_funcion', { ...args })`.
Todas están definidas en `database/partes/parte_04_rpc.sql`.

---

## `programar_cirugia_completa`

Transacción atómica que convierte una solicitud de cirugía en una cirugía programada. Valida disponibilidad, copia los insumos de la solicitud, actualiza el estado y registra en auditoría.

**Argumentos**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `p_surgery_request_id` | UUID | Sí | ID de la `surgery_request` a aceptar |
| `p_operating_room_id` | UUID | Sí | Pabellón donde se realizará la cirugía |
| `p_fecha` | DATE | Sí | Fecha de la cirugía (`YYYY-MM-DD`) |
| `p_hora_inicio` | TIME | Sí | Hora de inicio (`HH:MM:SS`) |
| `p_hora_fin` | TIME | Sí | Hora de fin (`HH:MM:SS`) |
| `p_observaciones` | TEXT | No | Observaciones adicionales (default NULL) |

**Retorna** `JSONB`

```json
{ "success": true, "surgery_id": "uuid", "message": "Cirugía programada exitosamente" }
{ "success": false, "message": "El pabellón no está disponible en ese horario" }
```

**Usado en**
- `src/pages/pabellon/Solicitudes.jsx` — botón "Programar"
- `src/pages/pabellon/Calendario.jsx` — modal de agendar desde calendario

---

## `verificar_disponibilidad_con_limpieza`

Verifica si un slot horario está disponible, considerando el tiempo de limpieza configurado para el pabellón entre cirugías consecutivas.

**Argumentos**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `p_operating_room_id` | UUID | Sí | ID del pabellón |
| `p_fecha` | DATE | Sí | Fecha a verificar |
| `p_hora_inicio` | TIME | Sí | Inicio del slot |
| `p_hora_fin` | TIME | Sí | Fin del slot |

**Retorna** `JSONB`

```json
{ "disponible": true, "mensaje": "Slot disponible", "tiempo_limpieza_minutos": 30 }
{ "disponible": false, "mensaje": "Conflicto con cirugía anterior (limpieza pendiente)", "tiempo_limpieza_minutos": 30 }
```

---

## `get_estado_slots_pabellon`

Devuelve todos los slots horarios del día (09:00–18:00, en franjas de 1 hora) para todos los pabellones activos, con su estado calculado.

**Argumentos**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `p_fecha` | DATE | Sí | Fecha a consultar |

**Retorna** `TABLE`

| Columna | Tipo | Descripción |
|---|---|---|
| `operating_room_id` | UUID | ID del pabellón |
| `nombre_pabellon` | TEXT | Nombre del pabellón |
| `hora_inicio` | TIME | Inicio del slot |
| `hora_fin` | TIME | Fin del slot |
| `estado` | TEXT | `'libre'` · `'ocupado'` · `'bloqueado'` · `'solicitado'` |

**Usado en**
- `src/components/CalendarioPabellonesGrid.jsx` — vista de grilla de slots diarios

---

## `get_slots_disponibles_pabellon`

Igual que `get_estado_slots_pabellon` pero devuelve solo los slots con estado `'libre'`.

**Argumentos**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `p_fecha` | DATE | Sí | Fecha a consultar |

**Retorna** `TABLE` — mismas columnas que `get_estado_slots_pabellon` (sin columna `estado`).

---

## `liberar_bloqueos_expirados`

Libera bloqueos de horario cuya fecha de vigencia (`vigencia_hasta`) ya pasó y no tienen una cirugía asignada en el slot bloqueado. Pensada para ejecutarse periódicamente (cron o mantenimiento manual).

**Sin argumentos.**

**Retorna** `TABLE`

| Columna | Tipo | Descripción |
|---|---|---|
| `bloqueos_liberados` | INTEGER | Número de bloqueos eliminados |
| `mensaje` | TEXT | Descripción del resultado |

---

## `notificar_reagendamiento_a_pabellon`

Envía notificaciones a todos los usuarios con rol `pabellon` indicando que el doctor solicita reagendar una cirugía. Actualiza el campo `reagendamiento_notificado_at` de la solicitud.

**Argumentos**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `p_surgery_request_id` | UUID | Sí | ID de la `surgery_request` a reagendar |

**Retorna** `JSONB`

```json
{ "success": true, "notificaciones_enviadas": 2 }
{ "success": false, "message": "Solicitud no encontrada" }
```

**Usado en**
- `src/pages/doctor/Solicitudes.jsx` — botón "Reagendar"

---

## `get_doctor_email_by_username`

Resuelve el email de un doctor a partir de su nombre de usuario. Permite el flujo de login del doctor sin exponer la tabla `users` al rol `anon`.

**Argumentos**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `p_username` | TEXT | Sí | Nombre de usuario del doctor |

**Retorna** `TEXT` — el email del doctor, o `NULL` si no existe.

**Usado en**
- `src/pages/auth/LoginDoctor.jsx` — resolución de credenciales

---

## Notas de uso

```js
// Ejemplo con manejo de error
const { data, error } = await supabase.rpc('programar_cirugia_completa', {
  p_surgery_request_id: requestId,
  p_operating_room_id: roomId,
  p_fecha: '2026-06-15',
  p_hora_inicio: '10:00:00',
  p_hora_fin: '12:00:00',
})

if (error) throw error          // error de red / PostgreSQL
if (!data.success) throw new Error(data.message)  // error de negocio
```

- Las funciones que retornan `JSONB` con `{ success, message }` distinguen errores de negocio de errores técnicos — siempre valida ambos.
- Las funciones que retornan `TABLE` se reciben como un array de filas en `data`.
- Todos los UUIDs deben pasarse como strings.
