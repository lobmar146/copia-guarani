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
