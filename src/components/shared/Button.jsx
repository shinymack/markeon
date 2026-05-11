import styles from './Button.module.css'

export default function Button({ children, variant = 'primary', size = 'md', onClick, className = '', ...props }) {
  return (
    <button
      className={[styles.btn, styles[variant], styles[size], className].join(' ')}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}
