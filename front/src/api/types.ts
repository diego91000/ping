// Une entrée du système de fichiers renvoyée par le backend
// (un fichier ou un dossier).
export type FsEntry = {
  name: string
  path: string
  isDirectory: boolean
}

// Un fichier ouvert dans l'éditeur : son nom, son chemin et son contenu texte.
export type OpenFile = {
  name: string
  path: string
  content: string
}

// Un onglet ouvert dans l'éditeur.
// content = texte en cours d'édition ; baseline = dernier texte enregistré
// (utile pour savoir s'il reste des modifs non sauvegardées).
export type Tab = {
  name: string
  path: string
  content: string
  baseline: string
}

export type ExecResult = {
  stdout: string
  stderr: string
  exitCode: number
}
