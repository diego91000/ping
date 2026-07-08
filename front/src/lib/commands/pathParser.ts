// Nettoie un nom dicté et traduit les mots-symboles usuels :
// « main point py » -> « main.py », « mon underscore fichier » -> « mon_fichier ».
export function cleanName(raw: string): string {
  return raw
    .trim()
    .replace(/[.,!?]+$/, '')
    .replace(/\s+point\s+/gi, '.')
    .replace(/\s+(?:underscore|tiret bas)\s+/gi, '_')
    .replace(/\s+tiret\s+/gi, '-')
    .replace(/\s+/g, '')
    .toLowerCase()
}

// Nettoie un chemin dicté avec des dossiers imbriqués :
// « main dans dossier src dans dossier exercices » -> « src/exercices/main ».
export function cleanPath(raw: string): string {
  const folderSplit =
    /\s+(?:qui\s+est\s+)?dans\s+(?:le\s+|la\s+|les\s+|un\s+|une\s+|des\s+)?(?:(?:dossier|r[ée]pertoire|directory)\s+(?!dans\b))?/gi
  const leadingKind =
    /^(?:(?:le|la|les|un|une|des)\s+)?(?:fichier|dossier|r[ée]pertoire|directory)\s+/i

  const parts = raw
    .split(folderSplit)
    .map((part) => cleanName(part.replace(leadingKind, '')))
    .filter(Boolean)

  if (parts.length <= 1) {
    return parts[0] ?? ''
  }

  const fileOrFolderName = parts[0]
  const folders = parts.slice(1)
  return [...folders, fileOrFolderName].join('/')
}

export function cleanDestinationFolder(raw: string): string {
  const text = raw.trim().toLowerCase()
  if (/^(?:la\s+|le\s+)?(?:racine|root|dossier\s+racine)(?:\s+du\s+projet)?$/.test(text)) {
    return ''
  }
  return cleanPath(raw)
}
