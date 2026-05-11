import styles from './StyleInspector.module.css'

export default function StyleInspector() {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.headerLabel}>Style Inspector</span>
      </div>
      <div className={styles.body}>
        <p className={styles.hint}>
          Click any element in the preview to inspect and edit its styles.
        </p>
      </div>
    </div>
  )
}
