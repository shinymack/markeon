import {
  Bold, Italic, Strikethrough, Code, Link, Heading1, Heading2, Heading3,
  Quote, List, ListOrdered, Minus, Table2, Braces,
} from 'lucide-react'
import * as fmt from '../../lib/formatCommands'

const GROUPS = [
  {
    label: 'Headings',
    items: [
      { icon: Heading1, label: 'Heading 1', shortcut: '', action: fmt.h1 },
      { icon: Heading2, label: 'Heading 2', shortcut: '', action: fmt.h2 },
      { icon: Heading3, label: 'Heading 3', shortcut: '', action: fmt.h3 },
    ],
  },
  {
    label: 'Inline',
    items: [
      { icon: Bold,          label: 'Bold',          shortcut: 'Ctrl+B', action: fmt.bold },
      { icon: Italic,        label: 'Italic',        shortcut: 'Ctrl+I', action: fmt.italic },
      { icon: Strikethrough, label: 'Strikethrough', shortcut: '',       action: fmt.strikethrough },
      { icon: Code,          label: 'Inline Code',   shortcut: '',       action: fmt.inlineCode },
      { icon: Link,          label: 'Link',          shortcut: 'Ctrl+K', action: fmt.link },
    ],
  },
  {
    label: 'Blocks',
    items: [
      { icon: Quote,        label: 'Blockquote',   shortcut: '', action: fmt.blockquote },
      { icon: List,         label: 'Bullet List',  shortcut: '', action: fmt.bulletList },
      { icon: ListOrdered,  label: 'Ordered List', shortcut: '', action: fmt.orderedList },
      { icon: Braces,       label: 'Code Block',   shortcut: '', action: fmt.codeBlock },
      { icon: Table2,       label: 'Table',        shortcut: '', action: fmt.table },
      { icon: Minus,        label: 'Divider',      shortcut: '', action: fmt.horizontalRule },
    ],
  },
]

function FmtButton({ icon: Icon, label, shortcut, action }) {
  return (
    <button
      onClick={action}
      title={shortcut ? `${label} (${shortcut})` : label}
      className="flex items-center gap-1.5 px-2.5 rounded cursor-pointer border-none transition-colors duration-100 flex-shrink-0"
      style={{
        height: 30,
        fontSize: 12,
        fontFamily: 'var(--font-ui)',
        background: 'transparent',
        color: 'var(--text-muted)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--surface-raised)'
        e.currentTarget.style.color = 'var(--text-primary)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'var(--text-muted)'
      }}
    >
      <Icon size={14} strokeWidth={2} />
      <span>{label}</span>
    </button>
  )
}

function Sep() {
  return <div className="self-stretch mx-1" style={{ width: 1, background: 'var(--border)' }} />
}

function GroupLabel({ children }) {
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-widest flex-shrink-0 px-1"
      style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', opacity: 0.6 }}
    >
      {children}
    </span>
  )
}

export default function FormatPanel() {
  return (
    <div
      className="flex items-center gap-0.5 px-3 overflow-x-auto"
      style={{ height: 51, fontFamily: 'var(--font-ui)' }}
    >
      {GROUPS.map((group, gi) => (
        <>
          {gi > 0 && <Sep key={`sep-${gi}`} />}
          <GroupLabel key={`lbl-${gi}`}>{group.label}</GroupLabel>
          {group.items.map((item) => (
            <FmtButton key={item.label} {...item} />
          ))}
        </>
      ))}
    </div>
  )
}
