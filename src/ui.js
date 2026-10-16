export const inputSx = (error) => ({
  width: '100%', height: 26, boxSizing: 'border-box', border: `1px solid ${error ? '#d32f2f' : '#ccc'}`,
  borderRadius: '4px', padding: '2px 6px', font: 'inherit', fontSize: 13,
  background: error ? '#fdecea' : '#fff', '&:disabled': { background: '#eee', color: '#555' },
})

export const gridBtn = {
  size: 'small', variant: 'outlined', color: 'inherit',
  sx: { textTransform: 'none', borderColor: '#bbb', bgcolor: '#f5f5f5', fontSize: 13 },
}

export const titleSx = { fontSize: 28, fontWeight: 700, color: '#0a85c8' }
