// Shared mutable ref to the active CodeMirror EditorView instance.
// EditorPane writes to this when the view is created/destroyed.
// Any toolbar panel can read .current to dispatch transactions.
export const editorViewRef = { current: null }
