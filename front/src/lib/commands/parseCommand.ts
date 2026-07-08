import type { Command } from './types'
import { parseCodeCommand } from './codeCommandParser'
import { parseFileCommand } from './fileCommandParser'

function parseSaveCommand(text: string): Command | null {
  return /\b(enregistre|enregistrer|sauvegarde|sauvegarder)\b/.test(text)
    ? { action: 'save' }
    : null
}

function parseCloseCommand(text: string): Command | null {
  return /^(?:ferme|fermer|ferm[ée]|fermez)(?:\s+(?:l['’]?onglet|onglet|le fichier|fichier))?$/.test(text)
    ? { action: 'close' }
    : null
}

// Analyse la phrase et renvoie la commande structurée, ou null si non comprise.
export function parseCommand(transcript: string): Command | null {
  const text = transcript.trim().toLowerCase()

  return (
    parseSaveCommand(text) ??
    parseCloseCommand(text) ??
    parseCodeCommand(text) ??
    parseFileCommand(text)
  )
}
