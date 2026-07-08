import { describe, it, expect } from 'vitest'
import { parseCommand, describeCommand } from './commands'

// Tests du parseur vocal : une phrase dictée en entrée, une Command en sortie.
// Objectif : verrouiller le comportement des regex, qui cassent facilement
// en silence quand on en ajoute une nouvelle.
describe('parseCommand', () => {
  describe('fichiers et dossiers', () => {
    it('crée un fichier en imposant l\'extension .py', () => {
      expect(parseCommand('crée un fichier calculatrice')).toEqual({
        action: 'createFile',
        name: 'calculatrice.py',
      })
    })

    it('crée un dossier sans extension', () => {
      expect(parseCommand('crée un dossier exercices')).toEqual({
        action: 'createFolder',
        name: 'exercices',
      })
    })

    it('crée un fichier dans un dossier imbriqué', () => {
      expect(parseCommand('crée un fichier main dans le dossier src')).toEqual({
        action: 'createFile',
        name: 'src/main.py',
      })
    })

    it('traduit « point py » en « .py » à l\'ouverture', () => {
      expect(parseCommand('ouvre main point py')).toEqual({
        action: 'open',
        name: 'main.py',
      })
    })

    it('supprime un fichier nommé', () => {
      expect(parseCommand('supprime le fichier main point py')).toEqual({
        action: 'delete',
        name: 'main.py',
      })
    })

    it('déplace un fichier vers un dossier de destination', () => {
      expect(parseCommand('déplace main point py dans src')).toEqual({
        action: 'move',
        src: 'main.py',
        dst: 'src/main.py',
      })
    })
  })

  describe('exécution et listing', () => {
    it('exécute le fichier courant quand aucun nom n\'est donné', () => {
      expect(parseCommand('exécute le code')).toEqual({ action: 'run', name: null })
    })

    it('exécute un fichier nommé', () => {
      expect(parseCommand('lance le fichier main')).toEqual({ action: 'run', name: 'main' })
    })

    it('liste tout le projet quand aucun dossier n\'est donné', () => {
      expect(parseCommand('liste les fichiers')).toEqual({ action: 'list', name: null })
    })
  })

  describe('sauvegarde et fermeture', () => {
    it('reconnaît la sauvegarde', () => {
      expect(parseCommand('enregistre')).toEqual({ action: 'save' })
    })

    it('reconnaît la fermeture de l\'onglet', () => {
      expect(parseCommand('ferme')).toEqual({ action: 'close' })
    })
  })

  describe('navigation dans le code', () => {
    it('va à une ligne (chiffre)', () => {
      expect(parseCommand('va à la ligne 12')).toEqual({ action: 'goto', line: 12 })
    })

    it('va à une ligne (nombre en toutes lettres)', () => {
      expect(parseCommand('va à la ligne trois')).toEqual({ action: 'goto', line: 3 })
    })

    it('va à un mot précis d\'une ligne', () => {
      expect(parseCommand('va à la ligne 3 mot 2')).toEqual({
        action: 'gotoWord',
        line: 3,
        word: 2,
      })
    })
  })

  describe('édition ligne / mot', () => {
    it('remplace une ligne entière', () => {
      expect(parseCommand('remplace la ligne 2 par x égale 5')).toEqual({
        action: 'replaceLine',
        line: 2,
        text: 'x = 5',
      })
    })

    it('remplace un mot précis d\'une ligne', () => {
      expect(parseCommand('modifie ligne 3 mot 1 par bonjour')).toEqual({
        action: 'replaceWord',
        line: 3,
        word: 1,
        text: 'bonjour',
      })
    })

    it('supprime un mot précis d\'une ligne', () => {
      expect(parseCommand('supprime ligne 3 mot 2')).toEqual({
        action: 'deleteWord',
        line: 3,
        word: 2,
      })
    })

    it('supprime une ligne par son numéro', () => {
      expect(parseCommand('supprime la ligne 4')).toEqual({
        action: 'deleteLineAt',
        line: 4,
      })
    })
  })

  describe('indentation et sauts de ligne', () => {
    it('insère une nouvelle ligne (une fois par défaut)', () => {
      expect(parseCommand('nouvelle ligne')).toEqual({
        action: 'edit',
        edit: 'newline',
        count: 1,
      })
    })

    it('indente plusieurs fois', () => {
      expect(parseCommand('indente 2 fois')).toEqual({
        action: 'edit',
        edit: 'indent',
        count: 2,
      })
    })

    it('désindente avant d\'indenter (priorité sur « indente »)', () => {
      expect(parseCommand('désindente')).toEqual({
        action: 'edit',
        edit: 'dedent',
        count: 1,
      })
    })
  })

  describe('insertion de code Python', () => {
    it('génère un print à partir de « affiche »', () => {
      expect(parseCommand('affiche bonjour')).toEqual({
        action: 'insert',
        text: 'print("bonjour")',
      })
    })

    it('génère une définition de fonction', () => {
      expect(parseCommand('définis la fonction addition')).toEqual({
        action: 'insert',
        text: 'def addition():',
      })
    })

    it('traduit les mots-symboles en opérateurs', () => {
      expect(parseCommand('écris x plus y')).toEqual({
        action: 'insert',
        text: 'x + y',
      })
    })
  })

  it('renvoie null quand la phrase n\'est pas comprise', () => {
    expect(parseCommand('bla bla bla')).toBeNull()
  })
})

describe('describeCommand', () => {
  it('décrit la création d\'un fichier', () => {
    expect(describeCommand({ action: 'createFile', name: 'main.py' })).toBe(
      'créer le fichier « main.py »',
    )
  })

  it('décrit un déplacement à la ligne', () => {
    expect(describeCommand({ action: 'goto', line: 12 })).toBe('aller à la ligne 12')
  })
})
