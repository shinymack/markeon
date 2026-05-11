import { useEffect } from 'react'
import { useFileStore } from '../store/useFileStore'
import RibbonToolbar from '../components/toolbar/RibbonToolbar'
import FileTree from '../components/sidebar/FileTree'
import EditorPane from '../components/editor/EditorPane'
import PreviewPane from '../components/editor/PreviewPane'
import StyleInspector from '../components/inspector/StyleInspector'
import styles from './AppPage.module.css'

export default function AppPage() {
  const loadFiles = useFileStore((s) => s.loadFiles)

  useEffect(() => { loadFiles() }, [loadFiles])

  return (
    <div className={styles.shell}>
      <div id="toolbar" className={styles.toolbar}>
        <RibbonToolbar />
      </div>
      <div className={styles.body}>
        <aside id="sidebar" className={styles.sidebar}>
          <FileTree />
        </aside>
        <div className={styles.workArea}>
          <div className={styles.editorPane}>
            <EditorPane />
          </div>
          <div className={styles.previewPane}>
            <PreviewPane />
          </div>
        </div>
        <aside id="inspector" className={styles.inspector}>
          <StyleInspector />
        </aside>
      </div>
    </div>
  )
}
