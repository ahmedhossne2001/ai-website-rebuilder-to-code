# Export an editable React + Tailwind project

The preview toolbar now offers two downloads:

- **Download Code (arrow icon):** original HTML export, unchanged.
- **React ZIP:** export supported React/Babel previews as a **Vite + React + Tailwind** project.

## What is included
- `src/App.jsx`: generated React component
- `src/main.jsx`: React mount entry
- `src/index.css`: Tailwind directives and extracted styles
- `index.html`, `package.json`, `vite.config.js`
- `tailwind.config.js`, `postcss.config.js`, `README.md`
- `public/assets/` when image assets are bundled

## Running an exported project (Mac or Windows)
1. Extract the ZIP.
2. Install Node.js 20 or newer.
3. In Terminal or PowerShell, enter the extracted directory.
4. Run `npm install` followed by `npm run dev`.
5. Open the local URL printed by Vite.
6. Build with `npm run build`; deployment output is `dist/`.

## Supported conversion
The converter recognizes a single inline `text/babel` / `text/jsx` script containing an `App` component mounted with `ReactDOM.createRoot(...).render(<App />)` (or classic `ReactDOM.render`). It strips the preview mount and generates a standard JSX entry.

If conversion cannot be performed safely, the endpoint returns a clear validation error instead of a misleading ZIP. The original HTML download remains available.

**Limitations:** externally imported libraries, custom bootstrap code, external assets, complex dynamic dependencies, and non-React outputs may need manual migration. Bundled remote images are subject to existing asset-fetch restrictions. Always review generated code before production use.

## Validation status
The implementation is on the development branch. Its converter was checked against the previously exported Hello World sample, and regression tests have been added. A full Docker rebuild, automated test run within the project, and production build of the exported archive must be performed on the user's machine before merging.
