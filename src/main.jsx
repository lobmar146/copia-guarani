import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import App from './App.jsx'

const theme = createTheme({
  typography: { fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontSize: 14 },
  palette: { primary: { main: '#0a85c8' } },
})

createRoot(document.getElementById('root')).render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <App />
  </ThemeProvider>,
)
