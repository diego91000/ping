// Organisme : zone "Logs" — les appels au backend (ce que fait le serveur).
// Avant : kind="command" par erreur -> les lignes logActivity('backend', …)
// produites par apiFetch ne s'affichaient nulle part dans l'application.
import { Panel, ActivityList } from '@/components/molecules'

type LogsProps = {
  className?: string // placement dans la grille (fourni par le template)
}

function Logs({ className }: LogsProps) {
  return (
    <Panel title="Logs" className={className}>
      <ActivityList kind="backend" emptyLabel="Aucun appel backend pour l'instant" />
    </Panel>
  )
}

export default Logs
