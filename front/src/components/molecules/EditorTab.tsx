// Molécule : un onglet de l'éditeur (nom + point « modifié » + croix).
import { IconButton } from '@/components/atoms'
import styles from './EditorTab.module.css'

type EditorTabProps = {
  name: string
  isActive: boolean
  isDirty: boolean
  onSelect: () => void
  onClose: () => void
}

function EditorTab({ name, isActive, isDirty, onSelect, onClose }: EditorTabProps) {
  return (
    <div className={[styles.tab, isActive && styles.active].filter(Boolean).join(' ')}>
      <button
        type="button"
        className={styles.label}
        aria-label={isDirty ? `${name}, modifié` : name}
        onClick={onSelect}
      >
        {name}
        {isDirty && (
          <span className={styles.dot} aria-hidden="true">
            {' '}
            ●
          </span>
        )}
      </button>
      <IconButton label={`Fermer ${name}`} title="Fermer" size="md" onClick={onClose}>
        ✕
      </IconButton>
    </div>
  )
}

export default EditorTab
