import { Buffer } from 'node:buffer'

import pdfParse from 'pdf-parse/lib/pdf-parse.js'

import { parseProjectPdfText } from './_shared/project-pdf-parser.js'

export default async (request) => {
  if (request.method !== 'POST') {
    return Response.json({ ok: false, error: 'Metodo no permitido' }, { status: 405 })
  }

  try {
    const body = await request.json()
    const fileBase64 = typeof body?.fileBase64 === 'string' ? body.fileBase64 : ''
    const fileName = typeof body?.fileName === 'string' ? body.fileName : 'documento.pdf'

    if (!fileBase64) {
      return Response.json({ ok: false, error: 'Archivo PDF invalido' }, { status: 400 })
    }

    const data = Buffer.from(fileBase64, 'base64')

    const result = await pdfParse(data)
    const parsed = parseProjectPdfText(result.text)

    return Response.json({
      ok: true,
      fileName,
      ...parsed,
    })
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'No se pudo procesar el PDF',
      },
      { status: 500 },
    )
  }
}
