# Diagrama Entidad-Relación (ERD)

```mermaid
erDiagram
    %% ── Auth ──────────────────────────────────────────────────────────────────
    AUTH_USERS {
        uuid id PK
        text email
    }

    USERS {
        uuid id PK
        uuid auth_id FK
        text email
        text role
        text username
        timestamp created_at
        timestamp deleted_at
    }

    %% ── Personal ──────────────────────────────────────────────────────────────
    DOCTORS {
        uuid id PK
        uuid user_id FK
        text nombre
        text apellido
        text rut
        text email
        medical_specialty especialidad
        doctor_status estado
        bool acceso_web_enabled
        timestamp created_at
        timestamp deleted_at
    }

    %% ── Pacientes ─────────────────────────────────────────────────────────────
    PATIENTS {
        uuid id PK
        uuid doctor_id FK
        text nombre
        text apellido
        text rut
        timestamp created_at
        timestamp deleted_at
    }

    %% ── Pabellones ────────────────────────────────────────────────────────────
    OPERATING_ROOMS {
        uuid id PK
        text nombre
        int camillas_disponibles
        bool activo
        int tiempo_limpieza_minutos
        timestamp created_at
        timestamp deleted_at
    }

    %% ── Insumos ───────────────────────────────────────────────────────────────
    SUPPLIES {
        uuid id PK
        text nombre
        text codigo
        text grupo_prestacion
        bool activo
        int stock_actual
        int stock_minimo
        text unidad_medida
        text grupos_fonasa
        text proveedor
        timestamp created_at
        timestamp deleted_at
    }

    SUPPLY_MOVEMENTS {
        uuid id PK
        uuid supply_id FK
        text tipo
        int cantidad
        text motivo
        uuid relacionado_con
        text relacionado_tipo
        uuid created_by FK
        timestamp created_at
    }

    OPERATION_SUPPLY_PACKS {
        text codigo_operacion PK
        uuid supply_id PK
        int cantidad
    }

    %% ── Solicitudes de Cirugía ────────────────────────────────────────────────
    SURGERY_REQUESTS {
        uuid id PK
        uuid doctor_id FK
        uuid patient_id FK
        text codigo_operacion
        time hora_recomendada
        time hora_fin_recomendada
        text observaciones
        request_status estado
        date fecha_preferida
        uuid operating_room_id_preferido FK
        date fecha_preferida_2
        time hora_recomendada_2
        time hora_fin_recomendada_2
        uuid operating_room_id_preferido_2 FK
        bool dejar_fecha_a_pabellon
        jsonb horarios_preferidos_extra
        timestamp reagendamiento_notificado_at
        timestamp created_at
        timestamp deleted_at
    }

    SURGERY_REQUEST_SUPPLIES {
        uuid id PK
        uuid surgery_request_id FK
        uuid supply_id FK
        int cantidad
        timestamp created_at
    }

    %% ── Cirugías Programadas ──────────────────────────────────────────────────
    SURGERIES {
        uuid id PK
        uuid surgery_request_id FK
        uuid doctor_id FK
        uuid patient_id FK
        uuid operating_room_id FK
        date fecha
        time hora_inicio
        time hora_fin
        surgery_status estado
        hour_state estado_hora
        date fecha_anterior
        time hora_inicio_anterior
        time hora_fin_anterior
        timestamp fecha_ultimo_agendamiento
        text observaciones
        timestamp created_at
        timestamp deleted_at
    }

    SURGERY_SUPPLIES {
        uuid id PK
        uuid surgery_id FK
        uuid supply_id FK
        int cantidad
        timestamp created_at
    }

    SURGERY_SCHEDULE_HISTORY {
        uuid id PK
        uuid surgery_id FK
        date fecha_anterior
        time hora_inicio_anterior
        time hora_fin_anterior
        date fecha_nueva
        time hora_inicio_nueva
        time hora_fin_nueva
        text motivo
        uuid created_by FK
        timestamp created_at
    }

    %% ── Bloqueos ──────────────────────────────────────────────────────────────
    SCHEDULE_BLOCKS {
        uuid id PK
        uuid doctor_id FK
        uuid operating_room_id FK
        date fecha
        time hora_inicio
        time hora_fin
        text motivo
        date vigencia_hasta
        int dias_auto_liberacion
        date fecha_auto_liberacion
        uuid created_by FK
        timestamp created_at
        timestamp deleted_at
    }

    %% ── Comunicación ──────────────────────────────────────────────────────────
    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        text tipo
        text titulo
        text mensaje
        uuid relacionado_con
        bool vista
        timestamp created_at
        timestamp deleted_at
    }

    REMINDERS {
        uuid id PK
        uuid user_id FK
        text titulo
        text contenido
        text tipo
        uuid relacionado_con
        bool visto
        timestamp created_at
        timestamp deleted_at
    }

    EXTERNAL_MESSAGES {
        uuid id PK
        text nombre_remitente
        text email_remitente
        text especialidad_remitente
        text asunto
        text mensaje
        text nombre_paciente
        text rut_paciente
        text tipo_cirugia
        text urgencia
        bool leido
        bool archivado
        text gmail_message_id
        text fuente
        timestamp created_at
        timestamp deleted_at
    }

    %% ── Configuración y Auditoría ─────────────────────────────────────────────
    CLINIC_SETTINGS {
        text key PK
        jsonb value
        timestamp updated_at
        uuid updated_by FK
    }

    AUDIT_LOGS {
        uuid id PK
        uuid user_id FK
        text accion
        text tabla_afectada
        uuid registro_id
        jsonb datos_anteriores
        jsonb datos_nuevos
        inet ip_address
        text user_agent
        timestamp created_at
    }

    %% ── Relaciones ────────────────────────────────────────────────────────────
    AUTH_USERS ||--|| USERS : "auth.users → users"
    USERS ||--o| DOCTORS : "user_id"

    DOCTORS ||--o{ PATIENTS : "doctor_id"
    DOCTORS ||--o{ SURGERY_REQUESTS : "doctor_id"
    DOCTORS ||--o{ SURGERIES : "doctor_id"
    DOCTORS ||--o{ SCHEDULE_BLOCKS : "doctor_id (nullable)"

    PATIENTS ||--o{ SURGERY_REQUESTS : "patient_id"
    PATIENTS ||--o{ SURGERIES : "patient_id"

    OPERATING_ROOMS ||--o{ SURGERY_REQUESTS : "operating_room_id_preferido"
    OPERATING_ROOMS ||--o{ SURGERIES : "operating_room_id"
    OPERATING_ROOMS ||--o{ SCHEDULE_BLOCKS : "operating_room_id"

    SURGERY_REQUESTS ||--|| SURGERIES : "surgery_request_id (1:1)"
    SURGERY_REQUESTS ||--o{ SURGERY_REQUEST_SUPPLIES : "surgery_request_id"

    SURGERIES ||--o{ SURGERY_SUPPLIES : "surgery_id"
    SURGERIES ||--o{ SURGERY_SCHEDULE_HISTORY : "surgery_id"

    SUPPLIES ||--o{ SURGERY_REQUEST_SUPPLIES : "supply_id"
    SUPPLIES ||--o{ SURGERY_SUPPLIES : "supply_id"
    SUPPLIES ||--o{ SUPPLY_MOVEMENTS : "supply_id"
    SUPPLIES ||--o{ OPERATION_SUPPLY_PACKS : "supply_id"

    USERS ||--o{ NOTIFICATIONS : "user_id"
    USERS ||--o{ REMINDERS : "user_id"
    USERS ||--o{ AUDIT_LOGS : "user_id"
    USERS ||--o{ SUPPLY_MOVEMENTS : "created_by"
    USERS ||--o{ SCHEDULE_BLOCKS : "created_by"
    USERS ||--o{ SURGERY_SCHEDULE_HISTORY : "created_by"
    USERS ||--o| CLINIC_SETTINGS : "updated_by"
```

## Notas del diseño

- **Soft delete**: la mayoría de tablas tienen `deleted_at` en lugar de borrado físico. Las consultas del frontend filtran con `.is('deleted_at', null)`.
- **Relación 1:1 surgery_request → surgery**: una solicitud aceptada genera exactamente una cirugía; el campo `surgery_request_id` en `surgeries` tiene restricción `UNIQUE`.
- **Insumos en dos etapas**: los insumos se asocian primero a la solicitud (`surgery_request_supplies`) y luego se copian a la cirugía (`surgery_supplies`) al programarla via RPC.
- **Packs de operación** (`operation_supply_packs`): definen los insumos estándar por código de operación. `cantidad = 0` indica insumo opcional; `> 0` se auto-agrega al crear la solicitud.
- **Bloqueos con auto-liberación**: `schedule_blocks` soporta `vigencia_hasta` y `dias_auto_liberacion` para bloqueos temporales (ej. vacaciones). La RPC `liberar_bloqueos_expirados` los limpia.
- **Auditoría automática**: `audit_logs` se llena mediante triggers PostgreSQL en todas las tablas principales — no requiere lógica en el frontend.
