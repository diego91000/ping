// Organisme : zone "Console" — l'historique des commandes exécutées
// (exigence du CR de réunion : « interface type console affichant les
// commandes exécutées ») + la sortie de la dernière exécution de code.
import { Panel, ActivityList } from '@/components/molecules'
import type { ExecResult } from '@/api/types'
import styles from './Console.module.css'

type ConsoleProps = {
  className?: string
  output: ExecResult | null
  running: boolean
  files: string[] | null
}

function Console({ className, output, running, files }: ConsoleProps) {
  return (
    <Panel title="Console" className={className}>
      <div className={styles.body} tabIndex={0} aria-busy={running} aria-live="polite">
        <ActivityList kind="command" emptyLabel="Aucune commande pour l'instant" />

        {running ? (
          <p>Exécution en cours…</p>
        ) : output ? (
          <>
            {output.stdout && <pre className={styles.out}>{output.stdout}</pre>}
            {output.stderr && <pre className={styles.err}>{output.stderr}</pre>}
            <p className={styles.exit}>Code de sortie : {output.exitCode}</p>
          </>
        ) : files ? (
          files.length === 0 ? (
            <p>Aucun fichier</p>
          ) : (
            <ol className={styles.list}>
              {files.map((path) => (
                <li key={path}>{path}</li>
              ))}
            </ol>
          )
        ) : null}
      </div>
    </Panel>
  )
}

export default Console
