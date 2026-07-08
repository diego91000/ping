// Organisme : mini-sélecteur de dossier, en popup, façon "Ouvrir un dossier".
// Le backend tourne racine = '/', donc les chemins sont absolus mais sans le
// '/' de tête ('' = /, 'home/mara' = /home/mara). On descend dans un dossier au
// clic, on remonte, puis on ouvre le dossier courant. Réutilise listFolder.
import { useEffect, useState } from 'react'
import { listFolder } from '@/api/files'
import type { FsEntry } from '@/api/types'
import { parentOf, displayPath } from '@/utils/path'
import { Button, IconButton } from '@/components/atoms'
import styles from './FolderPicker.module.css'

type FolderPickerProps = {
  token: string
  // Dossier où démarrer la navigation.
  startPath: string
  // Ouvre le dossier choisi comme projet.
  onPick: (path: string) => void
  // Ferme le navigateur sans rien changer.
  onCancel: () => void
}

function FolderPicker({ token, startPath, onPick, onCancel }: FolderPickerProps) {
  const [currentPath, setCurrentPath] = useState(startPath)
  const [folders, setFolders] = useState<FsEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Charge les sous-dossiers du chemin courant (on ignore les fichiers).
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    listFolder(currentPath, token)
      .then((entries) => {
        if (cancelled) {
          return
        }
        setFolders(entries.filter((entry) => entry.isDirectory))
      })
      .catch(() => {
        if (!cancelled) {
          setError('Dossier illisible (droits insuffisants ?)')
          setFolders([])
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [currentPath, token])

  const atRoot = currentPath === ''

  return (
    // Fond semi-transparent : un clic à côté ferme le popup.
    <div className={styles.backdrop} onClick={onCancel}>
      <section
        className={styles.picker}
        aria-label="Ouvrir un dossier"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.head}>
          <strong>Ouvrir un dossier</strong>
          <IconButton label="Fermer" size="lg" onClick={onCancel}>
            ✕
          </IconButton>
        </div>

        <div className={styles.bar}>
          <IconButton
            label="Remonter au dossier parent"
            size="md"
            variant="boxed"
            onClick={() => setCurrentPath(parentOf(currentPath))}
            disabled={atRoot}
          >
            ⬆
          </IconButton>
          <span className={styles.path} title={displayPath(currentPath)}>
            {displayPath(currentPath)}
          </span>
        </div>

        <ul className={styles.list}>
          {loading && <li className={styles.msg}>Chargement…</li>}
          {error && <li className={styles.msg}>{error}</li>}
          {!loading && !error && folders.length === 0 && (
            <li className={styles.msg}>Aucun sous-dossier</li>
          )}
          {!loading &&
            !error &&
            folders.map((folder) => (
              <li key={folder.path}>
                <button
                  type="button"
                  className={styles.folder}
                  onClick={() => setCurrentPath(folder.path)}
                  aria-label={`Entrer dans ${folder.name}`}
                >
                  <span aria-hidden="true">📁 </span>
                  {folder.name}
                </button>
              </li>
            ))}
        </ul>

        <div className={styles.actions}>
          <Button
            variant="primary"
            className={styles.grow}
            onClick={() => onPick(currentPath)}
            aria-label={`Ouvrir le dossier ${displayPath(currentPath)}`}
          >
            Ouvrir ce dossier
          </Button>
          <Button variant="subtle" onClick={onCancel}>
            Annuler
          </Button>
        </div>
      </section>
    </div>
  )
}

export default FolderPicker
