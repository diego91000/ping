// Organisme : zone "Fichiers" — l'arborescence du dossier ouvert, lue depuis l'API,
// + le bouton "Ouvrir un dossier" (📂) qui ouvre le mini-sélecteur.
import { useEffect, useState } from 'react'
import { createFile, createFolder, listFolder } from '@/api/files'
import { joinPath, toPythonFileName } from '@/utils/path'
import type { FsEntry, OpenFile } from '@/api/types'
import { logActivity } from '@/store/activityStore'

import { IconButton } from '@/components/atoms'
import { Panel, NameInput, TreeNode, type ExpandTarget } from '@/components/molecules'
import FolderPicker from './FolderPicker'
import styles from './FileExplorer.module.css'

// On ré-exporte le type pour la page (compat avec l'ancien emplacement).
export type { ExpandTarget }

type FileExplorerProps = {
  token: string
  // Message si la connexion au backend a échoué (affiché à la place de
  // l'arbre — avant, on restait bloqué sur "Chargement…" pour toujours).
  authError?: string
  onOpenFile: (file: OpenFile) => void
  // Change de valeur quand une commande vocale a modifié les fichiers.
  refreshSignal: number
  // Demande de déplier un dossier (commande vocale "déplie X").
  expandTarget: ExpandTarget
  // Dossier ouvert comme "projet" : racine de l'arbre.
  projectRoot: string
  // Ouvre un autre dossier comme projet (change la racine de l'arbre).
  onOpenProject: (path: string) => void
  className?: string // placement dans la grille (fourni par le template)
}

// Ce qu'on est en train de créer à la racine (rien, un fichier, un dossier).
type Creating = 'file' | 'folder' | null

function FileExplorer({
  token,
  authError,
  onOpenFile,
  refreshSignal,
  expandTarget,
  projectRoot,
  onOpenProject,
  className,
}: FileExplorerProps) {
  const [entries, setEntries] = useState<FsEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState<Creating>(null)
  // Une création est-elle en cours ? (désactive les boutons + message,
  // critère "opérations asynchrones" du guide de soutenance)
  const [creatingBusy, setCreatingBusy] = useState(false)
  // Erreur de la dernière création (séparée de "error" qui masque l'arbre).
  const [createError, setCreateError] = useState('')
  // Le navigateur de dossiers est-il ouvert ?
  const [picking, setPicking] = useState(false)

  // Recharge le contenu du dossier ouvert (projectRoot) depuis l'API.
  async function loadRoot() {
    try {
      const rootEntries = await listFolder(projectRoot, token)
      setEntries(rootEntries)
    } catch {
      setError('Erreur de chargement des fichiers')
    } finally {
      setLoading(false)
    }
  }

  // On liste le dossier ouvert dès qu'on a le token, et à chaque changement
  // de projet ou de signal de rafraîchissement.
  useEffect(() => {
    if (!token) {
      return
    }
    setLoading(true)
    setError('')
    loadRoot()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, refreshSignal, projectRoot])

  async function doCreate(name: string) {
    const isDirectory = creating === 'folder'
    setCreating(null)
    if (!name || creatingBusy) {
      return
    }
    // Un dossier n'a pas d'extension ; un fichier est toujours du Python
    // (seul langage supporté par l'exécution) : on l'impose ici aussi, pour
    // que la création via l'arbre reste cohérente avec la commande vocale.
    const finalName = isDirectory ? name : toPythonFileName(name)
    const path = joinPath(projectRoot, finalName)
    setCreatingBusy(true)
    try {
      if (isDirectory) {
        await createFolder(path, token)
      } else {
        await createFile(path, token)
      }
      logActivity('command', `créer ${isDirectory ? 'dossier' : 'fichier'} ${path}`)
      setCreateError('')
      await loadRoot()
    } catch {
      logActivity('command', `créer ${isDirectory ? 'dossier' : 'fichier'} ${path}`, false)
      setCreateError(`Création impossible : « ${finalName} » (le nom existe peut-être déjà)`)
    } finally {
      setCreatingBusy(false)
    }
  }

  return (
    <Panel
      title="Fichiers"
      ariaLabel="Fichiers"
      className={className}
      actions={
        <>
          <IconButton label="Ouvrir un dossier" title="Ouvrir un dossier" onClick={() => setPicking(true)}>
            📂
          </IconButton>
          <IconButton
            label="Nouveau fichier dans le dossier ouvert"
            title="Nouveau fichier"
            onClick={() => setCreating('file')}
            disabled={creatingBusy}
          >
            📄+
          </IconButton>
          <IconButton
            label="Nouveau dossier dans le dossier ouvert"
            title="Nouveau dossier"
            onClick={() => setCreating('folder')}
            disabled={creatingBusy}
          >
            📁+
          </IconButton>
        </>
      }
    >
      {picking && (
        <FolderPicker
          token={token}
          startPath=""
          onPick={(path) => {
            setPicking(false)
            onOpenProject(path)
          }}
          onCancel={() => setPicking(false)}
        />
      )}

      <div className={styles.body}>
        {authError ? (
          <p role="alert">{authError}</p>
        ) : !token ? (
          <p>Connexion au serveur…</p>
        ) : (
          loading && <p>Chargement…</p>
        )}
        {error && <p role="alert">{error}</p>}
        {creatingBusy && <p aria-live="polite">Création en cours…</p>}
        {createError && <p role="alert">{createError}</p>}
        {token && !authError && !loading && !error && (
          <ul className={styles.fileList}>
            {creating && (
              <li>
                <div className={styles.row}>
                  <NameInput
                    icon={creating === 'folder' ? '📁' : '📄'}
                    label={
                      creating === 'folder'
                        ? 'Nom du nouveau dossier'
                        : 'Nom du nouveau fichier (extension .py ajoutée automatiquement)'
                    } 
                    onSubmit={doCreate}
                    onCancel={() => setCreating(null)}
                  />
                </div>
              </li>
            )}
            {entries.map((entry) => (
              <TreeNode
                key={entry.path}
                entry={entry}
                token={token}
                onOpenFile={onOpenFile}
                onChanged={loadRoot}
                expandTarget={expandTarget}
                refreshSignal={refreshSignal}
              />
            ))}
          </ul>
        )}
      </div>
    </Panel>
  )
}

export default FileExplorer
