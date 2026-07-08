// Organisme : barre de titre verte tout en haut de l'écran.
import { Button } from '@/components/atoms'
import styles from './TitleBar.module.css'

type TitleBarProps = {
  onLogout: () => void
  className?: string // placement dans la grille (fourni par le template)
}

function TitleBar({ onLogout, className }: TitleBarProps) {
  return (
    <header
      className={[styles.titlebar, className].filter(Boolean).join(' ')}
      aria-label="Barre de titre"
    >
      <h1 className={styles.name}>Ping — éditeur vocal</h1>
      <Button variant="subtle" className={styles.logout} onClick={onLogout}>
        Déconnexion
      </Button>
    </header>
  )
}

export default TitleBar
