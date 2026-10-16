export const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export const isBlank = (r) => !r.fecha && !r.nota && !r.resultado && !r.condicion && !r.observaciones

export function todayStr() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

// Devuelve Date o null si el texto no es una fecha dd/mm/aaaa real.
export function parseFecha(txt) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(txt.trim())
  if (!m) return null
  const [d, mo, y] = [+m[1], +m[2], +m[3]]
  const date = new Date(y, mo - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null
  return date
}

export function derivarCursada(nota) {
  const n = Number(nota)
  if (!n) return {}
  if (n < 4) return { resultado: 'Reprobado', condicion: 'Libre' }
  if (n < 7) return { resultado: 'Aprobado', condicion: 'Regular' }
  return { resultado: 'Aprobado', condicion: 'Promoción' }
}

export function derivarPromocion(nota) {
  const n = Number(nota)
  if (!n) return {}
  return { resultado: n >= 7 ? 'Aprobado' : 'Reprobado' }
}

const label = (tipo) => (tipo === 'cursada' ? 'Cursada' : 'Promoción')

// Valida una fila ya iniciada. Devuelve [{ campo, msg }].
function validarFila(tipo, r, cursada) {
  const errs = []
  const add = (campo, msg) => errs.push({ campo, msg })

  if (!r.fecha.trim()) add('fecha', 'Falta la fecha (dd/mm/aaaa).')
  else {
    const f = parseFecha(r.fecha)
    if (!f) add('fecha', `La fecha "${r.fecha}" no es válida. Usá el formato dd/mm/aaaa.`)
  }

  if (!r.resultado) add('resultado', 'Falta el resultado.')
  if (r.resultado === 'Ausente') {
    if (r.nota) add('nota', 'Un alumno Ausente no debe tener nota.')
  } else {
    if (!r.nota) add('nota', 'Falta la nota.')
    else if (r.resultado) {
      const n = Number(r.nota)
      const aprueba = tipo === 'cursada' ? n >= 4 : n >= 7
      if (r.resultado === 'Aprobado' && !aprueba) add('resultado', `Con nota ${r.nota} el resultado no puede ser Aprobado.`)
      if (r.resultado === 'Reprobado' && aprueba) add('resultado', `Con nota ${r.nota} el resultado no puede ser Reprobado.`)
    }
  }

  if (tipo === 'cursada') {
    if (!r.condicion) add('condicion', 'Falta la condición.')
    else if (r.resultado) {
      if (r.resultado !== 'Aprobado' && r.condicion !== 'Libre') add('condicion', 'Si el resultado no es Aprobado la condición debe ser Libre.')
      if (r.resultado === 'Aprobado' && r.condicion === 'Libre') add('condicion', 'Un alumno Aprobado no puede quedar Libre.')
      if (r.condicion === 'Promoción' && Number(r.nota) < 7) add('condicion', 'Para promocionar la nota debe ser 7 o más.')
    }
  }

  if (r.observaciones.length > 200) add('observaciones', 'Las observaciones no pueden superar los 200 caracteres.')
  return errs
}

// rows: { [dni]: { cursada, promocion } }, locked: { 'cursada-<dni>': acta }.
// Devuelve [{ key, msg }]; key = `${tipo}-${dni}-${campo}` (para marcar el campo).
export function validarTodo(students, rows, locked) {
  const out = []
  let hayDatos = false
  for (const s of students) {
    const who = `${s.apellido}, ${s.nombre} (DNI ${s.dni})`
    const { cursada, promocion } = rows[s.dni]
    const pend = (t) => !locked[`${t}-${s.dni}`]
    const push = (tipo, campo, msg) => out.push({ key: `${tipo}-${s.dni}-${campo}`, msg: `${who} – ${label(tipo)}: ${msg}` })

    if (pend('cursada') && !isBlank(cursada)) {
      hayDatos = true
      validarFila('cursada', cursada).forEach((e) => push('cursada', e.campo, e.msg))
    }
    if (pend('promocion') && !isBlank(promocion)) {
      hayDatos = true
      if (isBlank(cursada)) push('promocion', 'nota', 'No se puede cargar promoción sin cursada.')
      else if (cursada.condicion !== 'Promoción') push('promocion', 'nota', 'Solo se carga promoción si la condición de cursada es "Promoción".')
      validarFila('promocion', promocion, cursada).forEach((e) => push('promocion', e.campo, e.msg))
    } else if (pend('promocion') && pend('cursada') && cursada.condicion === 'Promoción' && isBlank(promocion)) {
      hayDatos = true
      push('promocion', 'nota', 'La condición de cursada es "Promoción" pero falta cargar la nota de promoción.')
    }
  }
  if (!hayDatos) out.push({ key: null, msg: 'No hay ninguna nota cargada para guardar.' })
  return out
}
