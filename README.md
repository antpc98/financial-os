# Financial OS v0.2

Aplicación web estática, mobile-first y *privacy-first* para mantener una fotografía financiera, calcular indicadores y comparar snapshots reales con objetivos. No requiere cuenta, backend ni compilación.

## Privacidad y arquitectura

```text
GitHub Pages
      │
      ▼
Aplicación estática (HTML + CSS + JavaScript)
      │
      ▼
localStorage del navegador
      │
      ▼
Datos privados del usuario
```

El repositorio contiene únicamente código y estado inicial vacío. Los activos, deudas, importes, snapshots y objetivos se guardan en `localStorage` dentro del navegador. No hay APIs externas, cookies, analytics, tracking ni servicios cloud.

`localStorage` no cifra los datos y está vinculado al navegador, dispositivo y origen web. Alguien con acceso a tu perfil podría leerlos. Borrar los datos del sitio o usar modo privado puede eliminarlos: exporta backups periódicamente.

## Funciones

- Dashboard con patrimonio, activos, pasivos, liquidez, fondo de seguridad, deuda, inversiones, ingresos, ahorro y meses de cobertura.
- Alta, edición y eliminación de activos y deudas.
- Flujo mensual y tasa de ahorro calculados.
- Snapshots históricos mediante copias profundas inmutables.
- Objetivos y timeline que diferencia `REAL` de `OBJETIVO`.
- Gráficas SVG sin dependencias externas y semáforo configurable.
- Importación validada, exportación completa, borrado local, responsive desde 320 px y tema claro/oscuro.

## Ejecutar localmente

Los módulos JavaScript necesitan HTTP; no abras `index.html` directamente con `file://`.

```bash
python -m http.server 8000
```

Abre `http://localhost:8000`. También sirve cualquier servidor estático equivalente.

## Importar y exportar

En la primera ejecución elige **Importar snapshot JSON** o **Empezar desde cero**. Las operaciones también están en **Datos**.

El backup nativo usa `formatVersion: 2` e incluye todo el estado. También se admite este snapshot compacto v1 con valores neutros:

```json
{
  "formatVersion": 1,
  "snapshotDate": "2026-01-01",
  "assets": { "house": 0, "car": 0, "investments": 0, "bankAccounts": [] },
  "liabilities": { "mortgage": 0, "loans": [] },
  "income": { "monthlyNet": 0 }
}
```

La importación valida estructura, tipos, fechas e importes no negativos. **Exportar backup** descarga `financial-os-backup-AAAA-MM-DD.json` con datos actuales, snapshots, objetivos, reglas y ajustes. Ese archivo sí contiene información privada: no lo añadas al repositorio ni lo compartas públicamente.

## GitHub Pages

1. Sube los archivos a la rama de publicación (habitualmente `main`).
2. Abre **Settings → Pages**.
3. En **Build and deployment**, selecciona **Deploy from a branch**.
4. Elige la rama y **`/ (root)`**, y guarda.
5. Abre la URL indicada y comprueba que aparece la primera ejecución sin datos.

Las rutas son relativas y funcionan bajo `/financial-os/`.

> Migración desde v0.1: borrar datos del archivo actual no los elimina del historial de Git. Antes de hacer público un repositorio que haya contenido información real, hay que sanear todo el historial y actualizar el remoto de forma controlada.

## Estructura

```text
index.html
css/styles.css
js/app.js
js/storage.js
js/calculations.js
js/charts.js
README.md
```

- `storage.js`: única puerta a `localStorage`, validación, importación, exportación y reset.
- `calculations.js`: KPIs, salud financiera y snapshots.
- `charts.js`: visualizaciones SVG locales.
- `app.js`: interfaz, formularios y renderizado.

## Limitaciones

- Sin sincronización: la transferencia entre dispositivos se hace mediante JSON.
- Sin cifrado, cuentas, recuperación remota ni colaboración.
- Sin movimientos bancarios, categorización automática, presupuestos o alertas.
- Valoraciones y objetivos manuales.

## Roadmap

- v0.1 — Snapshot financiero
- **v0.2 — Privacy-first + dashboard**
- v0.3 — Movimientos y categorización
- v0.4 — Presupuestos
- v0.5 — Alertas
- v1.0 — Financial OS estable
