// Page : l'éditeur complet. C'est ici que vivent l'état et les données
// (token, onglets, exécution des commandes vocales) ; le template ne fait que
// disposer les organismes.
import { useRef, useState } from 'react'
import {
  createFile,
  createFolder,
  deleteFile,
  deleteFolder,
  moveFile,
  moveFolder,
  readFile,
  runPython,
  saveFile,
  listFolder,
  listAllFiles,
} from '@/api/files'
import type { ExecResult, OpenFile, Tab } from '@/api/types'
import type { Command } from '@/lib/commands'
import { logActivity } from '@/store/activityStore'
import { basename, joinPath, toPythonFileName } from '@/utils/path'
import { matchFile } from '@/lib/match'
import EditorLayout from '@/components/templates/EditorLayout'
import {
  TitleBar,
  FileExplorer,
  CodeEditor,
  UsefulCommands,
  Logs,
  CommandPanel,
  Console,
  type ExpandTarget,
  type EditorApi,
} from '@/components/organisms'

// Message dit à voix haute quand une commande échoue.
function failureMessage(command: Command): string {
  switch (command.action) {
    case 'open':
      return 'Fichier introuvable'
    case 'expand':
    case 'collapse':
      return 'Dossier introuvable'
    case 'delete':
      return 'Suppression impossible'
    case 'move':
      return 'Déplacement impossible'
    case 'createFile':
    case 'createFolder':
      return 'Création impossible, le nom existe peut-être déjà'
    case 'run':
      return "Échec de l'exécution"
    case 'list':
      return 'Impossible de lister les fichiers'
    case 'insert':
    case 'edit':
    case 'goto':
    case 'gotoWord':
    case 'replaceLine':
    case 'deleteLineAt':
    case 'replaceWord':
    case 'deleteWord':
    case 'gotoWordPart':
    case 'replaceWordPart':
    case 'deleteWordPart':
      return "Impossible d'écrire"
    case 'save':
      return "Échec de l'enregistrement"
    case 'close':
      return 'Impossible de fermer'
  }
}

type EditorPageProps = {
  token: string
  onLogout: () => void
}

