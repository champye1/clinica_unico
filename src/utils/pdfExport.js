import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const BLUE = [30, 64, 175]
const DARK = [15, 23, 42]
const GRAY = [100, 116, 139]
const LIGHT = [248, 250, 252]
const WHITE = [255, 255, 255]

function addHeader(doc, clinicInfo, titulo, subtitulo = '') {
  const pageW = doc.internal.pageSize.getWidth()

  // Banda superior
  doc.setFillColor(...BLUE)
  doc.rect(0, 0, pageW, 28, 'F')

  // Nombre de la clínica
  doc.setTextColor(...WHITE)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(clinicInfo?.nombre || 'QuirúrgicaPro', 14, 10)

  // Tagline / RUT
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  const sub = [clinicInfo?.tagline, clinicInfo?.rut, clinicInfo?.telefono].filter(Boolean).join('  ·  ')
  if (sub) doc.text(sub, 14, 17)

  // Título del reporte
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(titulo.toUpperCase(), 14, 24)

  // Fecha generación (derecha)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  const fecha = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })
  doc.text(`Generado: ${fecha}`, pageW - 14, 24, { align: 'right' })

  if (subtitulo) {
    doc.setTextColor(...DARK)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(subtitulo, 14, 38)
    return 42
  }
  return 34
}

function addFooter(doc, clinicInfo) {
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const pages = doc.internal.getNumberOfPages()

  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFillColor(...LIGHT)
    doc.rect(0, pageH - 12, pageW, 12, 'F')
    doc.setTextColor(...GRAY)
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.text(clinicInfo?.direccion || '', 14, pageH - 4)
    doc.text(`Página ${i} de ${pages}`, pageW - 14, pageH - 4, { align: 'right' })
  }
}

// ── Reporte: Programa quirúrgico del día ──
export function exportProgramaDia(cirugias, fecha, clinicInfo) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const fechaStr = new Date(fecha + 'T12:00:00').toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const startY = addHeader(doc, clinicInfo, 'Programa Quirúrgico', fechaStr.charAt(0).toUpperCase() + fechaStr.slice(1))

  const rows = [...cirugias]
    .sort((a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || ''))
    .map(c => [
      `${c.hora_inicio?.slice(0, 5) || '—'} – ${c.hora_fin?.slice(0, 5) || '—'}`,
      c.operating_rooms?.nombre || '—',
      `${c.patients?.nombre || ''} ${c.patients?.apellido || ''}`.trim() || '—',
      c.patients?.rut || '—',
      `Dr. ${c.doctors?.apellido || ''}, ${c.doctors?.nombre || ''}`.trim() || '—',
      c.surgery_requests?.codigo_operacion || '—',
      (c.estado || '—').charAt(0).toUpperCase() + (c.estado || '').slice(1),
    ])

  autoTable(doc, {
    startY,
    head: [['Horario', 'Pabellón', 'Paciente', 'RUT', 'Médico', 'Código Op.', 'Estado']],
    body: rows.length ? rows : [['—', '—', 'Sin cirugías programadas', '—', '—', '—', '—']],
    headStyles: { fillColor: BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: DARK },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 28 },
      2: { cellWidth: 40 },
      3: { cellWidth: 25 },
      4: { cellWidth: 45 },
      5: { cellWidth: 35 },
      6: { cellWidth: 22 },
    },
    margin: { left: 14, right: 14 },
  })

  addFooter(doc, clinicInfo)
  doc.save(`programa-quirurgico-${fecha}.pdf`)
}

// ── Reporte: Estadísticas mensuales ──
export function exportEstadisticasMensuales(cirugias, solicitudes, periodo, clinicInfo) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const startY = addHeader(doc, clinicInfo, 'Reporte Estadístico', `Período: ${periodo}`)

  // KPIs resumen
  const total = cirugias.length
  const completadas = cirugias.filter(c => c.estado === 'completada').length
  const canceladas = cirugias.filter(c => c.estado === 'cancelada').length
  const programadas = cirugias.filter(c => c.estado === 'programada').length
  const tasa = total > 0 ? Math.round((completadas / total) * 100) : 0

  autoTable(doc, {
    startY,
    head: [['Métrica', 'Valor']],
    body: [
      ['Total cirugías', total],
      ['Completadas', `${completadas} (${tasa}%)`],
      ['Programadas', programadas],
      ['Canceladas', canceladas],
      ['Total solicitudes', solicitudes.length],
    ],
    headStyles: { fillColor: BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: DARK },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
    tableWidth: 100,
  })

  // Detalle por médico
  const porMedico = {}
  cirugias.forEach(c => {
    const key = c.doctors ? `Dr. ${c.doctors.apellido}, ${c.doctors.nombre}` : 'Sin asignar'
    if (!porMedico[key]) porMedico[key] = { completadas: 0, canceladas: 0, programadas: 0, total: 0 }
    porMedico[key][c.estado] = (porMedico[key][c.estado] || 0) + 1
    porMedico[key].total++
  })

  const medicoRows = Object.entries(porMedico)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([nombre, stats]) => [nombre, stats.total, stats.completadas || 0, stats.programadas || 0, stats.canceladas || 0])

  if (medicoRows.length) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...DARK)
    const prevY = doc.lastAutoTable.finalY + 10
    doc.text('Cirugías por Médico', 14, prevY)

    autoTable(doc, {
      startY: prevY + 4,
      head: [['Médico', 'Total', 'Completadas', 'Programadas', 'Canceladas']],
      body: medicoRows,
      headStyles: { fillColor: DARK, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: DARK },
      alternateRowStyles: { fillColor: LIGHT },
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' } },
      margin: { left: 14, right: 14 },
    })
  }

  addFooter(doc, clinicInfo)
  doc.save(`estadisticas-${periodo.replace(/\s/g, '-').toLowerCase()}.pdf`)
}

// ── Reporte: Inventario de insumos ──
export function exportInventarioInsumos(insumos, clinicInfo) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const startY = addHeader(doc, clinicInfo, 'Inventario de Insumos', `Fecha: ${new Date().toLocaleDateString('es-CL')}`)

  const stockBajo = insumos.filter(i => (i.stock_actual ?? 0) <= (i.stock_minimo ?? 0))

  if (stockBajo.length) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(185, 28, 28)
    doc.text(`⚠ ${stockBajo.length} insumo(s) con stock bajo o agotado`, 14, startY)
  }

  const rows = insumos.map(i => [
    i.nombre || '—',
    i.codigo || '—',
    i.stock_actual ?? 0,
    i.stock_minimo ?? 0,
    (i.stock_actual ?? 0) <= (i.stock_minimo ?? 0) ? '⚠ BAJO' : 'OK',
    i.unidad || '—',
  ])

  autoTable(doc, {
    startY: startY + (stockBajo.length ? 6 : 0),
    head: [['Insumo', 'Código', 'Stock actual', 'Stock mín.', 'Estado', 'Unidad']],
    body: rows.length ? rows : [['Sin insumos registrados', '', '', '', '', '']],
    headStyles: { fillColor: BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: DARK },
    alternateRowStyles: { fillColor: LIGHT },
    didParseCell: (data) => {
      if (data.column.index === 4 && data.cell.raw === '⚠ BAJO') {
        data.cell.styles.textColor = [185, 28, 28]
        data.cell.styles.fontStyle = 'bold'
      }
    },
    columnStyles: { 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' } },
    margin: { left: 14, right: 14 },
  })

  addFooter(doc, clinicInfo)
  doc.save(`inventario-insumos-${new Date().toISOString().slice(0, 10)}.pdf`)
}
