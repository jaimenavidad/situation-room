import { getStore } from '@netlify/blobs'

const STORE_NAME = 'situation-room'
const STORE_KEY = 'projects.json'

export default async (request) => {
  if (request.method !== 'POST') {
    return Response.json({ ok: false, error: 'Metodo no permitido' }, { status: 405 })
  }

  try {
    const body = await request.json()
    const projects = Array.isArray(body?.projects) ? body.projects : null

    if (!projects) {
      return Response.json({ ok: false, error: 'Payload invalido' }, { status: 400 })
    }

    const store = getStore({ name: STORE_NAME, consistency: 'strong' })
    const payload = {
      version: 1,
      savedAt: new Date().toISOString(),
      projects,
    }

    await store.setJSON(STORE_KEY, payload)

    return Response.json({
      ok: true,
      savedAt: payload.savedAt,
      count: projects.length,
    })
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'No se pudieron guardar los proyectos',
      },
      { status: 500 },
    )
  }
}
