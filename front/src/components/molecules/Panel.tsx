// Molécule : le cadre d'une zone (titre + actions optionnelles + contenu).
// Le contenu (le "corps") est fourni par l'organisme, avec ses propres classes.
import type { ReactNode } from 'react'
import styles from './Panel.module.css'

type PanelProps = {
  title: string
  ariaLabel?: string
  actions?: ReactNode // boutons affichés à droite du titre
  className?: string // ex. classe de placement dans la grille (template)
  children: ReactNode
}

function Panel({ title, ariaLabel, actions, className, children }: PanelProps) {
  const rootClass = [styles.panel, className].filter(Boolean).join(' ')
  return (
    <section className={rootClass} aria-label={ariaLabel ?? title} tabIndex={0}>
      {actions ? (
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <span className={styles.actions}>{actions}</span>
        </div>
      ) : (
        <h2 className={styles.title}>{title}</h2>
      )}
      {children}
    </section>
  )
}

export default Panel
