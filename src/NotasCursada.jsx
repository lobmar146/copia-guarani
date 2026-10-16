import { useMemo, useRef, useState } from 'react'
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar,
  Table, TableBody, TableCell, TableHead, TableRow, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material'
import { COMISION, CONDICIONES, ESCALA_PROMOCION, ESCALA_REGULARIDAD, NOTAS, RESULTADOS, STUDENTS, emptyRow } from './data.js'
import { derivarCursada, derivarPromocion, isBlank, norm, todayStr, validarTodo } from './rules.js'
import { descargarActas } from './pdf.js'
import { inputSx } from './ui.js'

const initialRows = () =>
  Object.fromEntries(STUDENTS.map((s) => [s.dni, { cursada: emptyRow(), promocion: emptyRow() }]))

export default function NotasCursada() {
  const [rows, setRows] = useState(initialRows)
  const [locked, setLocked] = useState({}) // 'cursada-<dni>' -> nº de acta
  const [actas, setActas] = useState([]) // actas guardadas
  const [nextActa, setNextActa] = useState(4501)
  const [filtroActa, setFiltroActa] = useState('todas')
  const [busqueda, setBusqueda] = useState('')
  const [autoPromo, setAutoPromo] = useState('si')
  const [errores, setErrores] = useState([])
  const [erroresOpen, setErroresOpen] = useState(false)
  const [exito, setExito] = useState(null)
  const [escala, setEscala] = useState(null)
  const [toast, setToast] = useState(null)
  const errKeys = useMemo(() => new Map(errores.filter((e) => e.key).map((e) => [e.key, e.msg])), [errores])
  const tableRef = useRef(null)

  const notify = (msg, severity = 'info') => setToast({ msg, severity })

  const setField = (dni, tipo, campo, valor) => {
    setRows((prev) => {
      const s = prev[dni]
      const row = { ...s[tipo], [campo]: valor }
      let next = { ...s, [tipo]: row }
      // Autocompletar promoción: si la cursada queda en condición "Promoción", copia fecha/nota a la fila de promoción.
      if (tipo === 'cursada' && autoPromo === 'si' && !locked[`promocion-${dni}`]) {
        if (row.condicion === 'Promoción') {
          next.promocion = { ...s.promocion, fecha: row.fecha, nota: row.nota, ...derivarPromocion(row.nota) }
        }
      }
      return { ...prev, [dni]: next }
    })
    if (errores.length) setErrores((e) => e.filter((x) => x.key !== `${tipo}-${dni}-${campo}`))
  }

  const aplicar = (fn) =>
    setRows((prev) => {
      const out = { ...prev }
      for (const s of STUDENTS) {
        const cur = { ...prev[s.dni].cursada }
        const pro = { ...prev[s.dni].promocion }
        if (!locked[`cursada-${s.dni}`]) fn('cursada', cur)
        if (!locked[`promocion-${s.dni}`]) fn('promocion', pro)
        out[s.dni] = { cursada: cur, promocion: pro }
      }
      return out
    })

  // "Calcular Notas": recalcula resultado y condición según la escala, pisando lo cargado.
  const calcular = () => {
    aplicar((tipo, r) => {
      if (!r.nota) return
      const d = tipo === 'cursada' ? derivarCursada(r.nota) : derivarPromocion(r.nota)
      r.resultado = d.resultado
      if (tipo === 'cursada') r.condicion = d.condicion
    })
    notify('Resultado y condición recalculados según la escala de notas.', 'success')
  }

  const guardar = () => {
    const errs = validarTodo(STUDENTS, rows, locked)
    if (errs.length) {
      setErrores(errs)
      setErroresOpen(true)
      return
    }
    setErrores([])
    const hoy = todayStr()
    const nuevas = []
    const lk = { ...locked }
    let n = nextActa
    for (const tipo of ['cursada', 'promocion']) {
      const filas = STUDENTS.filter((s) => !locked[`${tipo}-${s.dni}`] && !isBlank(rows[s.dni][tipo]))
        .map((s) => ({ student: s, row: rows[s.dni][tipo] }))
      if (!filas.length) continue
      nuevas.push({ numero: n, tipo, fecha: hoy, filas })
      filas.forEach(({ student }) => (lk[`${tipo}-${student.dni}`] = n))
      n += 1
    }
    setLocked(lk)
    setActas((a) => [...a, ...nuevas])
    setNextActa(n)
    setExito(nuevas)
  }

  const pdf = () => {
    let lista = actas
    if (filtroActa !== 'todas' && filtroActa !== 'sin') lista = actas.filter((a) => String(a.numero) === filtroActa)
    if (!actas.length) {
      setErrores([{ key: null, msg: 'Todavía no hay actas para descargar. Cargá las notas y presioná "Guardar" primero.' }])
      setErroresOpen(true)
      return
    }
    if (!lista.length) return notify('No hay actas para el filtro elegido.', 'warning')
    descargarActas(lista)
  }

  const visibles = STUDENTS.filter((s) => {
    if (busqueda && !norm(s.apellido).includes(norm(busqueda.trim()))) return false
    if (filtroActa === 'todas') return true
    if (filtroActa === 'sin') return !locked[`cursada-${s.dni}`]
    return locked[`cursada-${s.dni}`] === +filtroActa || locked[`promocion-${s.dni}`] === +filtroActa
  })

  const gridBtn = { size: 'small', variant: 'outlined', color: 'inherit', sx: { textTransform: 'none', borderColor: '#bbb', bgcolor: '#f5f5f5', fontSize: 13 } }

  return (
    <>
    <Box sx={{ maxWidth: 1360, mx: 'auto', p: 2 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1, borderBottom: '1px solid #eee', pb: 1 }}>
        <Box>
          <Typography component="h1" sx={{ fontSize: 28, fontWeight: 700, color: '#0a85c8' }}>Carga de notas de cursada</Typography>
          <Typography sx={{ fontSize: 12, color: '#777' }}>{COMISION.materia} · {COMISION.comision} · {COMISION.periodo}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button id="btn-calcular" {...gridBtn} onClick={calcular}>Calcular Notas</Button>
          <Button id="btn-escala-regularidad" {...gridBtn} onClick={() => setEscala('reg')}>Ver escala de notas para regularidad</Button>
          <Button id="btn-escala-promocion" {...gridBtn} onClick={() => setEscala('pro')}>Ver escala de notas para promoción</Button>
        </Box>
      </Box>

      <Box sx={{ bgcolor: '#f3f3f3', mt: 1.5, p: 1.5, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <label htmlFor="filtro-acta">Filtrar por acta</label>
          <Box component="select" id="filtro-acta" name="filtro-acta" value={filtroActa} onChange={(e) => setFiltroActa(e.target.value)} sx={{ ...inputSx(), width: 'auto', minWidth: 90 }}>
            <option value="todas">Todas</option>
            <option value="sin">Sin acta</option>
            {actas.map((a) => (
              <option key={a.numero} value={a.numero}>{a.tipo === 'cursada' ? 'Cursada' : 'Promoción'} - Acta {a.numero}</option>
            ))}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <label htmlFor="busqueda-apellido">Búsqueda de alumnos por apellido</label>
          <Box component="input" id="busqueda-apellido" name="busqueda-apellido" type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} sx={{ ...inputSx(), width: 190 }} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button id="btn-pdf" variant="outlined" color="error" size="small" onClick={pdf} sx={{ bgcolor: '#fff', minWidth: 70, fontWeight: 700 }}>PDF</Button>
          <Button id="btn-guardar" variant="contained" size="small" onClick={guardar} sx={{ textTransform: 'none', bgcolor: '#6ab3d1', boxShadow: 'none', '&:hover': { bgcolor: '#4a9dc1' } }}>Guardar</Button>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', justifyContent: 'flex-end', mt: -1 }}>
          <span>Autocompletar promoción</span>
          <ToggleButtonGroup exclusive size="small" value={autoPromo} onChange={(_, v) => v && setAutoPromo(v)}>
            <ToggleButton id="autopromo-si" value="si" sx={{ textTransform: 'none', py: 0.2 }}>Si</ToggleButton>
            <ToggleButton id="autopromo-no" value="no" sx={{ textTransform: 'none', py: 0.2 }}>No</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      <Table id="tabla-notas" ref={tableRef} size="small" sx={{ mt: 1, border: '1px solid #ddd', '& td, & th': { borderColor: '#eee', p: '3px 6px' } }}>
        <TableHead>
          <TableRow>
            {['Alumno', '% Asist.', 'Acta', 'Fecha', 'Nota', 'Resultado', 'Condición', 'Observaciones'].map((h) => (
              <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {visibles.map((s) => (
            ['cursada', 'promocion'].map((tipo) => (
              <StudentRow key={`${tipo}-${s.dni}`} s={s} tipo={tipo} row={rows[s.dni][tipo]} acta={locked[`${tipo}-${s.dni}`]}
                errKeys={errKeys} onChange={setField} />
            ))
          ))}
          {!visibles.length && (
            <TableRow><TableCell colSpan={8} align="center" sx={{ py: 3, color: '#777' }}>No se encontraron alumnos.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>

      {/* Errores de validación */}
      <Dialog open={erroresOpen} onClose={() => setErroresOpen(false)} scroll="paper" maxWidth="md" fullWidth>
        <DialogTitle sx={{ color: '#d32f2f' }}>No se pudo guardar: revisá los datos</DialogTitle>
        <DialogContent dividers id="dialog-errores">
          <Alert severity="error" sx={{ mb: 1 }}>Se encontraron {errores.length} problema(s). Los campos con error quedaron marcados en rojo.</Alert>
          <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, overflow: 'hidden' }}>
            {errores.map((e, i) => {
              const [quien, ...resto] = e.msg.split(' – ')
              return (
                <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', px: 2, py: 1.25, bgcolor: i % 2 ? '#fff' : '#f5f7fa', borderTop: i ? '1px solid #eee' : 0 }}>
                  <Box sx={{ minWidth: 24, height: 24, borderRadius: '50%', bgcolor: '#d32f2f', color: '#fff', fontSize: 12, fontWeight: 700, display: 'grid', placeItems: 'center', mt: '2px' }}>{i + 1}</Box>
                  <Box>
                    {resto.length ? (
                      <>
                        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{quien}</Typography>
                        <Typography sx={{ fontSize: 14, color: '#444' }}>{resto.join(' – ')}</Typography>
                      </>
                    ) : <Typography sx={{ fontSize: 14 }}>{e.msg}</Typography>}
                  </Box>
                </Box>
              )
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button id="btn-cerrar-errores" onClick={() => {
            setErroresOpen(false)
            const first = errores.find((e) => e.key)
            if (first) document.querySelector(`[data-key="${first.key}"]`)?.scrollIntoView({ block: 'center' })
          }}>Corregir</Button>
        </DialogActions>
      </Dialog>

      {/* Guardado exitoso */}
      <Dialog open={!!exito} onClose={() => setExito(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Notas guardadas</DialogTitle>
        <DialogContent id="dialog-exito">
          <Alert severity="success" sx={{ mb: 1 }}>La carga se guardó correctamente.</Alert>
          {exito?.map((a) => (
            <Typography key={a.numero}>Acta de {a.tipo === 'cursada' ? 'cursada' : 'promoción'} N° {a.numero}: {a.filas.length} alumno(s)</Typography>
          ))}
        </DialogContent>
        <DialogActions>
          <Button id="btn-descargar-acta" onClick={() => { descargarActas(exito); setExito(null) }}>Descargar acta (PDF)</Button>
          <Button id="btn-cerrar-exito" onClick={() => setExito(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Escalas */}
      <Dialog open={!!escala} onClose={() => setEscala(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Escala de notas para {escala === 'reg' ? 'regularidad' : 'promoción'}</DialogTitle>
        <DialogContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nota</TableCell><TableCell>Resultado</TableCell>{escala === 'reg' && <TableCell>Condición</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {(escala === 'reg' ? ESCALA_REGULARIDAD : ESCALA_PROMOCION).map((r) => (
                <TableRow key={r.notas}>
                  <TableCell>{r.notas}</TableCell><TableCell>{r.resultado}</TableCell>{escala === 'reg' && <TableCell>{r.condicion}</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions><Button onClick={() => setEscala(null)}>Cerrar</Button></DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {toast ? <Alert severity={toast.severity} variant="filled" onClose={() => setToast(null)}>{toast.msg}</Alert> : undefined}
      </Snackbar>
    </Box>
    </>
  )
}

function StudentRow({ s, tipo, row, acta, errKeys, onChange }) {
  const esCursada = tipo === 'cursada'
  const disabled = !!acta
  const k = (campo) => `${tipo}-${s.dni}-${campo}`
  const common = (campo) => ({
    id: k(campo), name: k(campo), disabled, 'data-key': k(campo), title: errKeys.get(k(campo)) ?? '',
    'aria-invalid': errKeys.has(k(campo)) || undefined,
    value: row[campo],
    onChange: (e) => onChange(s.dni, tipo, campo, e.target.value),
    sx: inputSx(errKeys.has(k(campo))),
  })
  const select = (campo, opciones) => (
    <Box component="select" {...common(campo)}>
      <option value="">-</option>
      {opciones.map((o) => <option key={o} value={o}>{o}</option>)}
    </Box>
  )
  return (
    <TableRow data-dni={s.dni} data-tipo={tipo} sx={{ bgcolor: esCursada ? '#fff' : '#fff0b3' }}>
      {esCursada && (
        <>
          <TableCell rowSpan={2} sx={{ minWidth: 230 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Box sx={{ width: 40, height: 40, bgcolor: '#ddd', flexShrink: 0 }} />
              <Box>
                <div>{s.apellido}, {s.nombre}</div>
                <div>DNI {s.dni}</div>
              </Box>
            </Box>
          </TableCell>
          <TableCell rowSpan={2} align="center">-</TableCell>
        </>
      )}
      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
        {esCursada ? 'Cursada' : 'Promoción'} ( {acta ? `Acta ${acta}` : 'Sin acta'} )
      </TableCell>
      <TableCell sx={{ width: 100 }}>
        <Box component="input" type="text" placeholder="dd/mm/aaaa" maxLength={10} autoComplete="off" {...common('fecha')} />
      </TableCell>
      <TableCell sx={{ width: 80 }}>{select('nota', NOTAS)}</TableCell>
      <TableCell sx={{ width: 110 }}>{select('resultado', RESULTADOS)}</TableCell>
      <TableCell sx={{ width: 130 }}>{esCursada ? select('condicion', CONDICIONES) : null}</TableCell>
      <TableCell>
        <Box component="input" type="text" autoComplete="off" {...common('observaciones')} />
      </TableCell>
    </TableRow>
  )
}
