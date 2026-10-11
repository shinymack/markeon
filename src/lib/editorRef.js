// Shared mutable refs for the active CodeMirror view. Toolbar and export code
// can dispatch through editorViewRef without importing EditorPane.
export const editorViewRef = { current: null }
export const editorFileIdRef = { current: null }

let flushEditorCallback = null

// EditorPane owns the callback; returning an unregister function keeps React
// effect cleanup deterministic and avoids a store/editor import cycle.
export function registerEditorFlush(callback) {
  flushEditorCallback = typeof callback === 'function' ? callback : null
  return () => {
    if (flushEditorCallback === callback) flushEditorCallback = null
  }
}

export function flushActiveEditor() {
  if (!flushEditorCallback) return Promise.resolve()
  try {
    return Promise.resolve(flushEditorCallback())
  } catch (error) {
    return Promise.reject(error)
  }
}
