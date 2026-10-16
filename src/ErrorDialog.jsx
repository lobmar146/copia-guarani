import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'

// errores: [{ key, msg }]. Los mensajes "Quién – detalle" se muestran en dos líneas.
export default function ErrorDialog({ open, errores, onClose, id = 'dialog-errores' }) {
  return (
    <Dialog open={open} onClose={onClose} scroll="paper" maxWidth="md" fullWidth>
      <DialogTitle sx={{ color: '#d32f2f' }}>No se pudo guardar: revisá los datos</DialogTitle>
      <DialogContent dividers id={id}>
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
        <Button id={`${id}-cerrar`} onClick={() => {
          onClose()
          const first = errores.find((e) => e.key)
          if (first) setTimeout(() => document.querySelector(`[data-key="${first.key}"]`)?.scrollIntoView({ block: 'center' }), 200)
        }}>Corregir</Button>
      </DialogActions>
    </Dialog>
  )
}
