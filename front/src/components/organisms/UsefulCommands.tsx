// Organisme : zone "Commandes utiles" — aide-mémoire des commandes vocales.
// (« X » = un nom de fichier ou de dossier.)
import { Panel } from '@/components/molecules'
import styles from './UsefulCommands.module.css'

const COMMANDS = [
  { phrase: 'crée un fichier X', description: 'Nouveau fichier Python (X.py)' },
  { phrase: 'crée fichier X dans A dans B', description: 'Créer A/B/X.py selon les dossiers dictés' },
  { phrase: 'crée un dossier X', description: 'Nouveau dossier' },
  { phrase: 'ouvre X', description: 'Ouvrir un fichier (par nom)' },
  { phrase: 'ouvre X dans A dans B', description: 'Ouvrir un fichier dans des sous-dossiers' },
  { phrase: 'liste', description: 'Lister les fichiers' },
  { phrase: 'déplie X', description: 'Déplier un dossier' },
  { phrase: 'replie X', description: 'Replier un dossier' },
  { phrase: 'supprime X', description: 'Supprimer' },
  { phrase: 'déplace X vers Y', description: 'Déplacer X dans le dossier Y' },
  { phrase: 'exécute', description: 'Lancer le fichier Python' },
  { phrase: 'enregistre', description: 'Enregistrer le fichier' },
  { phrase: 'ferme', description: "Fermer l'onglet" },
  { phrase: 'va à la ligne 1', description: 'Placer le curseur à la fin de la ligne 1' },
  { phrase: 'ligne 3 mot 2', description: 'Sélectionner le mot 2 de la ligne 3' },
  { phrase: 'remplace ligne 3 par X', description: 'Remplacer toute la ligne 3' },
  { phrase: 'supprime ligne 3', description: 'Supprimer la ligne 3' },
  { phrase: 'remplace ligne 3 mot 2 par X', description: 'Modifier un mot précis' },
  { phrase: 'supprime ligne 3 mot 2', description: 'Supprimer un mot précis' },
  { phrase: 'remplace ligne 3 mot 2 lettre 1 par X', description: 'Modifier une lettre dans un mot' },
  { phrase: 'remplace ligne 3 mot 2 lettres 1 à 3 par X', description: 'Modifier une partie d’un mot' },
  { phrase: 'supprime ligne 3 mot 2 lettre 1', description: 'Supprimer une lettre dans un mot' },
  { phrase: 'supprime ligne 3 mot 2 lettres 1 à 3', description: 'Supprimer une partie d’un mot' },
  { phrase: 'affiche X', description: 'Écrire print("X")' },
  { phrase: 'affiche variable X', description: 'Écrire print(X)' },
  { phrase: 'variable x égal 3', description: 'Écrire x = 3' },
  { phrase: 'fonction salut', description: 'Écrire def salut():' },
  { phrase: 'boucle 10 fois', description: 'Écrire for i in range(10):' },
  { phrase: 'nouvelle ligne', description: 'Aller à la ligne en gardant l’indentation' },
  { phrase: 'indente 2 fois', description: 'Ajouter deux niveaux d’indentation' },
  { phrase: 'désindente 2 fois', description: 'Retirer deux niveaux d’indentation' },
  { phrase: 'écris …', description: 'Dicter du code (symboles)' },
  { phrase: 'arrête écoute', description: 'Couper l’écoute active' },
]

type UsefulCommandsProps = {
  className?: string // placement dans la grille (fourni par le template)
}

function UsefulCommands({ className }: UsefulCommandsProps) {
  return (
    <Panel title="Commandes utiles" ariaLabel="Commandes utiles" className={className}>
      <ul className={styles.list}>
        {COMMANDS.map((command) => (
          <li key={command.phrase} className={styles.item}>
            <span className={styles.phrase}>« {command.phrase} »</span>
            <span className={styles.desc}>{command.description}</span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

export default UsefulCommands
