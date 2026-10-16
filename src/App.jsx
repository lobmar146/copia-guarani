import { useEffect, useState } from 'react'
import Header from './Header.jsx'
import NotasCursada from './NotasCursada.jsx'
import Asistencia from './Asistencia.jsx'
import Finales from './Finales.jsx'

const RUTAS = ['cursada', 'asistencia', 'finales']
const leerRuta = () => {
  const r = window.location.hash.replace(/^#\/?/, '')
  return RUTAS.includes(r) ? r : 'cursada'
}

export default function App() {
  const [ruta, setRuta] = useState(leerRuta)
  // Estado compartido: clases de asistencia ya cargadas (para el % Asist.)
  const [clases, setClases] = useState([])

  useEffect(() => {
    const onHash = () => setRuta(leerRuta())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Las tres pantallas quedan montadas (solo se oculta la inactiva) para no perder lo cargado al cambiar de pestaña.
  const vista = (r) => ({ hidden: ruta !== r, 'data-vista': r })
  return (
    <>
      <Header ruta={ruta} />
      <div {...vista('cursada')}><NotasCursada /></div>
      <div {...vista('asistencia')}><Asistencia clases={clases} setClases={setClases} /></div>
      <div {...vista('finales')}><Finales /></div>
    </>
  )
}
