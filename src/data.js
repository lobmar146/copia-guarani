// Alumnos ficticios (nombres y DNI inventados).
export const STUDENTS = [
  { dni: '30111001', apellido: 'Acosta', nombre: 'Lucía Marina' },
  { dni: '30111002', apellido: 'Benítez Duarte', nombre: 'Matías Ezequiel' },
  { dni: '30111003', apellido: 'Cabrera', nombre: 'Julieta Anahí' },
  { dni: '30111004', apellido: 'Domínguez', nombre: 'Sebastián' },
  { dni: '30111005', apellido: 'Escobar', nombre: 'Camila Belén' },
  { dni: '30111006', apellido: 'Fernández Gómez', nombre: 'Nicolás Andrés' },
  { dni: '30111007', apellido: 'Giménez', nombre: 'Valentina' },
  { dni: '30111008', apellido: 'Herrera', nombre: 'Tomás Ignacio' },
  { dni: '30111009', apellido: 'Ibáñez', nombre: 'Florencia Rocío' },
  { dni: '30111010', apellido: 'Juárez', nombre: 'Franco Daniel' },
  { dni: '30111011', apellido: 'Luna', nombre: 'Agustina Soledad' },
]

export const COMISION = {
  materia: 'Programación I (TUP-101)',
  comision: 'Comisión A',
  periodo: '1er cuatrimestre 2026',
}

export const NOTAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
export const RESULTADOS = ['Aprobado', 'Reprobado', 'Ausente']
export const CONDICIONES = ['Regular', 'Libre', 'Promoción']

// Escalas (se muestran en los diálogos "Ver escala de notas").
export const ESCALA_REGULARIDAD = [
  { notas: '1 a 3', resultado: 'Reprobado', condicion: 'Libre' },
  { notas: '4 a 6', resultado: 'Aprobado', condicion: 'Regular' },
  { notas: '7 a 10', resultado: 'Aprobado', condicion: 'Regular o Promoción' },
  { notas: 'Sin nota', resultado: 'Ausente', condicion: 'Libre' },
]
export const ESCALA_PROMOCION = [
  { notas: '1 a 6', resultado: 'Reprobado' },
  { notas: '7 a 10', resultado: 'Aprobado' },
  { notas: 'Sin nota', resultado: 'Ausente' },
]

export const emptyRow = () => ({ fecha: '', nota: '', resultado: '', condicion: '', observaciones: '' })
