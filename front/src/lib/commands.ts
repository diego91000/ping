// Point d'entrée public du parseur de commandes vocales.
// La logique est découpée dans src/lib/commands/ pour garder ce fichier lisible.
export type { Command } from './commands/types'
export { parseCommand } from './commands/parseCommand'
export { describeCommand } from './commands/describeCommand'
