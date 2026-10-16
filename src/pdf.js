import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { COMISION } from './data.js'

// acta = { numero, tipo: 'cursada'|'promocion', fecha, filas: [{ student, row }] }
export function descargarActas(actas) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  actas.forEach((acta, i) => {
    if (i > 0) doc.addPage()
    const esCursada = acta.tipo === 'cursada'
    doc.setFontSize(16).setFont('helvetica', 'bold').text(esCursada ? 'ACTA DE CURSADA' : 'ACTA DE PROMOCIÓN', 40, 50)
    doc.setFontSize(11).setFont('helvetica', 'normal')
    doc.text(`Acta N° ${acta.numero}`, 40, 72)
    doc.text(`Materia: ${COMISION.materia}`, 40, 88)
    doc.text(`${COMISION.comision} - ${COMISION.periodo}`, 40, 104)
    doc.text(`Fecha de emisión: ${acta.fecha}`, 600, 72)

    autoTable(doc, {
      startY: 120,
      head: [['N°', 'Alumno', 'DNI', 'Fecha', 'Nota', 'Resultado', ...(esCursada ? ['Condición'] : []), 'Observaciones']],
      body: acta.filas.map(({ student: s, row: r }, n) => [
        n + 1,
        `${s.apellido}, ${s.nombre}`,
        s.dni,
        r.fecha,
        r.nota || '-',
        r.resultado,
        ...(esCursada ? [r.condicion] : []),
        r.observaciones,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [10, 133, 200] },
    })

    const y = Math.min(doc.lastAutoTable.finalY + 80, 540)
    doc.line(80, y, 280, y)
    doc.line(520, y, 720, y)
    doc.setFontSize(9)
    doc.text('Firma del docente', 140, y + 14)
    doc.text('Aclaración', 590, y + 14)
  })
  doc.save(actas.length === 1 ? `acta-${actas[0].numero}.pdf` : 'actas-de-notas.pdf')
}

const encabezadoPdf = (doc, titulo, lineas) => {
  doc.setFontSize(16).setFont('helvetica', 'bold').text(titulo, 40, 50)
  doc.setFontSize(11).setFont('helvetica', 'normal')
  lineas.forEach((l, i) => doc.text(l, 40, 72 + i * 16))
  return 72 + lineas.length * 16 + 12
}

// clases: [{ fecha, tipo, horas, tema, registros: [{ student, estado, obs }] }]; porcentajes: { dni: '85%' }
export function descargarAsistencia(clases, porcentajes) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  clases.forEach((c, i) => {
    if (i > 0) doc.addPage()
    const y = encabezadoPdf(doc, 'PARTE DE ASISTENCIA', [
      `Materia: ${COMISION.materia} - ${COMISION.comision} - ${COMISION.periodo}`,
      `Fecha de clase: ${c.fecha}   Tipo: ${c.tipo}   Horas: ${c.horas}${c.tema ? `   Tema: ${c.tema}` : ''}`,
    ])
    autoTable(doc, {
      startY: y,
      head: [['N°', 'Alumno', 'DNI', 'Asistencia', 'Observaciones']],
      body: c.registros.map(({ student: s, estado, obs }, n) => [n + 1, `${s.apellido}, ${s.nombre}`, s.dni, estado, obs]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [10, 133, 200] },
    })
  })
  doc.addPage()
  const y = encabezadoPdf(doc, 'RESUMEN DE ASISTENCIA', [
    `Materia: ${COMISION.materia} - ${COMISION.comision} - ${COMISION.periodo}`,
    `Clases registradas: ${clases.length}`,
  ])
  const alumnos = clases[0].registros.map((r) => r.student)
  autoTable(doc, {
    startY: y,
    head: [['Alumno', 'DNI', ...clases.map((c) => c.fecha), '% Asist.']],
    body: alumnos.map((s) => [
      `${s.apellido}, ${s.nombre}`, s.dni,
      ...clases.map((c) => c.registros.find((r) => r.student.dni === s.dni).estado.charAt(0)),
      porcentajes[s.dni],
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [10, 133, 200] },
  })
  doc.setFontSize(8).text('P = Presente, A = Ausente, T = Tarde, J = Justificado. Presente, Tarde y Justificado suman asistencia.', 40, 570)
  doc.save('asistencia.pdf')
}

// acta = { numero, mesa, fecha, libro, folio, presidente, fechaEmision, filas: [{ student, condicion, row }] }
export function descargarActaFinal(acta) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const y = encabezadoPdf(doc, 'ACTA DE EXAMEN FINAL', [
    `Acta N° ${acta.numero}   Libro: ${acta.libro}   Folio: ${acta.folio}`,
    `Materia: ${COMISION.materia}`,
    `Mesa: ${acta.mesa}   Fecha de examen: ${acta.fecha}`,
    `Presidente del tribunal: ${acta.presidente}`,
  ])
  autoTable(doc, {
    startY: y,
    head: [['N°', 'Alumno', 'DNI', 'Condición', 'Nota', 'Resultado', 'Observaciones']],
    body: acta.filas.map(({ student: s, condicion, row }, n) => [n + 1, `${s.apellido}, ${s.nombre}`, s.dni, condicion, row.nota || '-', row.resultado, row.observaciones]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [10, 133, 200] },
  })
  const fy = Math.min(doc.lastAutoTable.finalY + 80, 540)
  doc.line(80, fy, 280, fy)
  doc.line(520, fy, 720, fy)
  doc.setFontSize(9)
  doc.text('Presidente del tribunal', 140, fy + 14)
  doc.text('Vocal', 600, fy + 14)
  doc.save(`acta-final-${acta.numero}.pdf`)
}
