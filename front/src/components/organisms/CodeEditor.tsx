// Organisme : zone "CODE" — barre d'onglets + éditeur Monaco (le moteur de VSCode).
// Coloration + numéros de ligne intégrés ; on enregistre avec Ctrl+S.
import { useEffect, useRef, useState, type RefObject } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import { saveFile } from '@/api/files'
import type { Tab } from '@/api/types'
import { logActivity } from '@/store/activityStore'
import { EditorTab } from '@/components/molecules'
import styles from './CodeEditor.module.css'

export type EditorApi = {
  insert: (text: string) => void
  newline: (count?: number) => void
  indent: (count?: number) => void
  dedent: (count?: number) => void
  deleteLine: () => void
  gotoLine: (line: number) => void
  gotoLineWord: (line: number, word: number) => boolean
  replaceLine: (line: number, text: string) => boolean
  deleteLineAt: (line: number) => boolean
  replaceWord: (line: number, word: number, text: string) => boolean
  deleteWord: (line: number, word: number) => boolean
  gotoWordPart: (line: number, word: number, start: number, end: number) => boolean
  replaceWordPart: (line: number, word: number, start: number, end: number, text: string) => boolean
  deleteWordPart: (line: number, word: number, start: number, end: number) => boolean
}

type CodeEditorProps = {
  tabs: Tab[]
  activeTab: Tab | null
  token: string
  onSelect: (path: string) => void
  onClose: (path: string) => void
  onChange: (path: string, content: string) => void
  onSaved: (path: string) => void
  onRun: () => void
  running: boolean
  editorApiRef: RefObject<EditorApi | null>
  className?: string // placement dans la grille (fourni par le template)
}

// Déduit le langage (pour la coloration) à partir de l'extension du fichier.
function languageFromName(name: string): string {
  const extension = name.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'py':
      return 'python'
    case 'js':
      return 'javascript'
    case 'ts':
    case 'tsx':
      return 'typescript'
    case 'java':
      return 'java'
    case 'c':
    case 'h':
      return 'c'
    case 'cpp':
    case 'cc':
      return 'cpp'
    case 'json':
      return 'json'
    case 'md':
      return 'markdown'
    case 'html':
      return 'html'
    case 'css':
      return 'css'
    default:
      return 'plaintext'
  }
}

