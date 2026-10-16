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
