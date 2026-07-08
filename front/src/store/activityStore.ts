// Magasin d'activité partagé par toute l'app (hors React, pattern "external store").
// - "command" : une commande exécutée par l'utilisateur (affichée dans la Console).
// - "backend" : un appel au serveur (affiché dans les Logs).
// Les composants et la couche API y écrivent ; le hook useActivities le lit.
import { playFeedback } from '@/lib/sound'

export type ActivityKind = 'command' | 'backend'

export type Activity = {
  id: number
  kind: ActivityKind
  text: string
  ok: boolean
  time: string // heure locale "HH:MM:SS"
}

let items: Activity[] = []
let nextId = 1
const listeners = new Set<() => void>()

// Ajoute une ligne d'activité et prévient les abonnés (Console / Logs).
export function logActivity(kind: ActivityKind, text: string, ok = true) {
  const entry: Activity = {
    id: nextId++,
    kind,
    text,
    ok,
    time: new Date().toLocaleTimeString(),
  }
  items = [...items, entry]

  // Retour sonore uniquement pour les commandes de l'utilisateur.
  if (kind === 'command') {
    playFeedback(ok)
  }

  listeners.forEach((listener) => listener())
}

// Abonnement et lecture, consommés par le hook useActivities.
export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getSnapshot() {
  return items
}
