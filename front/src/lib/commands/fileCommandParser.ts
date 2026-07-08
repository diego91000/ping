import { toPythonFileName } from '@/utils/path'
import type { Command } from './types'
import { cleanDestinationFolder, cleanPath } from './pathParser'

function parseMoveCommand(text: string): Command | null {
  const moveVerb = String.raw`(?:d[éeè]places?|d[éeè]placer|deplaces?|deplacer|d[éeè]\s+places?|de\s+places?|des\s+places?|bouge|bouger|replace|replacer)`
  let m = text.match(new RegExp(String.raw`^${moveVerb}\s+(.+)\s+vers\s+(.+)$`))

  if (!m) {
    m = text.match(new RegExp(String.raw`^${moveVerb}\s+(.+?)\s+dans\s+(.+)$`))
  }

  if (!m) {
    return null
  }

  const src = cleanPath(m[1])
  const target = cleanDestinationFolder(m[2])
  const base = src.includes('/') ? src.slice(src.lastIndexOf('/') + 1) : src
  const dst = target ? `${target}/${base}` : base
  return { action: 'move', src, dst }
}

function parseListCommand(text: string): Command | null {
  const m = text.match(
    /^(?:liste|lister|montre)(?:\s+les\s+fichiers)?(?:\s+(?:le\s+)?dossier\s+(.+)|\s+(.+))?$/,
  )
  if (!m) {
    return null
  }

  const name = cleanPath(m[1] ?? m[2] ?? '')
  return { action: 'list', name: name || null }
}

function parseRunCommand(text: string): Command | null {
  const m = text.match(
    /^(?:ex[ée]cute|ex[ée]cuter|lance|lancer)(?:\s+le\s+code|\s+le\s+fichier\s+(.+)|\s+(.+))?$/,
  )
  if (!m) {
    return null
  }

  const name = cleanPath(m[1] ?? m[2] ?? '')
  return { action: 'run', name: name || null }
}

function parseCreateCommand(text: string): Command | null {
  const m = text.match(
    /(?:cr[ée]e?r?|nouveau|nouvelle)\s+(?:un\s+|une\s+)?(fichier|dossier)\s+(.+)/,
  )
  if (!m) {
    return null
  }

  const name = cleanPath(m[2])
  return m[1] === 'dossier'
    ? { action: 'createFolder', name }
    : { action: 'createFile', name: toPythonFileName(name) }
}

function parseCollapseCommand(text: string): Command | null {
  const m = text.match(
    /(?:repli|replie|replies|replier|referme|refermer|ferme|fermer)\s+(?:le\s+|la\s+)?(?:dossier\s+)?(.+)/,
  )
  return m ? { action: 'collapse', name: cleanPath(m[1]) } : null
}

function parseExpandCommand(text: string): Command | null {
  const m =
    text.match(
      /(?:d[éeè]pli|d[éeè]plie|d[éeè]plier|d[éeè]veloppe|d[éeè]velopper|ouvre|ouvrir)\s+(?:le\s+|la\s+)?dossier\s+(.+)/,
    ) ||
    text.match(/(?:d[éeè]pli|d[éeè]plie|d[éeè]plier|d[éeè]veloppe|d[éeè]velopper)\s+(?:le\s+|la\s+)?(.+)/)

  return m ? { action: 'expand', name: cleanPath(m[1]) } : null
}

function parseOpenCommand(text: string): Command | null {
  const m = text.match(
    /(?:ouvre|ouvrir)\s+(?:le\s+|la\s+|un\s+|une\s+)?(?:fichier\s+|dossier\s+)?(.+)/,
  )
  return m ? { action: 'open', name: cleanPath(m[1]) } : null
}

function parseDeleteCommand(text: string): Command | null {
  const m = text.match(
    /(?:supprime|supprimer|efface|effacer)\s+(?:le\s+|la\s+|un\s+|une\s+)?(?:fichier\s+|dossier\s+)?(.+)/,
  )
  return m ? { action: 'delete', name: cleanPath(m[1]) } : null
}

// Commandes liées au projet et au système de fichiers.
export function parseFileCommand(text: string): Command | null {
  return (
    parseListCommand(text) ??
    parseRunCommand(text) ??
    parseCreateCommand(text) ??
    parseCollapseCommand(text) ??
    parseExpandCommand(text) ??
    parseOpenCommand(text) ??
    parseMoveCommand(text) ??
    parseDeleteCommand(text)
  )
}
