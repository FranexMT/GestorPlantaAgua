# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Exportar reportes a Excel usando una plantilla

La pantalla `SalesScreen` permite exportar el historial y también un archivo Excel basado en una plantilla existente. Para usar una plantilla:

1. Coloca un archivo `report_template.xlsx` en la carpeta `public/` (ruta pública: `/report_template.xlsx`).
2. Idealmente, la plantilla incluye hojas con estos nombres (pestañas abajo): `Diario`, `Semanal`, `Mensual`, `Anual`.
  - Si alguna hoja no existe, la app la creará automáticamente al exportar.
3. La app añadirá filas con estas columnas por cada nivel de agregado:
  - `Clave` (día p.e. `2025-11-07`, semana ISO p.e. `2025-W45`, mes `2025-11`, año `2025`)
  - `Ventas`, `Importe Total`, `Monto Recibido`, `Cambio Total`, `Ticket Promedio`, `Unidades Totales`
4. En la UI aparecerán dos botones (sólo para administradores):
  - "Exportar Básico": genera un Excel desde cero (sin plantilla) con hoja de ventas y resumen.
  - "Exportar Plantilla": carga `/report_template.xlsx` y escribe los agregados en las hojas `Diario`, `Semanal`, `Mensual`, `Anual`.

Notas:
- Puedes diseñar la plantilla con tu formato, logotipos, encabezados o fórmulas. La app sólo inserta/añade filas de datos.
- Si necesitas otro nombre de archivo, cambia la ruta en `SalesScreen.jsx` (función `executeTemplateExport`).
