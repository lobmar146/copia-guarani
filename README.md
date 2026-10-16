# Copia SIU Guaraní – Carga de notas de cursada

Práctica de carga masiva (RPA / agentes) sobre una réplica simplificada del formulario de SIU Guaraní. Alumnos y DNI ficticios.

```bash
npm install
npm run dev     # http://localhost:5173
npm run build
```

## Cómo se identifican los campos

Cada fila de alumno tiene dos filas: `cursada` y `promocion` (solo si la condición de cursada es "Promoción").
Los campos tienen `id` y `name` = `{tipo}-{dni}-{campo}`:

| Campo | Tipo | Valores |
|---|---|---|
| `fecha` | texto | `dd/mm/aaaa` |
| `nota` | select | `1`..`10` (vacío si Ausente) |
| `resultado` | select | `Aprobado`, `Reprobado`, `Ausente` |
| `condicion` (solo cursada) | select | `Regular`, `Libre`, `Promoción` |
| `observaciones` | texto | máx. 200 caracteres |

Ejemplo: `#cursada-30111001-nota`, `#promocion-30111001-fecha`.

Botones: `#btn-calcular`, `#btn-guardar`, `#btn-pdf`, `#autopromo-si` / `#autopromo-no`.
Buscador: `#busqueda-apellido`. Filtro: `#filtro-acta`.

Si falta algún dato o hay incoherencias, "Guardar" abre `#dialog-errores` con la lista y marca los campos en rojo.
Al guardar bien aparece `#dialog-exito` con `#btn-descargar-acta` (PDF del acta).

Ver `ejemplo-carga.json` para el formato de datos de entrada.

## Pantallas (rutas por hash)

| Ruta | Pantalla |
|---|---|
| `/#/cursada` | Carga de notas de cursada (ver arriba) |
| `/#/asistencia` | Carga de asistencia por clase |
| `/#/finales` | Carga de notas de examen final |

### Asistencia (`ejemplo-asistencia.json`)
- Cabecera: `#asistencia-fecha` (dd/mm/aaaa), `#asistencia-tipo`, `#asistencia-horas`, `#asistencia-tema` (opcional).
- Radios por alumno: `#asistencia-{dni}-{presente|ausente|tarde|justificado}` (name `asistencia-{dni}`). Observaciones: `#asistencia-{dni}-observaciones`.
- Botones: `#btn-todos-presentes`, `#btn-limpiar-asistencia`, `#btn-guardar-asistencia`, `#btn-pdf-asistencia`.
- Reglas: todos los alumnos deben tener estado; "Justificado" exige observación; no se repite fecha+tipo de clase.
- Éxito: `#dialog-exito-asistencia` → `#btn-descargar-asistencia` (PDF). Errores: `#dialog-errores-asistencia`.

### Examen final (`ejemplo-final.json`)
- Cabecera: `#final-mesa`, `#final-fecha`, `#final-libro` (numérico), `#final-folio` (numérico), `#final-presidente`.
- Por alumno: `#final-{dni}-nota`, `#final-{dni}-resultado`, `#final-{dni}-observaciones`.
- Los alumnos "Promocionado" no rinden: sus campos están deshabilitados (hay que saltearlos).
- Nota ≥ 4 aprueba. Botones: `#btn-calcular-final`, `#btn-guardar-final`, `#btn-pdf-final`.
- Éxito: `#dialog-exito-final` → `#btn-descargar-acta-final`. Errores: `#dialog-errores-final`.
