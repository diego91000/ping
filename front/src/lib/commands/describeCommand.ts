import type { Command } from './types'

const EDIT_LABELS = {
  newline: 'nouvelle ligne',
  indent: 'indenter',
  dedent: 'désindenter',
  deleteLine: 'effacer la ligne',
} satisfies Record<Extract<Command, { action: 'edit' }>['edit'], string>

// Décrit une commande en français pour l'affichage et la synthèse vocale.
export function describeCommand(command: Command): string {
  switch (command.action) {
    case 'createFile':
      return `créer le fichier « ${command.name} »`
    case 'createFolder':
      return `créer le dossier « ${command.name} »`
    case 'open':
      return `ouvrir « ${command.name} »`
    case 'expand':
      return `déplier le dossier « ${command.name} »`
    case 'collapse':
      return `replier le dossier « ${command.name} »`
    case 'delete':
      return `supprimer « ${command.name} »`
    case 'move':
      return `déplacer « ${command.src} » vers « ${command.dst} »`
    case 'run':
      return command.name ? `exécuter « ${command.name} »` : 'exécuter le fichier courant'
    case 'list':
      return command.name ? `lister le dossier « ${command.name} »` : 'lister les fichiers'
    case 'insert':
      return `écrire « ${command.text} »`
    case 'edit': {
      const count = command.count && command.count > 1 ? ` ${command.count} fois` : ''
      return `${EDIT_LABELS[command.edit]}${count}`
    }
    case 'goto':
      return `aller à la ligne ${command.line}`
    case 'gotoWord':
      return `aller à la ligne ${command.line}, mot ${command.word}`
    case 'replaceLine':
      return `remplacer la ligne ${command.line} par « ${command.text} »`
    case 'deleteLineAt':
      return `supprimer la ligne ${command.line}`
    case 'replaceWord':
      return `remplacer le mot ${command.word} de la ligne ${command.line} par « ${command.text} »`
    case 'deleteWord':
      return `supprimer le mot ${command.word} de la ligne ${command.line}`
    case 'gotoWordPart':
      return command.start === command.end
        ? `aller à la lettre ${command.start} du mot ${command.word} de la ligne ${command.line}`
        : `aller aux lettres ${command.start} à ${command.end} du mot ${command.word} de la ligne ${command.line}`
    case 'replaceWordPart':
      return command.start === command.end
        ? `remplacer la lettre ${command.start} du mot ${command.word} de la ligne ${command.line} par « ${command.text} »`
        : `remplacer les lettres ${command.start} à ${command.end} du mot ${command.word} de la ligne ${command.line} par « ${command.text} »`
    case 'deleteWordPart':
      return command.start === command.end
        ? `supprimer la lettre ${command.start} du mot ${command.word} de la ligne ${command.line}`
        : `supprimer les lettres ${command.start} à ${command.end} du mot ${command.word} de la ligne ${command.line}`
    case 'save':
      return 'enregistrer le fichier'
    case 'close':
      return "fermer l'onglet"
  }
}
