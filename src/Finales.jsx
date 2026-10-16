import { useMemo, useState } from 'react'
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar,
  Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material'
import { FINAL_CONDICION, MESAS, NOTAS, RESULTADOS, STUDENTS } from './data.js'
import { isBlank, norm, parseFecha, todayStr } from './rules.js'
import { descargarActaFinal } from './pdf.js'
import ErrorDialog from './ErrorDialog.jsx'
import { gridBtn, inputSx, titleSx } from './ui.js'

const blank = () => ({ nota: '', resultado: '', observaciones: '' })
const initialRows = () => Object.fromEntries(STUDENTS.map((s) => [s.dni, blank()]))
const derivar = (nota) => (nota ? { resultado: Number(nota) >= 4 ? 'Aprobado' : 'Reprobado' } : {})
const rinde = (dni) => FINAL_CONDICION[dni] !== 'Promocionado'

export default function Finales() {
  const [cab, setCab] = useState({ mesa: '', fecha: '', libro: '', folio: '', presidente: '' })
  const [rows, setRows] = useState(initialRows)
  const [locked, setLocked] = useState({}) // dni -> nº de acta
  const [actas, setActas] = useState([])
  const [nextActa, setNextActa] = useState(7001)
  const [busqueda, setBusqueda] = useState('')
  const [errores, setErrores] = useState([])
  const [erroresOpen, setErroresOpen] = useState(false)
  const [exito, setExito] = useState(null)
  const [toast, setToast] = useState(null)
  const errKeys = useMemo(() => new Map(errores.filter((e) => e.key).map((e) => [e.key, e.msg])), [errores])

  const clearErr = (key) => errores.length && setErrores((e) => e.filter((x) => x.key !== key))
  const setCabField = (campo, v) => { setCab((c) => ({ ...c, [campo]: v })); clearErr(`final-${campo}`) }
  const setRow = (dni, campo, v) => { setRows((r) => ({ ...r, [dni]: { ...r[dni], [campo]: v } })); clearErr(`final-${dni}-${campo}`) }

  const calcular = () => {
    setRows((prev) => Object.fromEntries(Object.entries(prev).map(([dni, r]) =>
      [dni, locked[dni] || !rinde(dni) ? r : { ...r, ...derivar(r.nota) }])))
    setToast('Resultado recalculado según la nota (4 o más aprueba).')
  }

  const validar = () => {
    const out = []
    const add = (key, msg) => out.push({ key, msg })
    if (!cab.mesa) add('final-mesa', 'Mesa de examen: Falta elegir la mesa.')
    if (!cab.fecha.trim()) add('final-fecha', 'Mesa de examen: Falta la fecha del examen (dd/mm/aaaa).')
    else if (!parseFecha(cab.fecha)) add('final-fecha', `Mesa de examen: La fecha "${cab.fecha}" no es válida. Usá el formato dd/mm/aaaa.`)
    if (!cab.libro.trim()) add('final-libro', 'Mesa de examen: Falta el número de libro.')
    else if (!/^\d+$/.test(cab.libro.trim())) add('final-libro', 'Mesa de examen: El libro debe ser un número.')
    if (!cab.folio.trim()) add('final-folio', 'Mesa de examen: Falta el número de folio.')
    else if (!/^\d+$/.test(cab.folio.trim())) add('final-folio', 'Mesa de examen: El folio debe ser un número.')
    if (!cab.presidente.trim()) add('final-presidente', 'Mesa de examen: Falta el presidente del tribunal.')

    let hay = false
    for (const s of STUDENTS) {
      if (locked[s.dni] || !rinde(s.dni)) continue
      const r = rows[s.dni]
      if (isBlank({ fecha: '', condicion: '', ...r })) continue
      hay = true
      const who = `${s.apellido}, ${s.nombre} (DNI ${s.dni})`
      const push = (campo, msg) => add(`final-${s.dni}-${campo}`, `${who} – ${msg}`)
      if (!r.resultado) push('resultado', 'Falta el resultado.')
      if (r.resultado === 'Ausente') {
        if (r.nota) push('nota', 'Un alumno Ausente no debe tener nota.')
      } else {
        if (!r.nota) push('nota', 'Falta la nota.')
        else if (r.resultado) {
          const aprueba = Number(r.nota) >= 4
          if (r.resultado === 'Aprobado' && !aprueba) push('resultado', `Con nota ${r.nota} el resultado no puede ser Aprobado.`)
          if (r.resultado === 'Reprobado' && aprueba) push('resultado', `Con nota ${r.nota} el resultado no puede ser Reprobado.`)
        }
      }
      if (r.observaciones.length > 200) push('observaciones', 'Las observaciones no pueden superar los 200 caracteres.')
    }
    if (!hay) add(null, 'No hay ninguna nota de examen cargada para guardar.')
    return out
  }

  const guardar = () => {
    const errs = validar()
    if (errs.length) { setErrores(errs); setErroresOpen(true); return }
    setErrores([])
    const filas = STUDENTS.filter((s) => !locked[s.dni] && rinde(s.dni) && !isBlank({ fecha: '', condicion: '', ...rows[s.dni] }))
      .map((s) => ({ student: s, condicion: FINAL_CONDICION[s.dni], row: rows[s.dni] }))
    const acta = { numero: nextActa, ...cab, fecha: cab.fecha.trim(), libro: cab.libro.trim(), folio: cab.folio.trim(), presidente: cab.presidente.trim(), fechaEmision: todayStr(), filas }
    setLocked((l) => ({ ...l, ...Object.fromEntries(filas.map((f) => [f.student.dni, nextActa])) }))
    setActas((a) => [...a, acta])
    setNextActa((n) => n + 1)
    setExito(acta)
  }

  const pdf = () => {
    if (!actas.length) {
      setErrores([{ key: null, msg: 'Todavía no hay actas para descargar. Cargá las notas y presioná "Guardar" primero.' }])
      setErroresOpen(true)
      return
    }
    descargarActaFinal(actas[actas.length - 1])
  }

  const visibles = STUDENTS.filter((s) => !busqueda || norm(s.apellido).includes(norm(busqueda.trim())))
  const campo = (id, extra = {}) => ({
    id, name: id, 'data-key': id, title: errKeys.get(id) ?? '', 'aria-invalid': errKeys.has(id) || undefined,
    sx: inputSx(errKeys.has(id)), ...extra,
  })
  const label = { fontSize: 13, color: '#444' }
  const ancho = (id, w) => ({ sx: { ...inputSx(errKeys.has(id)), width: w } })

  return (
    <Box sx={{ maxWidth: 1360, mx: 'auto', p: 2 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1, borderBottom: '1px solid #eee', pb: 1 }}>
        <Typography component="h1" sx={titleSx}>Carga de notas de examen final</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button id="btn-calcular-final" {...gridBtn} onClick={calcular}>Calcular resultado</Button>
        </Box>
      </Box>

      <Box sx={{ bgcolor: '#f3f3f3', mt: 1.5, p: 1.5, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 2 }}>
        <Box><div style={label}>Mesa de examen</div>
          <Box component="select" value={cab.mesa} onChange={(e) => setCabField('mesa', e.target.value)} {...campo('final-mesa', ancho('final-mesa', 220))}>
            <option value="">-</option>{MESAS.map((m) => <option key={m} value={m}>{m}</option>)}
          </Box></Box>
        <Box><div style={label}>Fecha del examen</div>
          <Box component="input" type="text" placeholder="dd/mm/aaaa" maxLength={10} autoComplete="off" value={cab.fecha} onChange={(e) => setCabField('fecha', e.target.value)} {...campo('final-fecha', ancho('final-fecha', 110))} /></Box>
        <Box><div style={label}>Libro</div>
          <Box component="input" type="text" inputMode="numeric" autoComplete="off" value={cab.libro} onChange={(e) => setCabField('libro', e.target.value)} {...campo('final-libro', ancho('final-libro', 70))} /></Box>
        <Box><div style={label}>Folio</div>
          <Box component="input" type="text" inputMode="numeric" autoComplete="off" value={cab.folio} onChange={(e) => setCabField('folio', e.target.value)} {...campo('final-folio', ancho('final-folio', 70))} /></Box>
        <Box sx={{ flex: 1, minWidth: 200 }}><div style={label}>Presidente del tribunal</div>
          <Box component="input" type="text" autoComplete="off" value={cab.presidente} onChange={(e) => setCabField('presidente', e.target.value)} {...campo('final-presidente')} /></Box>
        <Box><div style={label}>Búsqueda por apellido</div>
          <Box component="input" id="busqueda-apellido-final" type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} sx={{ ...inputSx(), width: 160 }} /></Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button id="btn-pdf-final" variant="outlined" color="error" size="small" onClick={pdf} sx={{ bgcolor: '#fff', minWidth: 70, fontWeight: 700 }}>PDF</Button>
          <Button id="btn-guardar-final" variant="contained" size="small" onClick={guardar} sx={{ textTransform: 'none', bgcolor: '#6ab3d1', boxShadow: 'none', '&:hover': { bgcolor: '#4a9dc1' } }}>Guardar</Button>
        </Box>
      </Box>

      <Table id="tabla-finales" size="small" sx={{ mt: 1, border: '1px solid #ddd', '& td, & th': { borderColor: '#eee', p: '3px 6px' } }}>
        <TableHead>
          <TableRow>{['Alumno', 'Condición', 'Acta', 'Nota', 'Resultado', 'Observaciones'].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}</TableRow>
        </TableHead>
        <TableBody>
          {visibles.map((s, i) => {
            const bloqueado = !!locked[s.dni] || !rinde(s.dni)
            const r = rows[s.dni]
            const f = (campo) => ({
              ...campo_(s.dni, campo), value: r[campo], disabled: bloqueado,
              onChange: (e) => setRow(s.dni, campo, e.target.value),
            })
            const campo_ = (dni, c) => campo(`final-${dni}-${c}`)
            return (
              <TableRow key={s.dni} data-dni={s.dni} sx={{ bgcolor: !rinde(s.dni) ? '#eee' : i % 2 ? '#fafafa' : '#fff' }}>
                <TableCell sx={{ minWidth: 230 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Box sx={{ width: 40, height: 40, bgcolor: '#ddd', flexShrink: 0 }} />
                    <Box><div>{s.apellido}, {s.nombre}</div><div>DNI {s.dni}</div></Box>
                  </Box>
                </TableCell>
                <TableCell>{FINAL_CONDICION[s.dni]}</TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                  {!rinde(s.dni) ? 'No rinde' : `Final ( ${locked[s.dni] ? `Acta ${locked[s.dni]}` : 'Sin acta'} )`}
                </TableCell>
                <TableCell sx={{ width: 90 }}>
                  <Box component="select" {...f('nota')}><option value="">-</option>{NOTAS.map((n) => <option key={n} value={n}>{n}</option>)}</Box>
                </TableCell>
                <TableCell sx={{ width: 130 }}>
                  <Box component="select" {...f('resultado')}><option value="">-</option>{RESULTADOS.map((n) => <option key={n} value={n}>{n}</option>)}</Box>
                </TableCell>
                <TableCell><Box component="input" type="text" autoComplete="off" {...f('observaciones')} /></TableCell>
              </TableRow>
            )
          })}
          {!visibles.length && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3, color: '#777' }}>No se encontraron alumnos.</TableCell></TableRow>}
        </TableBody>
      </Table>

      <ErrorDialog open={erroresOpen} errores={errores} onClose={() => setErroresOpen(false)} id="dialog-errores-final" />

      <Dialog open={!!exito} onClose={() => setExito(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Notas guardadas</DialogTitle>
        <DialogContent id="dialog-exito-final">
          <Alert severity="success" sx={{ mb: 1 }}>La carga se guardó correctamente.</Alert>
          {exito && <Typography>Acta de examen final N° {exito.numero} ({exito.mesa}): {exito.filas.length} alumno(s)</Typography>}
        </DialogContent>
        <DialogActions>
          <Button id="btn-descargar-acta-final" onClick={() => { descargarActaFinal(exito); setExito(null) }}>Descargar acta (PDF)</Button>
          <Button id="btn-cerrar-exito-final" onClick={() => setExito(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}>
        {toast ? <Alert severity="success" onClose={() => setToast(null)}>{toast}</Alert> : undefined}
      </Snackbar>
    </Box>
  )
}