function CodeEditor({
                      tabs,
                      activeTab,
                      token,
                      onSelect,
                      onClose,
                      onChange,
                      onSaved,
                      onRun,
                      running,
                      editorApiRef,
                      className,
                    }: CodeEditorProps) {
  const [error, setError] = useState('')

  // On efface le message d'erreur quand on change d'onglet.
  useEffect(() => {
    setError('')
  }, [activeTab?.path])

  async function save() {
    if (!activeTab || activeTab.content === activeTab.baseline) {
      return
    }
    try {
      await saveFile(activeTab.path, activeTab.content, token)
      logActivity('command', `enregistrer ${activeTab.path}`)
      onSaved(activeTab.path)
      setError('')
    } catch {
      logActivity('command', `enregistrer ${activeTab.path}`, false)
      setError("Erreur à l'enregistrement")
    }
  }

  // Monaco mémorise la commande Ctrl+S une seule fois (au montage) ; on garde
  // donc toujours la dernière version de "save" accessible via cette référence.
  const saveRef = useRef(save)
  useEffect(() => {
    saveRef.current = save
  })

  // Branche Ctrl+S (Cmd+S sur Mac) sur la sauvegarde, à l'intérieur de l'éditeur.
  const handleMount: OnMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveRef.current()
    })

    const insert = (text: string) => {
      const selection = editor.getSelection()
      const model = editor.getModel()
      if (!selection || !model) {
        return
      }

      let textToInsert = text
      if (selection.isEmpty() && text && !/^\s/.test(text)) {
        const position = selection.getStartPosition()
        const linePrefix = model
          .getLineContent(position.lineNumber)
          .slice(0, position.column - 1)

        if (/\S/.test(linePrefix) && !/\s$/.test(linePrefix)) {
          textToInsert = ` ${text}`
        }
      }

      editor.executeEdits('voice', [
        { range: selection, text: textToInsert, forceMoveMarkers: true },
      ])
      editor.focus()
    }

    const repeat = (count: number | undefined, action: () => void) => {
      const safeCount = Math.max(1, Math.min(count ?? 1, 12))
      for (let i = 0; i < safeCount; i++) {
        action()
      }
    }

    const insertNewline = () => {
      const selection = editor.getSelection()
      const model = editor.getModel()
      if (!selection || !model) {
        return
      }

      const position = selection.getStartPosition()
      const lineContent = model.getLineContent(position.lineNumber)
      const lineBeforeCursor = lineContent.slice(0, position.column - 1)
      const baseIndentation = lineContent.match(/^\s*/)?.[0] ?? ''
      const extraIndentation = lineBeforeCursor.trimEnd().endsWith(':') ? '    ' : ''
      const indentation = `${baseIndentation}${extraIndentation}`

      const nextPosition = {
        lineNumber: position.lineNumber + 1,
        column: indentation.length + 1,
      }

      editor.executeEdits('voice', [
        { range: selection, text: `
${indentation}`, forceMoveMarkers: true },
      ])
      editor.setPosition(nextPosition)
      editor.revealPositionInCenterIfOutsideViewport(nextPosition)
      editor.focus()
    }

    const revealCursor = () => {
      const position = editor.getPosition()
      if (!position) {
        return
      }

      editor.revealPositionInCenterIfOutsideViewport(position)
      editor.focus()
    }

    const getTouchedLines = () => {
      const selection = editor.getSelection()
      const model = editor.getModel()
      if (!selection || !model) {
        return []
      }

      const startLine = selection.startLineNumber
      let endLine = selection.endLineNumber
      if (!selection.isEmpty() && selection.endColumn === 1) {
        endLine -= 1
      }

      endLine = Math.max(startLine, endLine)
      const lines: number[] = []
      for (let line = startLine; line <= endLine; line++) {
        if (line >= 1 && line <= model.getLineCount()) {
          lines.push(line)
        }
      }
      return lines
    }

    const indentCurrentLines = () => {
      const model = editor.getModel()
      const position = editor.getPosition()
      const lines = getTouchedLines()
      if (!model || !position || lines.length === 0) {
        return
      }

      editor.executeEdits(
        'voice',
        lines.map((line) => ({
          range: new monaco.Range(line, 1, line, 1),
          text: '    ',
          forceMoveMarkers: true,
        })),
      )

      if (lines.includes(position.lineNumber)) {
        editor.setPosition({
          lineNumber: position.lineNumber,
          column: position.column + 4,
        })
      }
      revealCursor()
    }

    const countDedentCharacters = (content: string) => {
      if (content.startsWith('\t')) {
        return 1
      }

      const leadingSpaces = content.match(/^ {1,4}/)?.[0].length ?? 0
      return leadingSpaces
    }

    const dedentCurrentLines = () => {
      const model = editor.getModel()
      const position = editor.getPosition()
      const lines = getTouchedLines()
      if (!model || !position || lines.length === 0) {
        return
      }

      let removedOnCursorLine = 0
      const edits = lines.flatMap((line) => {
        const removed = countDedentCharacters(model.getLineContent(line))
        if (line === position.lineNumber) {
          removedOnCursorLine = removed
        }
        if (removed === 0) {
          return []
        }

        return [{
          range: new monaco.Range(line, 1, line, 1 + removed),
          text: '',
          forceMoveMarkers: true,
        }]
      })

      if (edits.length > 0) {
        editor.executeEdits('voice', edits)
      }

      if (removedOnCursorLine > 0) {
        editor.setPosition({
          lineNumber: position.lineNumber,
          column: Math.max(1, position.column - removedOnCursorLine),
        })
      }
      revealCursor()
    }

    const getCodeWords = (content: string) => {
      // On compte comme "mot" les vrais morceaux de code : identifiants et nombres.
      // Exemple : print("bonjour") => mot 1 = print, mot 2 = bonjour.
      // Exemple : range(10) => mot 1 = range, mot 2 = 10.
      return Array.from(content.matchAll(/[A-Za-zÀ-ÖØ-öø-ÿ_][A-Za-zÀ-ÖØ-öø-ÿ_0-9]*|\d+/g))
    }

    const getWordRange = (line: number, word: number) => {
      const model = editor.getModel()
      if (!model || line < 1 || line > model.getLineCount() || word < 1) {
        return null
      }

      const content = model.getLineContent(line)
      const match = getCodeWords(content)[word - 1]
      if (!match || match.index === undefined) {
        return null
      }

      const startColumn = match.index + 1
      const endColumn = startColumn + match[0].length
      return new monaco.Range(line, startColumn, line, endColumn)
    }

    const getWordPartRange = (line: number, word: number, start: number, end: number) => {
      const model = editor.getModel()
      if (!model || line < 1 || line > model.getLineCount() || word < 1) {
        return null
      }

      const content = model.getLineContent(line)
      const match = getCodeWords(content)[word - 1]
      if (!match || match.index === undefined) {
        return null
      }

      const wordLength = match[0].length
      const safeStart = Math.max(1, Math.min(start, wordLength))
      const safeEnd = Math.max(safeStart, Math.min(end, wordLength))
      const startColumn = match.index + safeStart
      const endColumn = match.index + safeEnd + 1
      return new monaco.Range(line, startColumn, line, endColumn)
    }

    const getWordDeleteRange = (line: number, word: number) => {
      const model = editor.getModel()
      const range = getWordRange(line, word)
      if (!model || !range) {
        return null
      }

      const content = model.getLineContent(line)
      let startIndex = range.startColumn - 1
      let endIndex = range.endColumn - 1

      if (startIndex > 0 && /\s/.test(content[startIndex - 1])) {
        let whitespaceStart = startIndex
        while (whitespaceStart > 0 && /\s/.test(content[whitespaceStart - 1])) {
          whitespaceStart -= 1
        }

        // On enlève l'espace avant le mot seulement si ce n'est pas
        // l'indentation de début de ligne.
        if (/\S/.test(content.slice(0, whitespaceStart))) {
          startIndex = whitespaceStart
        }
      } else if (endIndex < content.length && /\s/.test(content[endIndex])) {
        while (endIndex < content.length && /\s/.test(content[endIndex])) {
          endIndex += 1
        }
      }

      return new monaco.Range(line, startIndex + 1, line, endIndex + 1)
    }

    const replaceRange = (range: ReturnType<typeof getWordRange>, text: string) => {
      if (!range) {
        return false
      }
      editor.executeEdits('voice', [{ range, text, forceMoveMarkers: true }])
      editor.setSelection(new monaco.Selection(
        range.startLineNumber,
        range.startColumn + text.length,
        range.startLineNumber,
        range.startColumn + text.length,
      ))
      editor.revealPositionInCenterIfOutsideViewport({
        lineNumber: range.startLineNumber,
        column: range.startColumn + text.length,
      })
      editor.focus()
      return true
    }

    editorApiRef.current = {
      insert,
      newline: (count = 1) => repeat(count, insertNewline),
      indent: (count = 1) => repeat(count, indentCurrentLines),
      dedent: (count = 1) => repeat(count, dedentCurrentLines),
      deleteLine: () => editor.trigger('voice', 'editor.action.deleteLines', null),
      gotoLine: (line: number) => {
        const model = editor.getModel()
        const column =
          model && line >= 1 && line <= model.getLineCount()
            ? model.getLineMaxColumn(line)
            : 1

        editor.setPosition({ lineNumber: line, column })
        editor.revealLineInCenter(line)
        editor.focus()
      },
      gotoLineWord: (line: number, word: number) => {
        const range = getWordRange(line, word)
        if (!range) {
          return false
        }
        editor.setSelection(range)
        editor.revealLineInCenter(line)
        editor.focus()
        return true
      },
      replaceLine: (line: number, text: string) => {
        const model = editor.getModel()
        if (!model || line < 1 || line > model.getLineCount()) {
          return false
        }
        return replaceRange(
            new monaco.Range(line, 1, line, model.getLineMaxColumn(line)),
            text,
        )
      },
      deleteLineAt: (line: number) => {
        const model = editor.getModel()
        if (!model || line < 1 || line > model.getLineCount()) {
          return false
        }
        editor.setPosition({ lineNumber: line, column: 1 })
        editor.trigger('voice', 'editor.action.deleteLines', null)
        editor.focus()
        return true
      },
      replaceWord: (line: number, word: number, text: string) => {
        const range = getWordRange(line, word)
        return replaceRange(range, text)
      },
      deleteWord: (line: number, word: number) => {
        const range = getWordDeleteRange(line, word)
        return replaceRange(range, '')
      },
      gotoWordPart: (line: number, word: number, start: number, end: number) => {
        const range = getWordPartRange(line, word, start, end)
        if (!range) {
          return false
        }
        editor.setSelection(range)
        editor.revealLineInCenter(line)
        editor.focus()
        return true
      },
      replaceWordPart: (line: number, word: number, start: number, end: number, text: string) => {
        const range = getWordPartRange(line, word, start, end)
        return replaceRange(range, text)
      },
      deleteWordPart: (line: number, word: number, start: number, end: number) => {
        const range = getWordPartRange(line, word, start, end)
        return replaceRange(range, '')
      },
    }
  }

  const rootClass = [styles.panel, className].filter(Boolean).join(' ')

  // Aucun onglet ouvert : message d'invitation.
  if (!activeTab) {
    return (
        <section className={rootClass} aria-label="Éditeur de code">
          <div className={styles.empty}>
            Sélectionne un fichier dans l'arbre pour l'éditer ici.
          </div>
        </section>
    )
  }

  return (
      <section className={rootClass} aria-label="Éditeur de code">
        <div className={styles.toolbar}>
          <div className={styles.tabs}>
            {tabs.map((tab) => (
                <EditorTab
                    key={tab.path}
                    name={tab.name}
                    isActive={tab.path === activeTab.path}
                    isDirty={tab.content !== tab.baseline}
                    onSelect={() => onSelect(tab.path)}
                    onClose={() => onClose(tab.path)}
                />
            ))}
          </div>
          <button
              type="button"
              className={styles.run}
              onClick={onRun}
              disabled={running}
              title={running ? 'Exécution en cours…' : 'Exécuter (Python)'}
              aria-label={running ? 'Exécution en cours' : `Exécuter ${activeTab.name}`}
          >
            {running ? '⏳' : '▶'}
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.body}>
          <Editor
              height="100%"
              theme="vs-dark"
              language={languageFromName(activeTab.name)}
              value={activeTab.content}
              onChange={(value) => onChange(activeTab.path, value ?? '')}
              onMount={handleMount}
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
          />
        </div>
      </section>
  )
}

export default CodeEditor
