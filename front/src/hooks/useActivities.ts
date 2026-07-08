// Hook React pour lire (et suivre en direct) les activités d'un type donné.
import { useSyncExternalStore } from 'react'
import {
  subscribe,
  getSnapshot,
  type Activity,
  type ActivityKind,
} from '@/store/activityStore'

export function useActivities(kind?: ActivityKind): Activity[] {
  const all = useSyncExternalStore(subscribe, getSnapshot)
  return kind ? all.filter((activity) => activity.kind === kind) : all
}
