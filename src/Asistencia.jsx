import { useMemo, useState } from 'react'
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar,
  Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material'
import { ESTADOS_ASISTENCIA, HORAS_CLASE, STUDENTS, TIPOS_CLASE } from './data.js'
import { parseFecha } from './rules.js'
import { descargarAsistencia } from './pdf.js'
import ErrorDialog from './ErrorDialog.jsx'
import { gridBtn, inputSx, titleSx } from './ui.js'

const slug = (e) => e.toLowerCase()
const initialMarks = () => Object.fromEntries(STUDENTS.map((s) => [s.dni, { estado: '', obs: '' }]))

export default function Asistencia({ clases, setClases }) {
  const [fecha, setFecha] = useState('')
  const [tipo, setTipo] = useState('')
  const [horas, setHoras] = useState('')
  const [tema, setTema] = useState('')
  const [marks, setMarks] = useState(initialMarks)
  const [errores, setErrores] = useState([])
  const [erroresOpen, setErroresOpen] = useState(false)
  const [guardada, setGuardada] = useState(null)
  const [toast, setToast] = useState(null)
  const errKeys = useMemo(() => new Map(errores.filter((e) => e.key).map((e) => [e.key, e.msg])), [errores])

  const porcentajes = useMemo(() => {
    const out = {}
    for (const s of STUDENTS) {
      if (!clases.length) { out[s.dni] = '-'; continue }
      const ok = clases.filter((c) => c.registros.find((r) => r.student.dni === s.dni).estado !== 'Ausente').length
      out[s.dni] = `${Math.round((ok / clases.length) * 100)}%`
    }
    return out
  }, [clases])

  const clearErr = (key) => errores.length && setErrores((e) => e.filter((x) => x.key !== key))
  const setMark = (dni, campo, valor) => {
    setMarks((m) => ({ ...m, [dni]: { ...m[dni], [campo]: valor } }))
    clearErr(`asistencia-${dni}-${campo === 'estado' ? 'estado' : 'observaciones'}`)
  }

  const validar = () => {
    const out = []
    const add = (key, msg) => out.push({ key, msg })
    if (!fecha.trim()) add('asistencia-fecha', 'Clase: Falta la fecha de la clase (dd/mm/aaaa).')
    else if (!parseFecha(fecha)) add('asistencia-fecha', `Clase: La fecha "${fecha}" no es válida. Usá el formato dd/mm/aaaa.`)
    if (!tipo) add('asistencia-tipo', 'Clase: Falta el tipo de clase.')
    if (!horas) add('asistencia-horas', 'Clase: Faltan las horas dictadas.')
    if (fecha && tipo && clases.some((c) => c.fecha === fecha.trim() && c.tipo === tipo)) {
      add('asistencia-fecha', `Clase: Ya hay una clase ${tipo} cargada para el ${fecha}.`)
    }
    for (const s of STUDENTS) {
      const who = `${s.apellido}, ${s.nombre} (DNI ${s.dni})`
      const m = marks[s.dni]
      if (!m.estado) add(`asistencia-${s.dni}-estado`, `${who} – Falta marcar la asistencia.`)
      else if (m.estado === 'Justificado' && !m.obs.trim()) add(`asistencia-${s.dni}-observaciones`, `${who} – Una ausencia justificada requiere observación (motivo).`)
      if (m.obs.length > 200) add(`asistencia-${s.dni}-observaciones`, `${who} – Las observaciones no pueden superar los 200 caracteres.`)
    }
    return out
  }

  const guardar = () => {
    const errs = validar()
    if (errs.length) { setErrores(errs); setErroresOpen(true); return }
    const clase = {
      fecha: fecha.trim(), tipo, horas, tema: tema.trim(),
      registros: STUDENTS.map((s) => ({ student: s, estado: marks[s.dni].estado, obs: marks[s.dni].obs })),
    }
    setClases((c) => [...c, clase])
    setGuardada(clase)
    setErrores([])
    setMarks(initialMarks())
    setFecha(''); setTema('')
  }

  // El % del PDF se calcula con las clases ya guardadas más la que se acaba de guardar.
  const pdf = (lista) => {
    if (!lista.length) {
      setErrores([{ key: null, msg: 'Todavía no hay clases guardadas para descargar. Cargá la asistencia y presioná "Guardar" primero.' }])
      setErroresOpen(true)
      return
    }
    const pct = {}
    for (const s of STUDENTS) {
      const ok = lista.filter((c) => c.registros.find((r) => r.student.dni === s.dni).estado !== 'Ausente').length
      pct[s.dni] = `${Math.round((ok / lista.length) * 100)}%`
    }
    descargarAsistencia(lista, pct)
  }

  const todosPresentes = () => {
    setMarks((m) => Object.fromEntries(Object.entries(m).map(([dni, v]) => [dni, { ...v, estado: 'Presente' }])))
    setErrores((e) => e.filter((x) => !x.key?.endsWith('-estado')))
  }

  const campo = (id, extra = {}) => ({
    id, name: id, 'data-key': id, title: errKeys.get(id) ?? '', 'aria-invalid': errKeys.has(id) || undefined,
    sx: inputSx(errKeys.has(id)), ...extra,
  })
  const label = { fontSize: 13, color: '#444' }

  return (
    <Box sx={{ maxWidth: 1360, mx: 'auto', p: 2 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1, borderBottom: '1px solid #eee', pb: 1 }}>
        <Typography component="h1" sx={titleSx}>Carga de asistencia</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button id="btn-todos-presentes" {...gridBtn} onClick={todosPresentes}>Marcar todos presentes</Button>
          <Button id="btn-limpiar-asistencia" {...gridBtn} onClick={() => { setMarks(initialMarks()); setErrores([]) }}>Limpiar</Button>
        </Box>
      </Box>

      <Box sx={{ bgcolor: '#f3f3f3', mt: 1.5, p: 1.5, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 2 }}>
        <Box><div style={label}>Fecha de clase</div>
          <Box component="input" type="text" placeholder="dd/mm/aaaa" maxLength={10} autoComplete="off" value={fecha}
            onChange={(e) => { setFecha(e.target.value); clearErr('asistencia-fecha') }} {...campo('asistencia-fecha', { sx: { ...inputSx(errKeys.has('asistencia-fecha')), width: 120 } })} /></Box>
        <Box><div style={label}>Tipo de clase</div>
          <Box component="select" value={tipo} onChange={(e) => { setTipo(e.target.value); clearErr('asistencia-tipo') }} {...campo('asistencia-tipo', { sx: { ...inputSx(errKeys.has('asistencia-tipo')), width: 150 } })}>
            <option value="">-</option>{TIPOS_CLASE.map((t) => <option key={t} value={t}>{t}</option>)}
          </Box></Box>
        <Box><div style={label}>Horas dictadas</div>
          <Box component="select" value={horas} onChange={(e) => { setHoras(e.target.value); clearErr('asistencia-horas') }} {...campo('asistencia-horas', { sx: { ...inputSx(errKeys.has('asistencia-horas')), width: 80 } })}>
            <option value="">-</option>{HORAS_CLASE.map((h) => <option key={h} value={h}>{h}</option>)}
          </Box></Box>
        <Box sx={{ flex: 1, minWidth: 200 }}><div style={label}>Tema de la clase (opcional)</div>
          <Box component="input" type="text" autoComplete="off" value={tema} onChange={(e) => setTema(e.target.value)} {...campo('asistencia-tema')} /></Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button id="btn-pdf-asistencia" variant="outlined" color="error" size="small" onClick={() => pdf(clases)} sx={{ bgcolor: '#fff', minWidth: 70, fontWeight: 700 }}>PDF</Button>
          <Button id="btn-guardar-asistencia" variant="contained" size="small" onClick={guardar} sx={{ textTransform: 'none', bgcolor: '#6ab3d1', boxShadow: 'none', '&:hover': { bgcolor: '#4a9dc1' } }}>Guardar</Button>
        </Box>
      </Box>

      <Table id="tabla-asistencia" size="small" sx={{ mt: 1, border: '1px solid #ddd', '& td, & th': { borderColor: '#eee', p: '3px 6px' } }}>
        <TableHead>
          <TableRow>
            {['Alumno', '% Asist.', 'Asistencia', 'Observaciones'].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {STUDENTS.map((s, i) => {
            const k = `asistencia-${s.dni}-estado`
            const ko = `asistencia-${s.dni}-observaciones`
            return (
              <TableRow key={s.dni} data-dni={s.dni} sx={{ bgcolor: i % 2 ? '#fafafa' : '#fff' }}>
                <TableCell sx={{ minWidth: 230 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Box sx={{ width: 40, height: 40, bgcolor: '#ddd', flexShrink: 0 }} />
                    <Box><div>{s.apellido}, {s.nombre}</div><div>DNI {s.dni}</div></Box>
                  </Box>
                </TableCell>
                <TableCell align="center">{porcentajes[s.dni]}</TableCell>
                <TableCell data-key={k} title={errKeys.get(k) ?? ''} sx={errKeys.has(k) ? { bgcolor: '#fdecea', outline: '1px solid #d32f2f' } : undefined}>
                  <Box role="radiogroup" sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {ESTADOS_ASISTENCIA.map((e) => (
                      <label key={e} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                        <input type="radio" id={`asistencia-${s.dni}-${slug(e)}`} name={`asistencia-${s.dni}`} value={e}
                          checked={marks[s.dni].estado === e} onChange={() => setMark(s.dni, 'estado', e)} />
                        {e}
                      </label>
                    ))}
                  </Box>
                </TableCell>
                <TableCell sx={{ width: '30%' }}>
                  <Box component="input" type="text" autoComplete="off" value={marks[s.dni].obs}
                    onChange={(e) => setMark(s.dni, 'obs', e.target.value)} {...campo(ko)} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <Typography sx={{ mt: 3, mb: 1, fontWeight: 700, fontSize: 18, color: '#333' }}>Clases cargadas</Typography>
      <Table id="clases-cargadas" size="small" sx={{ border: '1px solid #ddd', '& td, & th': { borderColor: '#eee' } }}>
        <TableHead>
          <TableRow>{['Fecha', 'Tipo', 'Horas', 'Presentes', 'Ausentes', 'Tarde', 'Justificados', ''].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}</TableRow>
        </TableHead>
        <TableBody>
          {clases.map((c, i) => {
            const n = (e) => c.registros.filter((r) => r.estado === e).length
            return (
              <TableRow key={i} sx={{ bgcolor: i % 2 ? '#f5f7fa' : '#fff' }}>
                <TableCell>{c.fecha}</TableCell><TableCell>{c.tipo}</TableCell><TableCell>{c.horas}</TableCell>
                <TableCell>{n('Presente')}</TableCell><TableCell>{n('Ausente')}</TableCell><TableCell>{n('Tarde')}</TableCell><TableCell>{n('Justificado')}</TableCell>
                <TableCell align="right"><Button size="small" onClick={() => pdf([c])}>PDF</Button></TableCell>
              </TableRow>
            )
          })}
          {!clases.length && <TableRow><TableCell colSpan={8} align="center" sx={{ py: 2, color: '#777' }}>Todavía no se cargó ninguna clase.</TableCell></TableRow>}
        </TableBody>
      </Table>

      <ErrorDialog open={erroresOpen} errores={errores} onClose={() => setErroresOpen(false)} id="dialog-errores-asistencia" />

      <Dialog open={!!guardada} onClose={() => setGuardada(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Asistencia guardada</DialogTitle>
        <DialogContent id="dialog-exito-asistencia">
          <Alert severity="success" sx={{ mb: 1 }}>La asistencia se guardó correctamente.</Alert>
          {guardada && <Typography>Clase {guardada.tipo} del {guardada.fecha} ({guardada.horas} h): {guardada.registros.length} alumnos.</Typography>}
        </DialogContent>
        <DialogActions>
          <Button id="btn-descargar-asistencia" onClick={() => { pdf(clases); setGuardada(null) }}>Descargar PDF</Button>
          <Button id="btn-cerrar-exito-asistencia" onClick={() => setGuardada(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}>
        {toast ? <Alert severity="info" onClose={() => setToast(null)}>{toast}</Alert> : undefined}
      </Snackbar>
    </Box>
  )
}
