// Helpers de chemin, partagés par l'arbre de fichiers et le sélecteur de dossier.
// Le backend tourne racine = '/', donc les chemins sont absolus mais sans le
// '/' de tête ('' = /, 'home/mara' = /home/mara).

// Assemble un chemin ("src" + "a.c" -> "src/a.c", "" + "a.c" -> "a.c").
export function joinPath(parent: string, name: string): string {
  return parent ? `${parent}/${name}` : name
}

// Le dossier parent d'un chemin ("src/app.c" -> "src", "main.py" -> "").
export function parentOf(path: string): string {
  const index = path.lastIndexOf('/')
  return index === -1 ? '' : path.slice(0, index)
}

// Le nom de fichier d'un chemin ("src/app.py" -> "app.py").
export function basename(path: string): string {
  const index = path.lastIndexOf('/')
  return index === -1 ? path : path.slice(index + 1)
}

// Affiche un chemin absolu lisible ('' -> "/", 'home/mara' -> "/home/mara").
export function displayPath(path: string): string {
  return '/' + path
}

export function toPythonFileName(name: string): string {
  const withoutExtension = name.replace(/\.[a-z0-9]+$/i, '')
  return `${withoutExtension}.py`
}
