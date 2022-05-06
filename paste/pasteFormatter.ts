export function formatFile(name: string, content: string): string {
  if (name.toLowerCase().endsWith('.json')) {
    try {
      return JSON.stringify(JSON.parse(content), undefined, 2)
    } catch (err) {
      return content
    }
  } else {
    return content
  }
}
