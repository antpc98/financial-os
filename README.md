# Financial OS v0.3 — Monthly Tracking

Aplicación web estática, mobile-first y *privacy-first* para gestionar patrimonio, movimientos diarios, balances mensuales, fondo de seguridad y evolución histórica. No requiere cuenta, backend ni compilación.

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

## Semántica mensual

- **Balance de consumo** = ingresos + reembolsos − gastos de consumo.
- **Ahorro neto real** = balance de consumo − aportaciones de inversión − pagos de deuda.
- Una transferencia interna se registra, pero su efecto en balance, gasto y ahorro es cero.
- Cada movimiento manual requiere una cuenta líquida: ingreso y reembolso aumentan su saldo; gasto, transferencia, inversión y pago de deuda lo reducen. Editar o eliminar el movimiento revierte su ajuste.
- La cuota configurada en una deuda es planificación. Sólo un movimiento `debtPayment` cuenta como pago real, evitando duplicarla.
- Un movimiento `debtPayment` registra flujo, pero nunca reduce por sí solo `outstandingBalance`; el saldo sólo cambia mediante edición o mediante un snapshot importado.
- El fondo de seguridad es dinero reservado mediante aportes y retiradas. No suma a los activos porque puede estar ya dentro de una cuenta.
- Los snapshots son la fuente histórica por periodo. Al importar uno posterior a la situación actual, su copia pasa a ser `current`; importar meses antiguos nunca hace retroceder el estado actual.

## Funciones

- Dashboard mensual con liquidez actual destacada, patrimonio, balance, ahorro y categorías.
- Registro rápido de ingresos, gastos, transferencias, inversión, pagos de deuda y reembolsos.
- Las transferencias internas no cuentan como gasto; inversión y deuda se separan del consumo.
- Fondo de seguridad manual con aportes y retiradas, sin duplicar el patrimonio.
- Selector mensual global y flujo planificado frente a real.
- Alta, edición y eliminación de activos y deudas.
- Flujo mensual y tasa de ahorro calculados.
- Snapshots históricos mediante copias profundas inmutables.
- Objetivos y timeline que diferencia `REAL` de `OBJETIVO`.
- Gráficas SVG Día/Mes/Año sin puntos inventados y semáforo configurable.
- Importación/exportación mensual JSON y exportación de movimientos JSON/CSV.
- Importación validada, exportación completa, borrado local, responsive desde 320 px y tema claro/oscuro.

## Ejecutar localmente

Los módulos JavaScript necesitan HTTP; no abras `index.html` directamente con `file://`.

```bash
python -m http.server 8000
```

Abre `http://localhost:8000`. También sirve cualquier servidor estático equivalente.

## Importar y exportar

En la primera ejecución elige **Importar snapshot JSON** o **Empezar desde cero**. Las operaciones también están en **Datos**.

El backup nativo usa `formatVersion: 3`. Los backups completos v2 se migran automáticamente y de forma no destructiva: movimientos y operaciones del fondo empiezan vacíos, mientras activos, deudas, snapshots y objetivos se conservan. También se admite este snapshot compacto v1 con valores neutros:

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
js/financial-state.js
js/calculations.js
js/charts.js
README.md
```

- `storage.js`: única puerta a `localStorage`, migración v2→v3, importación/exportación completa y mensual.
- `financial-state.js`: selección temporal y reconciliación entre snapshots y situación actual.
- `calculations.js`: patrimonio, movimientos, balances mensuales, fondo y series históricas.
- `charts.js`: visualizaciones SVG locales.
- `app.js`: interfaz, formularios y renderizado.

## Limitaciones

- Sin sincronización: la transferencia entre dispositivos se hace mediante JSON.
- Sin cifrado, cuentas, recuperación remota ni colaboración.
- Sin movimientos bancarios, categorización automática, presupuestos o alertas.
- Valoraciones y objetivos manuales.

## Roadmap

- v0.1 — Snapshot financiero
- v0.2 — Privacy-first + dashboard
- **v0.3 — Movimientos y categorización**
- v0.4 — Presupuestos
- v0.5 — Alertas
- v1.0 — Financial OS estable
