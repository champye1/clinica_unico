import { useState, useMemo, useEffect, useRef } from 'react'
import { useLocation, useNavigate, useBlocker } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../config/supabase'
import { UserPlus, Package, AlertCircle, Ban, Calendar, LayoutGrid, ChevronDown, ChevronUp, History } from 'lucide-react'
import { formatRut, cleanRut, validateRut, isValidRutFormat } from '../../utils/rutFormatter'
import { sanitizeString, sanitizeRut, sanitizeNumber } from '../../utils/sanitizeInput'
import SearchableSelect from '../../components/SearchableSelect'
import { codigosOperaciones, getGrupoFonasaByCodigo, insumoAplicaParaGrupo } from '../../data/codigosOperaciones'
import { useNotifications } from '../../hooks/useNotifications'
import { useTheme } from '../../contexts/ThemeContext'
import ConfirmModal from '../../components/common/ConfirmModal'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import CalendarioPabellonesGrid from '../../components/CalendarioPabellonesGrid'
import { HORAS_SELECT } from '../../utils/horasOpciones'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function CrearPaciente() {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    rut: '',
    telefono: '',
    codigo_operacion: '',
    hora_recomendada: '',
    hora_fin_recomendada: '',
    fecha_preferida: '',
    operating_room_id_preferido: '',
    hora_recomendada_2: '',
    hora_fin_recomendada_2: '',
    fecha_preferida_2: '',
    operating_room_id_preferido_2: '',
    dejar_fecha_a_pabellon: true,
    horarios_extra: [], // [{ fecha_preferida, operating_room_id, hora_recomendada, hora_fin_recomendada }]
    observaciones: '',
    insumos: [], // Array de { supply_id, cantidad }
  })
  const [slot1Seleccionado, setSlot1Seleccionado] = useState(null) // { operating_room_id, nombre_pabellon, hora_inicio, hora_fin }
  const [slot2Seleccionado, setSlot2Seleccionado] = useState(null)
  const [showSegundoHorario, setShowSegundoHorario] = useState(false) // Se muestra "Agregar otro día" y luego el 2º bloque

  const [insumoSeleccionado, setInsumoSeleccionado] = useState('')
  const [cantidadInsumo, setCantidadInsumo] = useState(1)
  const [rutError, setRutError] = useState('')
  const [pacienteEncontrado, setPacienteEncontrado] = useState(null)
  const [buscandoPaciente, setBuscandoPaciente] = useState(false)
  const [showConfirmSinInsumos, setShowConfirmSinInsumos] = useState(false)
  const [showCalendarioGrid, setShowCalendarioGrid] = useState(true)
  const [historialPaciente, setHistorialPaciente] = useState([])
  const [showHistorial, setShowHistorial] = useState(false)
  const [solicitudDuplicadaAlert, setSolicitudDuplicadaAlert] = useState(false)

  const queryClient = useQueryClient()
  const { showError, showSuccess } = useNotifications()
  const { theme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const isDirty = !!(
    formData.nombre.trim() || formData.apellido.trim() || formData.rut.trim() ||
    formData.codigo_operacion || formData.insumos.length > 0
  )

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !crearPacienteYSolicitud?.isSuccess && currentLocation.pathname !== nextLocation.pathname
  )

  useEffect(() => {
    if (!isDirty) return
    const handler = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  // Prellenar horarios preferidos si viene desde "Horarios pabellones" (uno o dos bloques)
  useEffect(() => {
    const state = location.state
    if (!state?.desdeDisponibilidad || !state.fechaPreferida) return
    const s1 = state.slot1
    const s2 = state.slot2
    if (s1) {
      setFormData(prev => ({
        ...prev,
        fecha_preferida: state.fechaPreferida,
        hora_recomendada: s1.horaInicio || '',
        hora_fin_recomendada: s1.horaFin || '',
        operating_room_id_preferido: s1.operating_room_id || '',
        fecha_preferida_2: s2 ? (state.fechaPreferida2 || state.fechaPreferida) : '',
        hora_recomendada_2: s2?.horaInicio || '',
        hora_fin_recomendada_2: s2?.horaFin || '',
        operating_room_id_preferido_2: s2?.operating_room_id || '',
      }))
      setSlot1Seleccionado({
        operating_room_id: s1.operating_room_id,
        nombre_pabellon: s1.nombrePabellon || '',
        hora_inicio: s1.horaInicio,
        hora_fin: s1.horaFin,
      })
      setSlot2Seleccionado(s2 ? {
        operating_room_id: s2.operating_room_id,
        nombre_pabellon: s2.nombrePabellon || '',
        hora_inicio: s2.horaInicio,
        hora_fin: s2.horaFin,
      } : null)
      if (s2) setShowSegundoHorario(true)
    }
  }, [location.state])

  const { data: doctor } = useQuery({
    queryKey: ['doctor-actual'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('doctors')
        .select('id, estado, nombre, apellido')
        .eq('user_id', user.id)
        .single()
      
      if (error) throw error
      return data
    },
  })

  const { data: insumos = [] } = useQuery({
    queryKey: ['insumos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplies')
        .select('id, nombre, codigo, grupo_prestacion, grupos_fonasa')
        .eq('activo', true)
        .is('deleted_at', null)
        .order('nombre', { ascending: true })
      
      if (error) throw error
      return data
    },
  })

  const { data: pabellonesList = [] } = useQuery({
    queryKey: ['operating-rooms-crear'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operating_rooms')
        .select('id, nombre')
        .eq('activo', true)
        .is('deleted_at', null)
        .order('nombre')
      if (error) throw error
      return data || []
    },
  })

  // Pack e insumos recomendados para el código de operación seleccionado (tabla operation_supply_packs)
  const { data: packData } = useQuery({
    queryKey: ['operation-pack', formData.codigo_operacion],
    queryFn: async () => {
      if (!formData.codigo_operacion) return { packItems: [], recommendedSupplyIds: [] }
      try {
        const { data: rows, error } = await supabase
          .from('operation_supply_packs')
          .select('supply_id, cantidad, supplies(id, nombre, codigo)')
          .eq('codigo_operacion', formData.codigo_operacion)
        if (error) return { packItems: [], recommendedSupplyIds: [] }
        const packItems = (rows || [])
          .filter(r => r.supplies)
          .map(r => ({
            supply_id: r.supply_id,
            nombre: r.supplies.nombre,
            codigo: r.supplies.codigo,
            cantidad: Math.max(0, Number(r.cantidad) || 0),
          }))
        const recommendedSupplyIds = packItems.map(p => p.supply_id)
        return { packItems, recommendedSupplyIds }
      } catch {
        return { packItems: [], recommendedSupplyIds: [] }
      }
    },
    enabled: !!formData.codigo_operacion,
  })

  // Al cambiar el código de operación: reemplazar insumos solo por el pack del código actual (no mezclar con el anterior)
  const lastAppliedPackCodeRef = useRef(null)
  useEffect(() => {
    if (!formData.codigo_operacion) {
      lastAppliedPackCodeRef.current = null
      return
    }
    if (!packData?.packItems || lastAppliedPackCodeRef.current === formData.codigo_operacion) return
    const packInsumos = packData.packItems
      .filter(p => p.cantidad >= 1)
      .map(p => ({ supply_id: p.supply_id, nombre: p.nombre, codigo: p.codigo, cantidad: p.cantidad }))
    lastAppliedPackCodeRef.current = formData.codigo_operacion
    setFormData(prev => ({ ...prev, insumos: packInsumos }))
  }, [formData.codigo_operacion, packData?.packItems])

  // Insumos filtrados por grupo Fonasa; ordenados con recomendados para esta operación primero
  const grupoFonasa = getGrupoFonasaByCodigo(formData.codigo_operacion)
  const insumosDisponibles = useMemo(() => {
    let list = grupoFonasa
      ? insumos.filter(ins => insumoAplicaParaGrupo(ins.grupos_fonasa, grupoFonasa))
      : insumos
    const recommendedIds = packData?.recommendedSupplyIds || []
    if (recommendedIds.length === 0) return list
    return [...list].sort((a, b) => {
      const aRec = recommendedIds.includes(a.id)
      const bRec = recommendedIds.includes(b.id)
      if (aRec && !bRec) return -1
      if (!aRec && bRec) return 1
      return 0
    })
  }, [insumos, grupoFonasa, packData?.recommendedSupplyIds])

  useEffect(() => {
    if (insumoSeleccionado && !insumosDisponibles.some(i => i.id === insumoSeleccionado)) {
      setInsumoSeleccionado('')
    }
  }, [insumosDisponibles, insumoSeleccionado])

  const buscarPacientePorRut = async (rut) => {
    if (!doctor || !validateRut(rut) || !isValidRutFormat(rut)) return
    setBuscandoPaciente(true)
    setHistorialPaciente([])
    setSolicitudDuplicadaAlert(false)
    setShowHistorial(false)
    try {
      const { data } = await supabase
        .from('patients')
        .select('id, nombre, apellido, telefono')
        .eq('doctor_id', doctor.id)
        .eq('rut', cleanRut(rut))
        .is('deleted_at', null)
        .maybeSingle()
      if (data) {
        setPacienteEncontrado(data)
        setFormData(prev => ({
          ...prev,
          nombre: data.nombre,
          apellido: data.apellido,
          telefono: data.telefono || prev.telefono,
        }))
        // Obtener historial y detectar duplicados en paralelo
        const [histRes] = await Promise.all([
          supabase
            .from('surgery_requests')
            .select('id, estado, created_at, codigo_operacion')
            .eq('patient_id', data.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(10),
        ])
        const historial = histRes.data || []
        setHistorialPaciente(historial)
        const tienePendiente = historial.some(s => s.estado === 'pendiente')
        setSolicitudDuplicadaAlert(tienePendiente)
      } else {
        setPacienteEncontrado(null)
        setHistorialPaciente([])
        setSolicitudDuplicadaAlert(false)
      }
    } catch {
      setPacienteEncontrado(null)
    } finally {
      setBuscandoPaciente(false)
    }
  }

  const crearPacienteYSolicitud = useMutation({
    mutationFn: async (data) => {
      if (!doctor) throw new Error('Doctor no encontrado')

      // Verificar si ya existe un paciente con ese RUT para este doctor
      const { data: pacienteExistente, error: errorBusqueda } = await supabase
        .from('patients')
        .select('id, nombre, apellido')
        .eq('doctor_id', doctor.id)
        .eq('rut', cleanRut(data.rut))
        .is('deleted_at', null)
        .maybeSingle()

      if (errorBusqueda) throw errorBusqueda

      let paciente
      if (pacienteExistente) {
        // Usar el paciente existente
        paciente = pacienteExistente
        
        // Actualizar nombre/apellido/telefono si han cambiado
        if (pacienteExistente.nombre !== data.nombre || pacienteExistente.apellido !== data.apellido || data.telefono) {
          const { error: updateError } = await supabase
            .from('patients')
            .update({
              nombre: data.nombre,
              apellido: data.apellido,
              ...(data.telefono ? { telefono: data.telefono } : {}),
              updated_at: new Date().toISOString()
            })
            .eq('id', pacienteExistente.id)
          
          if (updateError) throw updateError
          
          // Actualizar el objeto paciente con los nuevos datos
          paciente = {
            ...pacienteExistente,
            nombre: data.nombre,
            apellido: data.apellido
          }
        }
      } else {
        // Crear nuevo paciente
        const { data: nuevoPaciente, error: pacienteError } = await supabase
          .from('patients')
          .insert({
            doctor_id: doctor.id,
            nombre: data.nombre,
            apellido: data.apellido,
            rut: cleanRut(data.rut),
            ...(data.telefono ? { telefono: data.telefono } : {}),
          })
          .select()
          .single()

        if (pacienteError) throw pacienteError
        paciente = nuevoPaciente
      }

      // Crear solicitud quirúrgica (usando el paciente existente o nuevo)
      const dejarAPabellon = Boolean(data.dejar_fecha_a_pabellon)
      const payloadSolicitud = {
        doctor_id: doctor.id,
        patient_id: paciente.id,
        codigo_operacion: data.codigo_operacion,
        observaciones: data.observaciones || null,
        dejar_fecha_a_pabellon: dejarAPabellon,
        hora_recomendada: dejarAPabellon ? null : (data.hora_recomendada || null),
        hora_fin_recomendada: dejarAPabellon ? null : (data.hora_fin_recomendada || null),
        fecha_preferida: dejarAPabellon ? null : (data.fecha_preferida || null),
        operating_room_id_preferido: dejarAPabellon ? null : (data.operating_room_id_preferido || null),
        hora_recomendada_2: dejarAPabellon ? null : (data.hora_recomendada_2 || null),
        hora_fin_recomendada_2: dejarAPabellon ? null : (data.hora_fin_recomendada_2 || null),
        fecha_preferida_2: dejarAPabellon ? null : (data.fecha_preferida_2 || null),
        operating_room_id_preferido_2: dejarAPabellon ? null : (data.operating_room_id_preferido_2 || null),
        horarios_preferidos_extra: (data.horarios_extra?.length
          ? data.horarios_extra.map(({ _key: _k, ...h }) => h)
          : null),
      }
      const { data: solicitud, error: solicitudError } = await supabase
        .from('surgery_requests')
        .insert(payloadSolicitud)
        .select()
        .single()

      if (solicitudError) throw solicitudError

      // Crear insumos de la solicitud
      if (data.insumos && data.insumos.length > 0) {
        const insumosData = data.insumos.map(insumo => ({
          surgery_request_id: solicitud.id,
          supply_id: insumo.supply_id,
          cantidad: insumo.cantidad,
        }))

        const { error: insumosError } = await supabase
          .from('surgery_request_supplies')
          .insert(insumosData)

        if (insumosError) throw insumosError
      }

      // Notificar a todos los usuarios de pabellón que hay una nueva orden sin agendar
      try {
        const { data: pabellonUsers } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'pabellon')
          .is('deleted_at', null)

        if (pabellonUsers && pabellonUsers.length > 0) {
          const notificaciones = pabellonUsers.map(u => ({
            user_id: u.id,
            tipo: 'orden_sin_agendar',
            titulo: 'Nueva orden de cirugía sin agendar',
            mensaje: `Dr. ${doctor.nombre} ${doctor.apellido} tiene un paciente pendiente de agendamiento: ${data.nombre} ${data.apellido} — ${data.codigo_operacion}`,
            relacionado_con: solicitud.id,
          }))
          await supabase.from('notifications').insert(notificaciones)
        }
      } catch {
        // No bloquear la creación de solicitud si falla la notificación
      }

      return { paciente, solicitud }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['solicitudes-doctor-pendientes'])
      queryClient.invalidateQueries({ queryKey: ['estado-slots-pabellon'] })
      queryClient.invalidateQueries(['solicitudes'])
      queryClient.invalidateQueries(['solicitudes-pendientes'])
      setFormData({
        nombre: '',
        apellido: '',
        rut: '',
        telefono: '',
        codigo_operacion: '',
        hora_recomendada: '',
        hora_fin_recomendada: '',
        fecha_preferida: '',
        operating_room_id_preferido: '',
        hora_recomendada_2: '',
        hora_fin_recomendada_2: '',
        fecha_preferida_2: '',
        operating_room_id_preferido_2: '',
        dejar_fecha_a_pabellon: true,
        horarios_extra: [],
        observaciones: '',
        insumos: [],
      })
      setSlot1Seleccionado(null)
      setSlot2Seleccionado(null)
      setShowSegundoHorario(false)
      setRutError('')
      let mensaje = 'Solicitud creada.'
      if (variables?.dejar_fecha_a_pabellon) {
        mensaje = 'Solicitud creada. Pabellón asignará fecha y hora.'
      } else if (variables?.fecha_preferida) {
        try {
          const fechaReserva = new Date(variables.fecha_preferida + 'T12:00:00')
          const diaYFecha = format(fechaReserva, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })
          mensaje = `Se creó una reserva para este día: ${diaYFecha.charAt(0).toUpperCase() + diaYFecha.slice(1)}.`
        } catch {
          mensaje = 'Solicitud creada exitosamente. El horario quedó guardado para este paciente.'
        }
      } else {
        mensaje = 'Solicitud creada exitosamente. El horario quedó guardado para este paciente.'
      }
      showSuccess(mensaje)
      // Redirigir a Horarios pabellones con la fecha del horario para que vea el slot como "Solicitado" (solo si eligió horario)
      if (variables?.fecha_preferida && !variables?.dejar_fecha_a_pabellon) {
        navigate('/doctor/horarios', { state: { fecha: variables.fecha_preferida }, replace: true })
      }
    },
    onError: (error) => {
      // Manejo de errores específicos
      let mensaje = 'Error al crear la solicitud'
      
      const errorMessage = error.message || error.toString() || 'Error desconocido'
      
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        mensaje = 'Error de conexión. Verifique su conexión a internet e intente nuevamente.'
      } else if (errorMessage.includes('duplicate key') || error.code === '23505') {
        mensaje = 'Ya existe un paciente con este RUT. La solicitud debería haberse creado usando el paciente existente.'
      } else if (errorMessage.includes('doctor debe estar activo')) {
        mensaje = 'No puede crear solicitudes. Su estado actual no permite esta acción'
      } else {
        mensaje = errorMessage
      }
      
      showError(mensaje)
    },
  })

  const agregarInsumo = () => {
    if (!insumoSeleccionado) {
      showError('Por favor seleccione un insumo')
      return
    }

    const insumo = insumos.find(i => i.id === insumoSeleccionado)
    if (!insumo) {
      showError('Insumo no encontrado')
      return
    }

    // Verificar si ya está agregado
    if (formData.insumos.some(i => i.supply_id === insumo.id)) {
      showError('Este insumo ya está agregado a la solicitud')
      return
    }

    // Validar cantidad mínima
    if (!cantidadInsumo || cantidadInsumo < 1) {
      showError('La cantidad debe ser al menos 1')
      return
    }

    const nuevoInsumo = {
      supply_id: insumo.id,
      nombre: insumo.nombre,
      codigo: insumo.codigo,
      cantidad: cantidadInsumo,
    }

    setFormData({
      ...formData,
      insumos: [...formData.insumos, nuevoInsumo],
    })

    setInsumoSeleccionado('')
    setCantidadInsumo(1)
    showSuccess(`Insumo "${insumo.nombre}" agregado correctamente`)
  }

  const eliminarInsumo = (supplyId) => {
    setFormData({
      ...formData,
      insumos: formData.insumos.filter((ins) => ins.supply_id !== supplyId),
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validar estado del doctor antes de continuar
    if (!doctor) {
      showError('No se pudo obtener la información del doctor')
      return
    }

    if (doctor.estado !== 'activo') {
      showError(`No puede crear solicitudes. Su estado actual es: ${doctor.estado === 'vacaciones' ? 'vacaciones' : doctor.estado}. Por favor, contacte al administrador si necesita crear solicitudes.`)
      return
    }

    // Validar nombre y apellido
    if (formData.nombre.trim().length < 2) {
      showError('El nombre debe tener al menos 2 caracteres')
      return
    }
    if (formData.apellido.trim().length < 2) {
      showError('El apellido debe tener al menos 2 caracteres')
      return
    }
    if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(formData.nombre)) {
      showError('El nombre debe contener letras')
      return
    }
    if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(formData.apellido)) {
      showError('El apellido debe contener letras')
      return
    }

    // Validar teléfono WhatsApp si se ingresó
    if (formData.telefono) {
      const telefonoLimpio = formData.telefono.replace(/\s/g, '')
      if (!/^\+[1-9]\d{7,14}$/.test(telefonoLimpio)) {
        showError('El teléfono debe estar en formato internacional: +56912345678')
        return
      }
    }

    // Validar formato del RUT
    if (!isValidRutFormat(formData.rut)) {
      setRutError('El formato del RUT no es válido. Use el formato: 12.345.678-9')
      showError('El formato del RUT no es válido')
      return
    }
    
    // Validar dígito verificador del RUT
    if (!validateRut(formData.rut)) {
      setRutError('El dígito verificador del RUT no es válido')
      showError('El dígito verificador del RUT no es válido. Por favor, verifique el RUT ingresado.')
      return
    }
    
    // Limpiar error si el RUT es válido
    setRutError('')
    
    // Validar código de operación
    const codigoValido = codigosOperaciones.some(c => c.codigo === formData.codigo_operacion)
    if (!codigoValido) {
      showError('Código de operación inválido. Por favor, seleccione un código válido de la lista.')
      return
    }
    
    if (formData.insumos.length === 0) {
      setShowConfirmSinInsumos(true)
      return
    }

    // Limpiar el RUT antes de enviar (remover puntos, mantener formato con guion)
    const dataToSubmit = {
      ...formData,
      rut: cleanRut(formData.rut)
    }

    crearPacienteYSolicitud.mutate(dataToSubmit)
  }

  const confirmarSinInsumos = () => {
    // Limpiar el RUT antes de enviar (remover puntos, mantener formato con guion)
    const dataToSubmit = {
      ...formData,
      rut: cleanRut(formData.rut)
    }

    crearPacienteYSolicitud.mutate(dataToSubmit)
    setShowConfirmSinInsumos(false)
  }

  // Verificar si el doctor puede crear solicitudes
  const puedeCrearSolicitud = doctor?.estado === 'activo'
  const estaEnVacaciones = doctor?.estado === 'vacaciones'

  // Progreso del formulario: qué pasos están completados
  const pasoPacienteCompleto = formData.nombre.trim().length >= 2 && formData.apellido.trim().length >= 2 && validateRut(formData.rut)
  const pasoOperacionCompleto = !!formData.codigo_operacion
  const pasoInsumosCompleto = formData.insumos.length > 0
  const pasoHorarioCompleto = formData.dejar_fecha_a_pabellon || !!formData.fecha_preferida

  const pasos = [
    { label: 'Paciente', completo: pasoPacienteCompleto },
    { label: 'Operación', completo: pasoOperacionCompleto },
    { label: 'Insumos', completo: pasoInsumosCompleto },
    { label: 'Horario', completo: pasoHorarioCompleto },
  ]
  const completados = pasos.filter(p => p.completo).length

  return (
    <div className="space-y-6">
      <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Crear Ficha de Paciente</h1>

      {/* Indicador de progreso */}
      <div className={`rounded-xl border p-4 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>
            Progreso del formulario
          </span>
          <span className={`ml-auto text-xs font-bold ${completados === pasos.length ? 'text-green-600' : (theme === 'dark' ? 'text-slate-400' : 'text-slate-500')}`}>
            {completados}/{pasos.length} completados
          </span>
        </div>
        <div className="flex gap-2">
          {pasos.map((paso, i) => (
            <div key={paso.label} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-full h-2 rounded-full transition-colors ${
                paso.completo
                  ? 'bg-blue-600'
                  : (theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200')
              }`} />
              <span className={`text-[10px] font-bold ${
                paso.completo
                  ? (theme === 'dark' ? 'text-blue-400' : 'text-blue-600')
                  : (theme === 'dark' ? 'text-slate-500' : 'text-slate-400')
              }`}>
                {i + 1}. {paso.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Alerta si el doctor está en vacaciones */}
      {estaEnVacaciones && (
        <div className="card bg-amber-50 border-2 border-amber-200">
          <div className="flex items-start gap-4">
            <div className="bg-amber-100 p-3 rounded-full flex-shrink-0">
              <Ban className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-amber-900 mb-2">Estado: En Vacaciones</h3>
              <p className="text-sm text-amber-800 mb-1">
                No puede crear solicitudes quirúrgicas mientras su estado sea "vacaciones".
              </p>
              <p className="text-xs text-amber-700">
                Si necesita crear solicitudes, por favor contacte al administrador del sistema para cambiar su estado a "activo".
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alerta si el estado es desconocido o no está disponible */}
      {doctor && !puedeCrearSolicitud && !estaEnVacaciones && (
        <div className="card bg-red-50 border-2 border-red-200">
          <div className="flex items-start gap-4">
            <div className="bg-red-100 p-3 rounded-full flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-red-900 mb-2">Estado No Válido</h3>
              <p className="text-sm text-red-800">
                Su estado actual ({doctor.estado}) no permite crear solicitudes. Por favor, contacte al administrador.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={`card ${!puedeCrearSolicitud ? 'opacity-60 pointer-events-none' : ''}`}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos del paciente */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Datos del Paciente
            </h2>
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
            <div className="mt-4">
              <label className="label-field">Teléfono WhatsApp del paciente</label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value.replace(/[^+\d\s]/g, '') })}
                className="input-field"
                placeholder="+56912345678"
              />
              <p className="text-xs text-slate-400 mt-1">Para notificar al paciente cuando se confirme su hora</p>
            </div>
            <div className="mt-4">
              <label className="label-field">RUT *</label>
              <input
                type="text"
                value={formData.rut}
                onChange={(e) => {
                  const sanitized = sanitizeRut(e.target.value)
                  const formatted = formatRut(sanitized)
                  setFormData({ ...formData, rut: formatted })
                  if (rutError) setRutError('')
                  if (pacienteEncontrado) {
                    setPacienteEncontrado(null)
                    setHistorialPaciente([])
                    setSolicitudDuplicadaAlert(false)
                    setShowHistorial(false)
                  }
                }}
                onBlur={() => {
                  if (formData.rut && isValidRutFormat(formData.rut)) {
                    if (!validateRut(formData.rut)) {
                      setRutError('El dígito verificador del RUT no es válido')
                    } else {
                      setRutError('')
                      buscarPacientePorRut(formData.rut)
                    }
                  } else if (formData.rut) {
                    setRutError('El formato del RUT no es válido')
                  }
                }}
                className={`input-field ${rutError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="12.345.678-9"
                required
                maxLength={12}
              />
              {rutError && (
                <p className="mt-1 text-sm text-red-600">{rutError}</p>
              )}
              {buscandoPaciente && (
                <p className="mt-1 text-xs text-slate-400">Buscando paciente...</p>
              )}
              {pacienteEncontrado && !buscandoPaciente && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
                    <UserPlus className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-blue-800">Paciente encontrado — datos completados</p>
                      <p className="text-xs text-blue-700">{pacienteEncontrado.nombre} {pacienteEncontrado.apellido}</p>
                    </div>
                    {historialPaciente.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowHistorial(v => !v)}
                        className="flex items-center gap-1 text-[10px] font-bold text-blue-700 hover:text-blue-900 shrink-0"
                      >
                        <History className="w-3 h-3" />
                        {historialPaciente.length} solicitud{historialPaciente.length !== 1 ? 'es' : ''}
                        {showHistorial ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>

                  {solicitudDuplicadaAlert && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-amber-800">Posible duplicado</p>
                        <p className="text-xs text-amber-700">Este paciente tiene solicitudes pendientes. Verifique antes de crear una nueva.</p>
                      </div>
                    </div>
                  )}

                  {showHistorial && historialPaciente.length > 0 && (
                    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Historial de Solicitudes</p>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {historialPaciente.map(s => (
                          <div key={s.id} className="flex items-center justify-between px-3 py-2">
                            <div>
                              <p className="text-xs font-bold text-slate-700">{s.codigo_operacion || '—'}</p>
                              <p className="text-[10px] text-slate-400">{format(new Date(s.created_at), 'dd/MM/yyyy', { locale: es })}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              s.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                              s.estado === 'aceptada' || s.estado === 'programada' ? 'bg-green-100 text-green-700' :
                              s.estado === 'rechazada' ? 'bg-red-100 text-red-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {s.estado}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Datos de la operación */}
          <div>
            <h2 className="text-xl font-bold mb-4">Datos de la Operación</h2>
            <div>
              <label className="label-field">Código de Operación *</label>
              <SearchableSelect
                options={codigosOperaciones}
                value={formData.codigo_operacion}
                onChange={(codigo) => setFormData({ ...formData, codigo_operacion: codigo })}
                placeholder="Buscar código de operación..."
                required
              />
            </div>

            {/* Desplegable: Seleccionar hora → Doctor (calendario) o Pabellón (notificación) */}
            <div className="mt-4">
              <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-slate-200' : 'text-gray-700'}`}>
                Seleccionar hora
              </label>
              <select
                value={formData.dejar_fecha_a_pabellon ? 'pabellon' : 'doctor'}
                onChange={(e) => {
                  const esPabellon = e.target.value === 'pabellon'
                  setFormData(prev => ({
                    ...prev,
                    dejar_fecha_a_pabellon: esPabellon,
                    ...(esPabellon ? {
                      fecha_preferida: '',
                      hora_recomendada: '',
                      hora_fin_recomendada: '',
                      operating_room_id_preferido: '',
                      fecha_preferida_2: '',
                      hora_recomendada_2: '',
                      hora_fin_recomendada_2: '',
                      operating_room_id_preferido_2: '',
                      horarios_extra: [],
                    } : {}),
                  }))
                  setShowCalendarioGrid(!esPabellon)
                }}
                className={`input-field max-w-md ${theme === 'dark' ? 'bg-slate-800 border-slate-600' : ''}`}
              >
                <option value="doctor">Seleccionar hora</option>
                <option value="pabellon">Pabellón toma la hora</option>
              </select>
            </div>

            {/* Opción: El doctor toma la hora → botón calendario + grid con día actual y pabellones (libre/ocupado/bloqueado) */}
            {!formData.dejar_fecha_a_pabellon && (
              <>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setShowCalendarioGrid(prev => !prev)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      theme === 'dark'
                        ? 'bg-slate-700 text-slate-100 hover:bg-slate-600 border border-slate-600'
                        : 'bg-white border border-slate-300 text-gray-700 hover:bg-slate-100'
                    }`}
                    title="Ver día actual y disponibilidad por pabellón (libre, ocupado, bloqueado)"
                  >
                    <Calendar className="w-5 h-5" />
                    <span>{showCalendarioGrid ? 'Ocultar calendario' : 'Ver calendario y disponibilidad de pabellones'}</span>
                    <LayoutGrid className="w-4 h-4 opacity-70" />
                  </button>
                  <p className={`text-xs mt-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>
                    {formData.fecha_preferida
                      ? 'Ve en qué pabellón está libre cada slot. Puede cambiar de día y volver a elegir.'
                      : 'Se muestra el día actual con todos los pabellones (libre, ocupado, bloqueado). Elija día y hora desde el calendario.'}
                  </p>
                </div>

                {showCalendarioGrid && (
                  <div className={`mt-4 p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/30 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                    <CalendarioPabellonesGrid
                      theme={theme}
                      inlineMode
                      initialFecha={location.state?.fecha || new Date().toISOString().split('T')[0]}
                      onCerrar={() => setShowCalendarioGrid(false)}
                      onConfirm={(payload) => {
                        if (!payload.slot1) {
                          setShowCalendarioGrid(false)
                          return
                        }
                        const yaTienePrimerHorario = formData.fecha_preferida && formData.hora_recomendada
                        const eligioSoloUnSlot = !payload.slot2
                        if (yaTienePrimerHorario && eligioSoloUnSlot) {
                          setFormData(prev => ({
                            ...prev,
                            fecha_preferida_2: payload.fechaPreferida || '',
                            hora_recomendada_2: payload.slot1.horaInicio || '',
                            hora_fin_recomendada_2: payload.slot1.horaFin || '',
                            operating_room_id_preferido_2: payload.slot1.operating_room_id || '',
                          }))
                          setSlot2Seleccionado({
                            operating_room_id: payload.slot1.operating_room_id,
                            nombre_pabellon: payload.slot1.nombrePabellon || '',
                            hora_inicio: payload.slot1.horaInicio,
                            hora_fin: payload.slot1.horaFin,
                          })
                          setShowSegundoHorario(true)
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            fecha_preferida: payload.fechaPreferida || '',
                            hora_recomendada: payload.slot1.horaInicio || '',
                            hora_fin_recomendada: payload.slot1.horaFin || '',
                            operating_room_id_preferido: payload.slot1.operating_room_id || '',
                            fecha_preferida_2: payload.slot2 ? (payload.fechaPreferida2 || payload.fechaPreferida) : '',
                            hora_recomendada_2: payload.slot2?.horaInicio || '',
                            hora_fin_recomendada_2: payload.slot2?.horaFin || '',
                            operating_room_id_preferido_2: payload.slot2?.operating_room_id || '',
                          }))
                          setSlot1Seleccionado({
                            operating_room_id: payload.slot1.operating_room_id,
                            nombre_pabellon: payload.slot1.nombrePabellon || '',
                            hora_inicio: payload.slot1.horaInicio,
                            hora_fin: payload.slot1.horaFin,
                          })
                          setSlot2Seleccionado(payload.slot2 ? {
                            operating_room_id: payload.slot2.operating_room_id,
                            nombre_pabellon: payload.slot2.nombrePabellon || '',
                            hora_inicio: payload.slot2.horaInicio,
                            hora_fin: payload.slot2.horaFin,
                          } : null)
                          if (payload.slot2) setShowSegundoHorario(true)
                        }
                        setShowCalendarioGrid(false)
                      }}
                    />
                  </div>
                )}
              </>
            )}

            {/* Opción: Pabellón toma la hora → mensaje y enlace para volver a elegir el doctor */}
            {formData.dejar_fecha_a_pabellon && (
              <div className={`mt-3 flex flex-wrap items-center gap-2 p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-100 border-slate-200'}`}>
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-gray-700'}`}>
                  La fecha y hora serán asignadas por pabellón. Al enviar la solicitud se notificará a pabellón para que la persona a cargo elija una hora apropiada.
                </p>
              </div>
            )}

            {/* Horarios preferidos: solo se muestra cuando ya eligió desde el calendario. Fijados: no se pueden cambiar hasta eliminar. */}
            {!formData.dejar_fecha_a_pabellon && formData.fecha_preferida && (
            <div className={`mt-4 p-4 rounded-xl border space-y-4 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>
                Horario fijado desde el calendario. No se puede cambiar hasta que lo elimine; para elegir otro, pulse Quitar y vuelva a usar el calendario.
              </p>

              {/* 1º horario: resumen fijo (estilo calendario), solo Quitar */}
              <div className={`flex flex-wrap items-center gap-2 p-3 rounded-xl border-2 border-dashed ${theme === 'dark' ? 'bg-blue-500/20 border-blue-400/50' : 'bg-blue-50 border-blue-200'}`}>
                <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-gray-800'}`}>
                  1º — {slot1Seleccionado?.nombre_pabellon || pabellonesList.find(p => p.id === formData.operating_room_id_preferido)?.nombre || 'Pabellón'} · {formData.fecha_preferida ? new Date(formData.fecha_preferida + 'T12:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''} · {formData.hora_recomendada || ''}–{formData.hora_fin_recomendada || ''}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSlot1Seleccionado(null)
                    setSlot2Seleccionado(null)
                    setShowSegundoHorario(false)
                    setFormData(prev => ({
                      ...prev,
                      fecha_preferida: '',
                      hora_recomendada: '',
                      hora_fin_recomendada: '',
                      operating_room_id_preferido: '',
                      fecha_preferida_2: '',
                      hora_recomendada_2: '',
                      hora_fin_recomendada_2: '',
                      operating_room_id_preferido_2: '',
                    }))
                  }}
                  className={`ml-auto text-sm font-medium underline ${theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  Quitar
                </button>
              </div>

              {/* Mostrar "Agregar otro día" solo cuando ya tiene 1º fijado; al pulsar se abre el panel de horarios */}
              {formData.fecha_preferida && formData.hora_recomendada && !showSegundoHorario && (
                <button
                  type="button"
                  onClick={() => {
                    setShowSegundoHorario(true)
                    setShowCalendarioGrid(true)
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border ${theme === 'dark' ? 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-300 text-gray-700 hover:bg-slate-100'}`}
                >
                  Agregar otro día
                </button>
              )}

              {/* 2º horario: resumen fijo cuando hay datos; si no, mensaje para elegir desde calendario */}
              {showSegundoHorario && (
              <>
              {(formData.fecha_preferida_2 || formData.hora_recomendada_2) ? (
                <div className={`flex flex-wrap items-center gap-2 p-3 rounded-xl border-2 border-dashed ${theme === 'dark' ? 'bg-blue-500/20 border-blue-400/50' : 'bg-blue-50 border-blue-200'}`}>
                  <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-gray-800'}`}>
                    2º — {slot2Seleccionado?.nombre_pabellon || pabellonesList.find(p => p.id === formData.operating_room_id_preferido_2)?.nombre || 'Pabellón'} · {formData.fecha_preferida_2 ? new Date(formData.fecha_preferida_2 + 'T12:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''} · {formData.hora_recomendada_2 || ''}–{formData.hora_fin_recomendada_2 || ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSlot2Seleccionado(null)
                      setFormData(prev => ({
                        ...prev,
                        fecha_preferida_2: '',
                        hora_recomendada_2: '',
                        hora_fin_recomendada_2: '',
                        operating_room_id_preferido_2: '',
                      }))
                      setShowSegundoHorario(false)
                    }}
                    className={`ml-auto text-sm font-medium underline ${theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>
                  Abra el calendario de arriba y elija otro día; use «Usar como 1º y elegir 2º (otro día)» para fijar el segundo horario.
                </p>
              )}

              {/* Horarios extra (3º, 4º, ...) */}
              {formData.horarios_extra.map((extra, idx) => (
                <div key={extra._key} className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-gray-800'}`}>
                      {idx + 3}º horario
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        horarios_extra: prev.horarios_extra.filter((_, i) => i !== idx),
                      }))}
                      className={`text-sm underline ${theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                      Quitar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3 items-end">
                    <div>
                      <label className={`block text-xs font-medium mb-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>Día</label>
                      <input
                        type="date"
                        value={extra.fecha_preferida || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          horarios_extra: prev.horarios_extra.map((h, i) => i === idx ? { ...h, fecha_preferida: sanitizeString(e.target.value) } : h),
                        }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="input-field mt-0 w-auto min-w-[140px]"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>Pabellón</label>
                      <select
                        value={extra.operating_room_id || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          horarios_extra: prev.horarios_extra.map((h, i) => i === idx ? { ...h, operating_room_id: e.target.value || '' } : h),
                        }))}
                        className={`input-field mt-0 w-auto min-w-[140px] ${theme === 'dark' ? 'bg-slate-800 border-slate-600' : ''}`}
                      >
                        <option value="">Seleccione</option>
                        {pabellonesList.map(p => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>Hora inicio</label>
                      <select
                        value={extra.hora_recomendada || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          horarios_extra: prev.horarios_extra.map((h, i) => i === idx ? { ...h, hora_recomendada: e.target.value } : h),
                        }))}
                        className={`input-field mt-0 w-auto min-w-[90px] ${theme === 'dark' ? 'bg-slate-800 border-slate-600' : ''}`}
                      >
                        <option value="">--</option>
                        {HORAS_SELECT.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>Hora fin</label>
                      <select
                        value={extra.hora_fin_recomendada || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          horarios_extra: prev.horarios_extra.map((h, i) => i === idx ? { ...h, hora_fin_recomendada: e.target.value } : h),
                        }))}
                        className={`input-field mt-0 w-auto min-w-[90px] ${theme === 'dark' ? 'bg-slate-800 border-slate-600' : ''}`}
                      >
                        <option value="">--</option>
                        {HORAS_SELECT.filter(h => !extra.hora_recomendada || h > extra.hora_recomendada).map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  horarios_extra: [...prev.horarios_extra, { _key: Date.now(), fecha_preferida: '', operating_room_id: '', hora_recomendada: '', hora_fin_recomendada: '' }],
                }))}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border ${theme === 'dark' ? 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-300 text-gray-700 hover:bg-slate-100'}`}
              >
                Añadir otra hora
              </button>
              </>
              )}
            </div>
            )}

            <div className="mt-4">
              <label className="label-field">Observaciones</label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: sanitizeString(e.target.value) })}
                className="input-field"
                rows="3"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.observaciones?.length || 0}/500 caracteres
              </p>
            </div>
          </div>

          {/* Insumos */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Insumos Requeridos
            </h2>
            {formData.codigo_operacion && (packData?.packItems?.length > 0) && (
              <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Los insumos del pack para esta operación se han añadido automáticamente. Los recomendados aparecen primero en la lista.
              </p>
            )}
            <div className="flex gap-2 mb-4">
              <div className="flex-1">
                <SearchableSelect
                  options={insumosDisponibles}
                  value={insumoSeleccionado}
                  onChange={(id) => setInsumoSeleccionado(id)}
                  placeholder={grupoFonasa ? `Insumos para esta cirugía (grupo ${grupoFonasa})` : 'Primero elija código de operación'}
                  valueKey="id"
                  displayFormat={(insumo) => `${insumo.codigo} - ${insumo.nombre}`}
                />
              </div>
              <input
                type="number"
                value={cantidadInsumo}
                onChange={(e) => setCantidadInsumo(parseInt(sanitizeNumber(e.target.value)) || 1)}
                className="input-field w-24"
                min="1"
                placeholder="Cant."
              />
              <button
                type="button"
                onClick={agregarInsumo}
                className="btn-secondary"
                disabled={!insumoSeleccionado}
              >
                Agregar
              </button>
            </div>

            {formData.insumos.length > 0 && (
              <div className={`border rounded-lg p-4 space-y-2 ${
                theme === 'dark' ? 'border-slate-600 bg-slate-800/50' : 'border-slate-200'
              }`}>
                {formData.insumos.map((insumo) => (
                  <div
                    key={insumo.supply_id}
                    className={`flex justify-between items-center p-3 rounded-lg ${
                      theme === 'dark'
                        ? 'bg-slate-700 text-slate-100'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                  >
                    <span className="font-medium">
                      {insumo.nombre} ({insumo.codigo}) - Cantidad: {insumo.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => eliminarInsumo(insumo.supply_id)}
                      className={theme === 'dark'
                        ? 'text-red-400 hover:text-red-300 font-semibold'
                        : 'text-red-600 hover:text-red-800 font-semibold'
                      }
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="btn-primary w-full py-3"
            disabled={!puedeCrearSolicitud || crearPacienteYSolicitud.isPending}
          >
            {crearPacienteYSolicitud.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" />
                Creando...
              </span>
            ) : puedeCrearSolicitud ? (
              'Crear Paciente y Solicitud'
            ) : (
              'No disponible - Estado inválido'
            )}
          </button>
        </form>
      </div>

      {/* Modal de Confirmación Sin Insumos */}
      <ConfirmModal
        isOpen={showConfirmSinInsumos}
        onClose={() => setShowConfirmSinInsumos(false)}
        onConfirm={confirmarSinInsumos}
        title="Confirmar Solicitud Sin Insumos"
        message="No ha seleccionado insumos. ¿Desea continuar con la solicitud sin insumos?"
        confirmText="Continuar"
        cancelText="Cancelar"
        variant="warning"
      />

      {/* Advertencia de navegación con datos sin guardar */}
      <ConfirmModal
        isOpen={blocker.state === 'blocked'}
        onClose={() => blocker.reset?.()}
        onConfirm={() => { blocker.proceed?.(); blocker.reset?.() }}
        title="¿Salir sin guardar?"
        message="Tienes datos ingresados que se perderán si abandonas esta página. ¿Deseas continuar?"
        confirmText="Sí, salir"
        cancelText="Quedarme"
        variant="warning"
      />
    </div>
  )
}
