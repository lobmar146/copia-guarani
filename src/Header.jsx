import { Box, Typography } from '@mui/material'
import { COMISION } from './data.js'

const NAV = ['Cursadas', 'Clases', 'Exámenes', 'Reportes ▾', 'Encuestas ▾', 'Derechos ▾', 'Cursos']
const TABS = [
  { label: 'Cargar Notas', ruta: 'cursada' },
  { label: 'Asistencia', ruta: 'asistencia' },
  { label: 'Exámenes finales', ruta: 'finales' },
]

export default function Header({ ruta }) {
  return (
    <Box component="header">
      <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #e5e5e5' }}>
        <Box sx={{ maxWidth: 1360, mx: 'auto', px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 56, height: 56, borderRadius: '10px', bgcolor: '#2f8fe0', color: '#fff', fontSize: 38, fontWeight: 900, display: 'grid', placeItems: 'center' }}>O</Box>
            <Box>
              <Typography component="div" sx={{ fontSize: 32, fontWeight: 900, letterSpacing: 2, lineHeight: 1, color: '#2d3e50' }}>
                ODAWI <Box component="span" sx={{ color: '#2f8fe0' }}>GUARANÍ</Box>
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#555', letterSpacing: 0.5 }}>AUTOMATIZANDO COMO UN CAMPEÓN 🏆</Typography>
            </Box>
          </Box>
          <Typography sx={{ color: '#444' }}>👤 Docente Práctica ▾</Typography>
        </Box>
      </Box>
      <Box sx={{ bgcolor: '#f8f8f8', borderBottom: '1px solid #e5e5e5' }}>
        <Box sx={{ maxWidth: 1360, mx: 'auto', px: 2, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
            {NAV.map((n) => <Box key={n} sx={{ px: 2.5, py: 1.5, color: '#555', borderRight: '1px solid #e5e5e5', borderLeft: n === 'Cursadas' ? '1px solid #e5e5e5' : 0 }}>{n}</Box>)}
          </Box>
          <Box sx={{ px: 2.5, py: 1.5, color: '#555' }}>Perfil: Docente ▾</Box>
        </Box>
      </Box>
      <Box sx={{ maxWidth: 1360, mx: 'auto', px: 2, pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ border: '1px solid #ccc', borderRadius: '4px', px: 1.5, py: 0.8, bgcolor: '#fff' }}>{COMISION.materia}: A ▾</Box>
        <Box component="nav" sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {TABS.map((t) => {
            const activa = t.ruta === ruta
            return (
              <Box key={t.label} component="a" id={`tab-${t.ruta}`} href={`#/${t.ruta}`}
                sx={{ textDecoration: 'none', px: 1.5, py: 0.8, borderRadius: '4px', ...(activa ? { bgcolor: '#2f8fe0', color: '#fff' } : { color: '#3a9ad9' }) }}>
                {t.label}
              </Box>
            )
          })}
        </Box>
      </Box>
      <Box sx={{ maxWidth: 1360, mx: 'auto', px: 2, pt: 2 }}>
        <Box sx={{ bgcolor: '#f3f3f3', border: '1px solid #ddd', borderRadius: '4px', px: 1.5, py: 1.2, display: 'flex', justifyContent: 'space-between', boxShadow: '0 1px 2px rgba(0,0,0,.1)' }}>
          <Typography sx={{ fontWeight: 700, fontSize: 18, color: '#333' }}>{COMISION.materia} - A</Typography>
          <Typography sx={{ color: '#444' }}>☰ Detalles</Typography>
        </Box>
      </Box>
    </Box>
  )
}
