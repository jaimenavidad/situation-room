import { Buffer } from 'node:buffer'
import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { PDFParse } from 'pdf-parse'

import { parseProjectPdfText } from './_shared/project-pdf-parser.js'

const resolvePdfWorkerSrc = () => {
  const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
  const rootDirectory = process.cwd()
  const candidates = [
    path.join(currentDirectory, 'node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs'),
    path.join(currentDirectory, '../node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs'),
    path.join(currentDirectory, 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'),
    path.join(currentDirectory, '../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'),
    path.join(currentDirectory, 'node_modules/pdf-parse/dist/worker/pdf.worker.mjs'),
    path.join(currentDirectory, '../node_modules/pdf-parse/dist/worker/pdf.worker.mjs'),
    path.join(rootDirectory, 'node_modules/pdf-parse/dist/pdf-parse/esm/pdf.worker.mjs'),
    path.join(rootDirectory, 'node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs'),
    path.join(rootDirectory, 'node_modules/pdf-parse/dist/worker/pdf.worker.mjs'),
    path.join(rootDirectory, 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'),
  ]

  const workerPath = candidates.find((candidate) => existsSync(candidate))
  return workerPath ? pathToFileURL(workerPath).toString() : null
}

export default async (request) => {
  if (request.method !== 'POST') {
    return Response.json({ ok: false, error: 'Metodo no permitido' }, { status: 405 })
  }

  let parser

  try {
    const body = await request.json()
    const fileBase64 = typeof body?.fileBase64 === 'string' ? body.fileBase64 : ''
    const fileName = typeof body?.fileName === 'string' ? body.fileName : 'documento.pdf'

    if (!fileBase64) {
      return Response.json({ ok: false, error: 'Archivo PDF invalido' }, { status: 400 })
    }

    const data = Buffer.from(fileBase64, 'base64')
    const workerSrc = resolvePdfWorkerSrc()

    if (workerSrc) {
      PDFParse.setWorker(workerSrc)
    }

    parser = new PDFParse({ data })

    const result = await parser.getText()
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
  } finally {
    if (parser) {
      await parser.destroy().catch(() => {})
    }
  }
}
