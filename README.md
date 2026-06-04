# Situation Room

Aplicacion web interna para gestionar un `Mapa de Compromisos de Proyectos` con vista ejecutiva de portafolio y ficha editable por proyecto.

## Stack

- React + Vite
- Tailwind CSS v4
- Netlify Blobs para persistencia remota
- Netlify Functions para lectura y escritura
- Lista para deploy en Netlify

## Funcionalidades incluidas

- CRUD completo de proyectos
- Busqueda por proyecto o cliente
- Filtros por salud y tipo de iniciativa
- Orden por fecha del proximo hito
- Vista resumen con tarjetas por salud
- Ficha individual editable
- Bitacora de comentarios con estado resuelto
- Importador PDF para crear proyectos desde exports de Notion
- Persistencia automatica con Netlify Blobs
- Cache local de resiliencia para desarrollo y fallos temporales de red

## Comandos

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Como correr localmente

1. Ejecuta `npm install`.
2. Inicia el servidor con `npm run dev`.
3. Abre la URL local que muestra Vite.
4. El plugin `@netlify/vite-plugin` emula Netlify Functions y Blobs localmente, asi que la app ya puede leer y guardar proyectos sin cambiar de comando.

## Deploy en Netlify

Usa esta configuracion:

```txt
Build command: npm run build
Publish directory: dist
```

El archivo `netlify.toml` ya incluye el redirect SPA para servir `index.html`.
Las Functions viven en `netlify/functions/` y usan un store site-wide de Netlify Blobs:

- store: `situation-room`
- key: `projects.json`

## Pipeline recomendado

```txt
Entorno local -> GitHub (branch main) -> Netlify
```

1. Trabaja y valida cambios localmente con `npm run lint` y `npm run build`.
2. Haz push a `main` en GitHub.
3. Conecta el repositorio en Netlify.
4. Configura:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Cada push a `main` disparara un nuevo deploy en Netlify.

## Estructura de archivos

```txt
src/
  App.jsx
  data/sampleProjects.js
  index.css
netlify/functions/
  _shared/project-pdf-parser.js
  projects-get.js
  projects-import-pdf.js
  projects-save.js
netlify.toml
vite.config.js
```

- `src/App.jsx`: layout principal, estado global, filtros, formularios, CRUD, comentarios y persistencia remota.
- `src/data/sampleProjects.js`: semilla local vacia.
- `src/index.css`: tipografia, tokens visuales y estilos auxiliares sobre Tailwind.
- `netlify/functions/projects-get.js`: lee la coleccion completa desde Netlify Blobs.
- `netlify/functions/projects-import-pdf.js`: extrae texto de PDFs de Notion y devuelve un borrador editable de proyecto.
- `netlify/functions/projects-save.js`: guarda la coleccion completa en Netlify Blobs.
- `netlify/functions/_shared/project-pdf-parser.js`: normaliza campos del PDF al modelo de Situation Room.
- `netlify.toml`: redirect SPA para Netlify.
- `vite.config.js`: configuracion de Vite con React, Tailwind y el plugin de Netlify para emular Functions/Blobs en local.

## Mejoras futuras sugeridas

- Login con autenticacion
- Backend con API y base de datos
- Permisos por usuario o por rol
- Historial de cambios y auditoria
- Comentarios multiusuario en tiempo real
- Adjuntos, reuniones y timeline de decisiones
