import { Globe, Key, Eye, EyeOff } from 'lucide-react'
import { formatRut } from '../../../utils/rutFormatter'
import { sanitizeString, sanitizeEmail, sanitizeCode, sanitizeRut, sanitizePassword } from '../../../utils/sanitizeInput'
import LoadingSpinner from '../../../components/common/LoadingSpinner'

const generarPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => chars[b % chars.length]).join('')
}

export default function MedicoForm({
  medicoEditando,
  formData,
  setFormData,
  showPassword,
  setShowPassword,
  fieldErrors,
  touchedFields,
  handleFieldChange,
  handleFieldBlur,
  handleSubmit,
  crearMedico,
  actualizarMedico,
  generarUsername,
  onCancel,
  especialidades,
}) {
  const isPending = crearMedico.isPending || actualizarMedico.isPending

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">
        {medicoEditando ? 'Editar Médico' : 'Nuevo Médico'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">Nombre *</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: sanitizeString(e.target.value) })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="label-field">Apellido *</label>
            <input
              type="text"
              value={formData.apellido}
              onChange={(e) => setFormData({ ...formData, apellido: sanitizeString(e.target.value) })}
              className="input-field"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">RUT *</label>
            <input
              type="text"
              value={formData.rut}
              onChange={(e) => {
                const sanitized = sanitizeRut(e.target.value)
                const formatted = formatRut(sanitized)
                handleFieldChange('rut', formatted)
              }}
              onBlur={() => handleFieldBlur('rut')}
              className={`input-field ${fieldErrors.rut ? 'border-red-500' : ''}`}
              placeholder="12.345.678-9"
              required
              maxLength={12}
            />
            {fieldErrors.rut && touchedFields.rut && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.rut}</p>
            )}
          </div>
          <div>
            <label className="label-field">Correo *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleFieldChange('email', sanitizeEmail(e.target.value))}
              onBlur={() => handleFieldBlur('email')}
              className={`input-field ${fieldErrors.email ? 'border-red-500' : ''}`}
              required
              disabled={!!medicoEditando}
            />
            {fieldErrors.email && touchedFields.email && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>
            )}
          </div>
        </div>

        <div>
          <label className="label-field">Teléfono WhatsApp</label>
          <input
            type="tel"
            value={formData.telefono}
            onChange={(e) => setFormData({ ...formData, telefono: e.target.value.replace(/[^+\d\s]/g, '') })}
            className="input-field"
            placeholder="+56912345678"
          />
          <p className="text-xs text-slate-400 mt-1">Formato internacional, ej: +56912345678</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">Especialidad *</label>
            <select
              value={formData.especialidad}
              onChange={(e) => setFormData({ ...formData, especialidad: sanitizeString(e.target.value) })}
              className="input-field"
              required
            >
              <option value="">Seleccionar...</option>
              {especialidades.map(esp => (
                <option key={esp} value={esp}>
                  {esp.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">Estado *</label>
            <select
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: sanitizeString(e.target.value) })}
              className="input-field"
              required
            >
              <option value="activo">Activo</option>
              <option value="vacaciones">Vacaciones</option>
            </select>
          </div>
        </div>

        <div className="border-2 border-blue-200 rounded-2xl p-4 bg-blue-50/30">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-blue-600" />
            <input
              type="checkbox"
              id="acceso_web"
              checked={formData.acceso_web_enabled}
              onChange={(e) => {
                const enabled = e.target.checked
                const nuevoUsername = enabled ? generarUsername(formData.nombre, formData.apellido) : ''
                setFormData({
                  ...formData,
                  acceso_web_enabled: enabled,
                  username: enabled ? nuevoUsername : formData.username,
                  password: enabled && !formData.password ? generarPassword() : (enabled ? formData.password : ''),
                })
              }}
              className="w-4 h-4"
            />
            <label htmlFor="acceso_web" className="text-sm font-bold text-gray-700">
              HABILITAR ACCESO WEB
            </label>
          </div>

          {formData.acceso_web_enabled && (
            <div className="space-y-4 mt-4">
              <div>
                <label className="label-field text-xs font-bold text-gray-600 uppercase">
                  Nombre de Usuario
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: sanitizeCode(e.target.value.toLowerCase()) })}
                  className="input-field"
                  placeholder="Ej: esteban"
                  required={formData.acceso_web_enabled}
                />
              </div>

              <div>
                <label className="label-field text-xs font-bold text-gray-600 uppercase">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleFieldChange('password', sanitizePassword(e.target.value))}
                    onBlur={() => handleFieldBlur('password')}
                    className={`input-field pr-12 ${fieldErrors.password ? 'border-red-500' : ''}`}
                    placeholder="Ingrese contraseña o use la generada"
                    required={formData.acceso_web_enabled}
                  />
                  {fieldErrors.password && touchedFields.password && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>
                  )}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, password: generarPassword() })}
                      className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                      title="Generar contraseña aleatoria"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                      title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {formData.password && (
                  <p className="text-xs text-gray-500 mt-1">
                    Mínimo 8 caracteres, al menos una letra y un número.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button type="submit" className="btn-primary" disabled={isPending}>
            {isPending ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                {medicoEditando ? 'Actualizando...' : 'Creando...'}
              </span>
            ) : (
              medicoEditando ? 'Actualizar' : 'Crear'
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            disabled={isPending}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
