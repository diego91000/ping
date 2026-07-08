// Client HTTP de base : enrobe fetch et logue chaque appel dans les Logs.
import { logActivity } from '@/store/activityStore'

// Fait l'appel puis logue "MÉTHODE url → statut" dans le magasin d'activité.
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(path, init)
  const method = init?.method ?? 'GET'
  logActivity('backend', `${method} ${path} → ${response.status}`, response.ok)
  return response
}
