# Guía de Instalación — QuirúrgicaPro

## Requisitos previos

| Herramienta | Versión mínima |
|-------------|---------------|
| Node.js     | 18+           |
| npm         | 9+            |
| Cuenta Supabase | Free tier o superior |
| Vercel / Netlify | Para deploy del frontend |

---

## 1. Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → **New project**
2. Elegir nombre, contraseña de base de datos y región (São Paulo para Chile)
3. Esperar ~2 minutos a que el proyecto esté activo
4. Anotar:
   - **Project URL** → `https://xxxx.supabase.co`
   - **anon public key** → en Settings → API
   - **service_role key** → en Settings → API (mantener secreto)

---

## 2. Aplicar el esquema de base de datos

En el **SQL Editor** de Supabase, ejecutar en orden:

```
database/partes/parte_01_base.sql
database/partes/parte_02_doctors.sql
database/partes/parte_03_patients.sql
database/partes/parte_04_surgery_requests.sql
database/partes/parte_05_surgeries.sql
database/partes/parte_06_supplies.sql
database/partes/parte_07_notifications.sql
database/partes/parte_08_settings.sql
database/partes/parte_09_audit.sql
database/partes/parte_10_rate_limiting.sql
```

Luego ejecutar el script de datos de demostración (opcional):
```
database/demo_seed.sql
```

---

## 3. Configurar variables de entorno

Crear el archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJ...
```

**Nunca** subir el `.env` al repositorio (ya está en `.gitignore`).

---

## 4. Configurar las Edge Functions

Las Edge Functions necesitan las siguientes variables secretas en Supabase:

1. Ir a **Edge Functions → Manage secrets** en el dashboard de Supabase
2. Agregar:

| Secret | Valor |
|--------|-------|
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | La service_role key |
| `ALLOWED_ORIGINS` | `https://tu-dominio.com` |

3. Deployar las Edge Functions:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Vincular al proyecto
supabase link --project-ref xxxx

# Deployar funciones
supabase functions deploy create-doctor
supabase functions deploy delete-doctor
```

---

## 5. Crear el primer usuario administrador

1. En Supabase → **Authentication → Users → Add user**
2. Email y contraseña del administrador de pabellón
3. En el **SQL Editor**, ejecutar:

```sql
INSERT INTO users (id, email, role, nombre, apellido)
VALUES (
  'UUID-DEL-USUARIO',  -- El id que generó Supabase al crear el usuario
  'admin@clinica.cl',
  'pabellon',
  'Admin',
  'Clínica'
);
```

---

## 6. Instalar dependencias y ejecutar localmente

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/quirurgicapro.git
cd quirurgicapro

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

El sistema estará disponible en `http://localhost:5173`

---

## 7. Deploy a producción

### Opción A: Vercel (recomendado)

```bash
npm install -g vercel
vercel

# Configurar variables de entorno en Vercel Dashboard:
# VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
```

### Opción B: Netlify

```bash
npm run build
# Subir la carpeta dist/ a Netlify
# Configurar redirects: en public/_redirects ya está configurado
```

### Opción C: Servidor propio (Nginx)

```bash
npm run build

# Copiar dist/ al servidor
# Configurar Nginx para servir SPA:
```

```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    root /var/www/quirurgicapro/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|svg|ico|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 8. Primera configuración del sistema (Onboarding)

Al iniciar sesión por primera vez:

1. El sistema mostrará el **wizard de configuración** automáticamente
2. Completa el nombre de la clínica, RUT y datos de contacto
3. Agrega los pabellones quirúrgicos
4. El wizard se cierra y el sistema queda listo

Alternativamente, ir a **Configuración → Información de la Clínica**.

---

## 9. Crear médicos

**Opción 1 — Uno a uno:**  
Ir a Médicos → Nuevo Médico → completar formulario

**Opción 2 — Importación masiva (recomendado):**  
Ir a Médicos → Importar CSV → descargar plantilla → completar datos → subir archivo

---

## 10. Checklist pre-entrega al cliente

- [ ] Variables de entorno configuradas en producción
- [ ] Edge Functions deployadas y funcionando
- [ ] Base de datos con esquema completo aplicado
- [ ] Primer usuario administrador creado
- [ ] Pabellones configurados
- [ ] Al menos un médico creado como prueba
- [ ] Notificaciones WhatsApp configuradas (opcional)
- [ ] URL del sistema entregada al cliente
- [ ] Sesión de capacitación agendada

---

## Soporte

Para dudas técnicas durante la instalación: **soporte@quirurgicapro.cl**

Tiempo de respuesta: máximo 4 horas hábiles (Lun–Vie 9:00–18:00 CLT)
