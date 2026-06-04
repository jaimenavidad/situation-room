import { getStore } from '@netlify/blobs'

const STORE_NAME = 'situation-room'
const STORE_KEY = 'projects.json'

export default async () => {
  try {
    const store = getStore({ name: STORE_NAME, consistency: 'strong' })
    const payload = await store.get(STORE_KEY, { type: 'json' })
    const projects = Array.isArray(payload?.projects) ? payload.projects : Array.isArray(payload) ? payload : []

    return Response.json({
      ok: true,
      projects,
      savedAt: payload?.savedAt ?? null,
      source: 'netlify-blobs',
    })
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'No se pudieron leer los proyectos',
      },
      { status: 500 },
    )
  }
}
