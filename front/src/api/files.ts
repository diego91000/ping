// Toutes les opérations sur les fichiers et dossiers du backend.
import { apiFetch } from './client'
import type { ExecResult, FsEntry } from './types'

// Liste le contenu d'un dossier (path vide = racine du backend).
// Le résultat est trié : dossiers d'abord, puis par ordre alphabétique.
export async function listFolder(
  path: string,
  token: string,
): Promise<FsEntry[]> {
  const response = await apiFetch(`/api/folders?path=${encodeURIComponent(path)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error('Impossible de lister le dossier')
  }

  const entries: FsEntry[] = await response.json()
  return sortEntries(entries)
}

// Liste récursivement tous les fichiers sous un dossier (chemins complets).
export async function listAllFiles(
  path: string,
  token: string,
): Promise<string[]> {
  const response = await apiFetch(`/api/files/all?path=${encodeURIComponent(path)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error('Impossible de lister les fichiers')
  }

  return response.json()
}

// Lit le contenu texte d'un fichier.
export async function readFile(path: string, token: string): Promise<string> {
  const response = await apiFetch(`/api/files?path=${encodeURIComponent(path)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error('Impossible de lire le fichier')
  }

  return response.text()
}

// Enregistre le contenu d'un fichier (écrase le fichier existant).
export async function saveFile(
  path: string,
  content: string,
  token: string,
): Promise<void> {
  const response = await apiFetch(
    `/api/files/upload?path=${encodeURIComponent(path)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
      },
      body: content,
    },
  )

  if (!response.ok) {
    throw new Error("Impossible d'enregistrer le fichier")
  }
}

// Envoie une requête JSON authentifiée (créer / supprimer / déplacer).
// Lève une erreur si le serveur refuse.
async function jsonRequest(
  url: string,
  method: string,
  body: object,
  token: string,
): Promise<void> {
  const response = await apiFetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error('Opération refusée par le serveur')
  }
}

// Crée un fichier vide au chemin donné.
export function createFile(path: string, token: string): Promise<void> {
  return jsonRequest('/api/files', 'POST', { relativePath: path }, token)
}

// Crée un dossier au chemin donné.
export function createFolder(path: string, token: string): Promise<void> {
  return jsonRequest('/api/folders', 'POST', { relativePath: path }, token)
}

// Supprime un fichier.
export function deleteFile(path: string, token: string): Promise<void> {
  return jsonRequest('/api/files', 'DELETE', { relativePath: path }, token)
}

// Supprime un dossier (et son contenu).
export function deleteFolder(path: string, token: string): Promise<void> {
  return jsonRequest('/api/folders', 'DELETE', { relativePath: path }, token)
}

// Renomme / déplace un fichier.
export function moveFile(
  src: string,
  dst: string,
  token: string,
): Promise<void> {
  return jsonRequest('/api/files/move', 'PUT', { src, dst }, token)
}

// Renomme / déplace un dossier.
export function moveFolder(
  src: string,
  dst: string,
  token: string,
): Promise<void> {
  return jsonRequest('/api/folders/move', 'PUT', { src, dst }, token)
}

// Exécute un fichier Python côté backend et renvoie sa sortie.
export async function runPython(
  path: string,
  token: string,
): Promise<ExecResult> {
  const response = await apiFetch('/api/exec', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ relativePath: path }),
  })

  if (!response.ok) {
    throw new Error("Impossible d'exécuter le fichier")
  }

  return response.json()
}

// Trie les entrées : les dossiers d'abord, puis par ordre alphabétique.
function sortEntries(entries: FsEntry[]): FsEntry[] {
  return [...entries].sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) {
      return a.isDirectory ? -1 : 1
    }
    return a.name.localeCompare(b.name)
  })
}
