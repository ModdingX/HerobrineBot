import fetch from 'node-fetch'

export async function createPaste(title: string | null, content: string): Promise<Paste> {
  const titlePart = (title == null) ? '' : `?title=${encodeURIComponent(title)}`
  const response = await fetch(`https://paste.melanx.de/create${titlePart}`, {
    method: 'POST',
    body: Buffer.from(content, 'utf-8')
  })
  const data = await response.json()
  return {
    url: data.url,
    delete: `https://paste.melanx.de/delete/${encodeURIComponent(data.edit)}`
  }
}

export interface Paste{
  url: string,
  delete: string
}