function EditorPage({ token, onLogout }: EditorPageProps) {
  // Les fichiers ouverts dans l'éditeur et le chemin de l'onglet actif.
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activePath, setActivePath] = useState<string | null>(null)
  // Bump à chaque opération vocale sur les fichiers pour rafraîchir l'arbre.
  const [treeVersion, setTreeVersion] = useState(0)
  // Demande de déplier/replier un dossier dans l'arbre (commande vocale "déplie/replie X").
  const [expandTarget, setExpandTarget] = useState<ExpandTarget>(null)
  // Sortie de la dernière exécution de code (affichée dans la Console).
  const [execOutput, setExecOutput] = useState<ExecResult | null>(null)
  // Une exécution de code est-elle en cours ?
  const [running, setRunning] = useState(false)
  // Dernière liste de fichiers numérotée (commande "liste" → "ouvre 2").
  const [listedFiles, setListedFiles] = useState<string[] | null>(null)
  // API d'édition Monaco (remplie par CodeEditor au montage).
  const editorApiRef = useRef<EditorApi | null>(null)
  // Dossier ouvert comme "projet" : racine de l'arbre affiché.
  // Le backend est confiné au workspace (FILESYSTEM_DEFAULT_PATH) : '' = la
  // racine du workspace. L'utilisateur peut ouvrir un sous-dossier via le
  // navigateur de dossiers.
  const [projectRoot, setProjectRoot] = useState('')
  // Ouvre un fichier : nouvel onglet s'il n'est pas déjà ouvert, sinon on l'active.
  // Mise à jour fonctionnelle : openFile est appelé après des await, la valeur
  // de "tabs" capturée par la closure peut être périmée (onglets perdus sinon).
  function openFile(file: OpenFile) {
    setTabs((prev) =>
        prev.some((tab) => tab.path === file.path)
            ? prev
            : [
              ...prev,
              {
                name: file.name,
                path: file.path,
                content: file.content,
                baseline: file.content,
              },
            ],
    )
    setActivePath(file.path)
  }
  // Ferme un onglet ; s'il était actif, on active le dernier onglet restant.
  function closeTab(path: string) {
    const remaining = tabs.filter((tab) => tab.path !== path)
    setTabs(remaining)
    if (activePath === path) {
      setActivePath(remaining.length > 0 ? remaining[remaining.length - 1].path : null)
    }
  }

  function updateContent(path: string, content: string) {
    setTabs((prev) =>
        prev.map((tab) => (tab.path === path ? { ...tab, content } : tab)),
    )
  }

  function markSaved(path: string) {
    setTabs((prev) =>
        prev.map((tab) =>
            tab.path === path ? { ...tab, baseline: tab.content } : tab,
        ),
    )
  }
  const activeTab = tabs.find((tab) => tab.path === activePath) ?? null

  // Enregistre l'onglet actif (utilisé par la commande vocale "enregistre").
  async function saveActiveTab() {
    if (!activeTab || activeTab.content === activeTab.baseline) {
      return
    }
    await saveFile(activeTab.path, activeTab.content, token)
    markSaved(activeTab.path)
    logActivity('command', `enregistrer ${activeTab.path}`)
  }

  // Supprime une entrée sans savoir si c'est un fichier ou un dossier :
  // on tente fichier, puis dossier.
  async function deleteEntry(name: string) {
    try {
      await deleteFile(name, token)
    } catch {
      await deleteFolder(name, token)
    }
  }

  // Déplace une entrée sans savoir si c'est un fichier ou un dossier.
  async function moveEntry(src: string, dst: string) {
    try {
      await moveFile(src, dst, token)
    } catch {
      await moveFolder(src, dst, token)
    }
  }

  // Résout un nom parlé vers un chemin : chemin exact avec dossiers imbriqués
  // puis recherche floue récursive dans tout le projet.
  async function resolveFile(name: string): Promise<string | null> {
    const all = await listAllFiles(projectRoot, token)
    const fileName = toPythonFileName(name)
    const exactPath = joinPath(projectRoot, fileName)
    if (all.includes(exactPath)) {
      return exactPath
    }
    return matchFile(name, all)
  }

  // Exécute une commande vocale validée. Chaque action réussie passe par
  // logActivity('command', …) → ligne Console + onde + bip.
  // Renvoie un message à dire à voix haute (succès ou échec).
  async function runCommand(command: Command): Promise<string> {
    try {
      switch (command.action) {
        case 'createFile': {
          const path = joinPath(projectRoot, command.name)
          await createFile(path, token)
          logActivity('command', `créer fichier ${path}`)
          setTreeVersion((version) => version + 1)
          return `Fichier ${command.name} créé`
        }
        case 'createFolder': {
          const path = joinPath(projectRoot, command.name)
          await createFolder(path, token)
          logActivity('command', `créer dossier ${path}`)
          setTreeVersion((version) => version + 1)
          return `Dossier ${command.name} créé`
        }
        case 'open': {
          const path = await resolveFile(command.name)
          if (!path) {
            return 'Fichier introuvable. Dis « liste » pour voir les fichiers.'
          }
          const content = await readFile(path, token)
          logActivity('command', `ouvrir ${path}`)
          openFile({ name: basename(path), path, content })
          return `${basename(path)} ouvert`
        }
        case 'expand': {
          const path = joinPath(projectRoot, command.name)
          // On vérifie que le dossier existe (sinon listFolder lève).
          await listFolder(path, token)
          setExpandTarget({ path, nonce: Date.now(), action: 'expand' })
          logActivity('command', `déplier ${path}`)
          return `Dossier ${command.name} déplié`
        }
        case 'collapse': {
          const path = joinPath(projectRoot, command.name)
          // On vérifie que le dossier existe (sinon listFolder lève).
          await listFolder(path, token)
          setExpandTarget({ path, nonce: Date.now(), action: 'collapse' })
          logActivity('command', `replier ${path}`)
          return `Dossier ${command.name} replié`
        }
        case 'delete': {
          const path =
              (await resolveFile(command.name)) ?? joinPath(projectRoot, command.name)
          await deleteEntry(path)
          logActivity('command', `supprimer ${path}`)
          setTreeVersion((version) => version + 1)
          return `${basename(path)} supprimé`
        }
        case 'move': {
          const src = joinPath(projectRoot, command.src)
          const dst = joinPath(projectRoot, command.dst)
          await moveEntry(src, dst)
          logActivity('command', `déplacer ${src} → ${dst}`)
          setTreeVersion((version) => version + 1)
          return `${command.src} déplacé`
        }
        case 'run': {
          const path = command.name
              ? await resolveFile(command.name)
              : (activeTab?.path ?? null)
          if (!path) {
            return command.name
                ? 'Fichier introuvable. Dis « liste » pour voir les fichiers.'
                : 'Aucun fichier à exécuter'
          }
          setRunning(true)
          try {
            if (
                activeTab &&
                activeTab.path === path &&
                activeTab.content !== activeTab.baseline
            ) {
              await saveFile(path, activeTab.content, token)
              markSaved(path)
            }
            const result = await runPython(path, token)
            setExecOutput(result)
            logActivity('command', `exécuter ${path}`, result.exitCode === 0)
            if (result.exitCode === 0) {
              const out = result.stdout.trim()
              return out ? `Exécution réussie. ${out}` : 'Exécution réussie, aucune sortie'
            }
            return `Erreur d'exécution. ${result.stderr.trim()}`
          } finally {
            setRunning(false)
          }
        }
        case 'list': {
          const base = command.name ? joinPath(projectRoot, command.name) : projectRoot
          const all = await listAllFiles(base, token)
          setListedFiles(all)
          setExecOutput(null)
          logActivity('command', `lister ${base}`)
          if (all.length === 0) {
            return 'Aucun fichier'
          }
          const spoken = all.map((path, i) => `${i + 1} : ${basename(path)}`).join(', ')
          return `${all.length} fichiers. ${spoken}`
        }
        case 'insert': {
          if (!activeTab) {
            return 'Aucun fichier ouvert'
          }
          editorApiRef.current?.insert(command.text)
          logActivity('command', `écrire ${command.text}`)
          return 'Écrit'
        }
        case 'edit': {
          if (!activeTab) {
            return 'Aucun fichier ouvert'
          }
          const api = editorApiRef.current
          if (command.edit === 'newline') api?.newline(command.count ?? 1)
          else if (command.edit === 'indent') api?.indent(command.count ?? 1)
          else if (command.edit === 'dedent') api?.dedent(command.count ?? 1)
          else api?.deleteLine()
          logActivity(
              'command',
              `édition ${command.edit}${command.count && command.count > 1 ? ` x${command.count}` : ''}`,
          )
          return 'Fait'
        }
        case 'goto': {
          if (!activeTab) {
            return 'Aucun fichier ouvert'
          }
          editorApiRef.current?.gotoLine(command.line)
          logActivity('command', `aller ligne ${command.line}`)
          return `Ligne ${command.line}`
        }
        case 'gotoWord': {
          if (!activeTab) {
            return 'Aucun fichier ouvert'
          }
          const ok = editorApiRef.current?.gotoLineWord(command.line, command.word)
          logActivity('command', `aller ligne ${command.line} mot ${command.word}`, ok)
          return ok ? `Ligne ${command.line}, mot ${command.word}` : 'Mot introuvable'
        }
        case 'replaceLine': {
          if (!activeTab) {
            return 'Aucun fichier ouvert'
          }
          const ok = editorApiRef.current?.replaceLine(command.line, command.text)
          logActivity('command', `remplacer ligne ${command.line} par ${command.text}`, ok)
          return ok ? `Ligne ${command.line} modifiée` : 'Ligne introuvable'
        }
        case 'deleteLineAt': {
          if (!activeTab) {
            return 'Aucun fichier ouvert'
          }
          const ok = editorApiRef.current?.deleteLineAt(command.line)
          logActivity('command', `supprimer ligne ${command.line}`, ok)
          return ok ? `Ligne ${command.line} supprimée` : 'Ligne introuvable'
        }
        case 'replaceWord': {
          if (!activeTab) {
            return 'Aucun fichier ouvert'
          }
          const ok = editorApiRef.current?.replaceWord(
              command.line,
              command.word,
              command.text,
          )
          logActivity(
              'command',
              `remplacer ligne ${command.line} mot ${command.word} par ${command.text}`,
              ok,
          )
          return ok ? `Mot ${command.word} modifié` : 'Mot introuvable'
        }
        case 'deleteWord': {
          if (!activeTab) {
            return 'Aucun fichier ouvert'
          }
          const ok = editorApiRef.current?.deleteWord(command.line, command.word)
          logActivity(
              'command',
              `supprimer ligne ${command.line} mot ${command.word}`,
              ok,
          )
          return ok ? `Mot ${command.word} supprimé` : 'Mot introuvable'
        }
        case 'gotoWordPart': {
          if (!activeTab) {
            return 'Aucun fichier ouvert'
          }
          const ok = editorApiRef.current?.gotoWordPart(
              command.line,
              command.word,
              command.start,
              command.end,
          )
          logActivity(
              'command',
              `aller ligne ${command.line} mot ${command.word} lettres ${command.start}-${command.end}`,
              ok,
          )
          return ok ? 'Sélection faite' : 'Partie introuvable'
        }
        case 'replaceWordPart': {
          if (!activeTab) {
            return 'Aucun fichier ouvert'
          }
          const ok = editorApiRef.current?.replaceWordPart(
              command.line,
              command.word,
              command.start,
              command.end,
              command.text,
          )
          logActivity(
              'command',
              `remplacer ligne ${command.line} mot ${command.word} lettres ${command.start}-${command.end} par ${command.text}`,
              ok,
          )
          return ok ? 'Partie modifiée' : 'Partie introuvable'
        }
        case 'deleteWordPart': {
          if (!activeTab) {
            return 'Aucun fichier ouvert'
          }
          const ok = editorApiRef.current?.deleteWordPart(
              command.line,
              command.word,
              command.start,
              command.end,
          )
          logActivity(
              'command',
              `supprimer ligne ${command.line} mot ${command.word} lettres ${command.start}-${command.end}`,
              ok,
          )
          return ok ? 'Partie supprimée' : 'Partie introuvable'
        }
        case 'save':
          if (!activeTab) {
            return 'Aucun fichier à enregistrer'
          }
          await saveActiveTab()
          return `${activeTab.name} enregistré`
        case 'close':
          if (!activePath) {
            return 'Aucun onglet à fermer'
          }
          closeTab(activePath)
          logActivity('command', `fermer ${activePath}`)
          return 'Onglet fermé'
      }
    } catch {
      logActivity(
          'command',
          `échec : ${command.action} ${'name' in command ? command.name : ''}`,
          false,
      )
      return failureMessage(command)
    }
  }

  return (
      <EditorLayout
          titleBar={<TitleBar onLogout={onLogout} />}
          files={
            <FileExplorer
                token={token}
                onOpenFile={openFile}
                refreshSignal={treeVersion}
                expandTarget={expandTarget}
                projectRoot={projectRoot}
                onOpenProject={setProjectRoot}
            />
          }
          editor={
            <CodeEditor
                tabs={tabs}
                activeTab={activeTab}
                token={token}
                onSelect={setActivePath}
                onClose={closeTab}
                onChange={updateContent}
                onSaved={markSaved}
                running={running}
                editorApiRef={editorApiRef}
                onRun={() => {
                  void runCommand({ action: 'run', name: null })
                }}
            />
          }
          usefulCommands={<UsefulCommands />}
          logs={<Logs />}
          command={<CommandPanel onRun={runCommand} />}
          console={<Console output={execOutput} running={running} files={listedFiles} />}
      />
  )
}

export default EditorPage
