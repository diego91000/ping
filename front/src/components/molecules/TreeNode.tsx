// Molécule : une entrée de l'arbre de fichiers (récursif).
// - fichier : bouton qui l'ouvre dans la zone Code + actions (renommer/supprimer).
// - dossier : se déplie au clic + actions (nouveau fichier/dossier, renommer, supprimer).
// Création et renommage se font via un champ inline (voir NameInput).
import { useEffect, useState } from 'react'
import {
  listFolder,
  readFile,
  createFile,
  createFolder,
  deleteFile,
  deleteFolder,
  moveFile,
  moveFolder,
} from '@/api/files'
import type { FsEntry, OpenFile } from '@/api/types'
import { logActivity } from '@/store/activityStore'
import { joinPath, parentOf, toPythonFileName } from '@/utils/path'
import { useDelayed } from '@/hooks/useDelayed'
import { IconButton, Spinner } from '@/components/atoms'
import NameInput from './NameInput'
import styles from './TreeNode.module.css'

// Demande de déplier/replier un dossier (chemin visé + "nonce" pour rejouer la commande).
export type ExpandTarget = { path: string; nonce: number; action?: 'expand' | 'collapse' } | null

type TreeNodeProps = {
  entry: FsEntry
  token: string
  onOpenFile: (file: OpenFile) => void
  // Prévient le parent qu'il doit recharger sa liste (après renommage/suppression).
  onChanged: () => void
  // Demande de déplier/replier un dossier (commande vocale "déplie/replie X").
  expandTarget: ExpandTarget
  // Change de valeur après une commande vocale sur les fichiers : chaque
  // dossier déjà ouvert recharge alors son contenu.
  refreshSignal: number
}

// Ce qu'on est en train de créer dans un dossier (rien, un fichier, un dossier).
type Creating = 'file' | 'folder' | null

