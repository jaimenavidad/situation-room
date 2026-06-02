# Situation Room

Aplicacion web interna para gestionar un `Mapa de Compromisos de Proyectos` con vista ejecutiva de portafolio y ficha editable por proyecto.

## Stack

- React + Vite
- Tailwind CSS v4
- LocalStorage para persistencia inicial
- Sin backend
- Lista para deploy en Netlify

## Funcionalidades incluidas

- CRUD completo de proyectos
- Busqueda por proyecto o cliente
- Filtros por salud y tipo de iniciativa
- Orden por fecha del proximo hito
- Vista resumen con tarjetas por salud
- Ficha individual editable
- Bitacora de comentarios con estado resuelto
- Persistencia automatica con `localStorage`

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

## Deploy en Netlify

Usa esta configuracion:

```txt
Build command: npm run build
Publish directory: dist
```

El archivo `netlify.toml` ya incluye el redirect SPA para servir `index.html`.

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
netlify.toml
vite.config.js
```

- `src/App.jsx`: layout principal, estado global, filtros, formularios, CRUD y comentarios.
- `src/data/sampleProjects.js`: los 4 proyectos ficticios de ejemplo.
- `src/index.css`: tipografia, tokens visuales y estilos auxiliares sobre Tailwind.
- `netlify.toml`: redirect SPA para Netlify.
- `vite.config.js`: configuracion de Vite con React y Tailwind.

## Mejoras futuras sugeridas

- Login con autenticacion
- Backend con API y base de datos
- Permisos por usuario o por rol
- Historial de cambios y auditoria
- Comentarios multiusuario en tiempo real
- Adjuntos, reuniones y timeline de decisiones
