export const previewRef = { current: null }

export async function waitForPreview() {
  while (previewRef.current) {
    if (await previewRef.current(true)) return
  }
  throw new Error('Open a document before exporting.')
}