function TreeNode({
  entry,
  token,
  onOpenFile,
  onChanged,
  expandTarget,
  refreshSignal,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(false)
  const [children, setChildren] = useState<FsEntry[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [creating, setCreating] = useState<Creating>(null)
  const [loading, setLoading] = useState(false)
  const showSpinner = useDelayed(loading)

  // Recharge le contenu du dossier depuis l'API.
  async function loadChildren() {
    const entries = await listFolder(entry.path, token)
    setChildren(entries)
    setLoaded(true)
  }

  // Réagit aux commandes vocales "déplie X" et "replie X".
  useEffect(() => {
    if (
      !expandTarget ||
      expandTarget.path !== entry.path ||
      !entry.isDirectory
    ) {
      return
    }

    if (expandTarget.action === 'collapse') {
      setExpanded(false)
      return
    }

    async function expandSelf() {
      if (!loaded) {
        try {
          await loadChildren()
        } catch {
          setError('Erreur de chargement')
          return
        }
      }
      setExpanded(true)
    }
    expandSelf()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandTarget?.nonce])

  // Après une commande vocale sur les fichiers, on recharge ce dossier
  // s'il a déjà été ouvert (pour voir les fichiers déplacés/créés dedans).
  useEffect(() => {
    if (loaded) {
      loadChildren().catch(() => setError('Erreur de chargement'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal])

  async function toggle() {
    if (loading) {
      return
    }
    // On charge le contenu au tout premier dépliage seulement.
    if (!expanded && !loaded) {
      setLoading(true)
      try {
        await loadChildren()
      } catch {
        setError('Erreur de chargement')
        return
      } finally {
        setLoading(false)
      }
    }
    setExpanded(!expanded)
  }

  async function open() {
    if (loading) {
      return
    }
    setLoading(true)
    try {
      const content = await readFile(entry.path, token)
      logActivity('command', `ouvrir ${entry.path}`)
      onOpenFile({ name: entry.name, path: entry.path, content })
    } catch {
      logActivity('command', `ouvrir ${entry.path}`, false)
      setError("Erreur d'ouverture")
    } finally {
      setLoading(false)
    }
  }

  // Affiche le champ de saisie pour créer un enfant (déplie d'abord le dossier).
  async function startCreate(isDirectory: boolean) {
    if (!loaded) {
      try {
        await loadChildren()
      } catch {
        setError('Erreur de chargement')
        return
      }
    }
    setExpanded(true)
    setCreating(isDirectory ? 'folder' : 'file')
  }

  async function doCreate(name: string) {
    const isDirectory = creating === 'folder'
    setCreating(null)
    if (!name) {
      return
    }
    // Même règle que dans l'arbre racine et la commande vocale : un fichier
    // créé est toujours du Python (seul langage exécutable par le backend).
    const finalName = isDirectory ? name : toPythonFileName(name)
    const path = joinPath(entry.path, finalName)
    try {
      if (isDirectory) {
        await createFolder(path, token)
      } else {
        await createFile(path, token)
      }
      logActivity('command', `créer ${isDirectory ? 'dossier' : 'fichier'} ${path}`)
      setError('')
      await loadChildren()
      setExpanded(true)
    } catch {
      logActivity('command', `créer ${isDirectory ? 'dossier' : 'fichier'} ${path}`, false)
      setError(`Création impossible : « ${finalName} » (le nom existe peut-être déjà)`)
    }
  } 

  async function doRename(name: string) {
    setRenaming(false)
    if (!name || name === entry.name) {
      return
    }
    const destination = joinPath(parentOf(entry.path), name)
    try {
      if (entry.isDirectory) {
        await moveFolder(entry.path, destination, token)
      } else {
        await moveFile(entry.path, destination, token)
      }
      logActivity('command', `renommer ${entry.path} → ${destination}`)
      onChanged()
    } catch {
      logActivity('command', `renommer ${entry.path} → ${destination}`, false)
      window.alert('Renommage impossible')
    }
  }

  async function remove() {
    if (!window.confirm(`Supprimer "${entry.name}" ?`)) {
      return
    }
    try {
      if (entry.isDirectory) {
        await deleteFolder(entry.path, token)
      } else {
        await deleteFile(entry.path, token)
      }
      logActivity('command', `supprimer ${entry.path}`)
      onChanged()
    } catch {
      logActivity('command', `supprimer ${entry.path}`, false)
      window.alert('Suppression impossible')
    }
  }

  // Un fichier.
  if (!entry.isDirectory) {
    return (
      <li>
        <div className={styles.row}>
          {renaming ? (
            <NameInput
              icon="📄"
              label="Nouveau nom du fichier"
              initialValue={entry.name}
              onSubmit={doRename}
              onCancel={() => setRenaming(false)}
            />
          ) : (
            <>
              <button
                type="button"
                className={styles.file}
                onClick={open}
                disabled={loading}
              >
                <span aria-hidden="true">📄 </span>
                {entry.name}
                {showSpinner && (
                  <>
                    {' '}
                    <Spinner />
                  </>
                )}
              </button>
              <span className={styles.actions}>
                <IconButton label={`Renommer ${entry.name}`} title="Renommer" onClick={() => setRenaming(true)}>
                  ✎
                </IconButton>
                <IconButton label={`Supprimer ${entry.name}`} title="Supprimer" onClick={remove}>
                  🗑
                </IconButton>
              </span>
            </>
          )}
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </li>
    )
  }

  // Un dossier.
  return (
    <li>
      <div className={styles.row}>
        {renaming ? (
          <NameInput
            icon="📁"
            label="Nouveau nom du dossier"
            initialValue={entry.name}
            onSubmit={doRename}
            onCancel={() => setRenaming(false)}
          />
        ) : (
          <>
            <button
              type="button"
              className={styles.folder}
              onClick={toggle}
              aria-expanded={expanded}
              disabled={loading}
            >
              <span aria-hidden="true">{expanded ? '▼' : '▶'} 📁 </span>
              {entry.name}
              {showSpinner && (
                <>
                  {' '}
                  <Spinner />
                </>
              )}
            </button>
            <span className={styles.actions}>
              <IconButton label={`Nouveau fichier dans ${entry.name}`} title="Nouveau fichier" onClick={() => startCreate(false)}>
                📄+
              </IconButton>
              <IconButton label={`Nouveau dossier dans ${entry.name}`} title="Nouveau dossier" onClick={() => startCreate(true)}>
                📁+
              </IconButton>
              <IconButton label={`Renommer ${entry.name}`} title="Renommer" onClick={() => setRenaming(true)}>
                ✎
              </IconButton>
              <IconButton label={`Supprimer ${entry.name}`} title="Supprimer" onClick={remove}>
                🗑
              </IconButton>
            </span>
          </>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {expanded && (
        <ul>
          {creating && (
            <li>
              <div className={styles.row}>
                <NameInput
                  icon={creating === 'folder' ? '📁' : '📄'}
                  label={
                    creating === 'folder'
                      ? 'Nom du nouveau dossier'
                      : 'Nom du nouveau fichier'
                  }
                  onSubmit={doCreate}
                  onCancel={() => setCreating(null)}
                />
              </div>
            </li>
          )}
          {children.map((child) => (
            <TreeNode
              key={child.path}
              entry={child}
              token={token}
              onOpenFile={onOpenFile}
              onChanged={loadChildren}
              expandTarget={expandTarget}
              refreshSignal={refreshSignal}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export default TreeNode
