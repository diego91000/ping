import { describe, it, expect } from 'vitest'
import { matchFile, parseIndex } from './match'

// Recherche floue du fichier visé à partir d'un nom dicté (Levenshtein).
describe('matchFile', () => {
  it('trouve un fichier par son nom exact, même dans un sous-dossier', () => {
    expect(matchFile('main.py', ['src/main.py', 'tests/util.py'])).toBe('src/main.py')
  })

  it('ignore les accents et la casse', () => {
    expect(matchFile('UTIL', ['src/util.py'])).toBe('src/util.py')
  })

  it('tolère une petite faute de frappe (distance <= 2)', () => {
    expect(matchFile('man', ['main.py'])).toBe('main.py')
  })

  it('renvoie null quand deux fichiers correspondent aussi bien (ambigu)', () => {
    expect(matchFile('util', ['a/util.py', 'b/util.py'])).toBeNull()
  })

  it('renvoie null quand rien ne correspond', () => {
    expect(matchFile('xyz', ['main.py'])).toBeNull()
  })

  it('renvoie null pour une requête vide', () => {
    expect(matchFile('', ['main.py'])).toBeNull()
  })
})

describe('parseIndex', () => {
  it('lit un index en chiffres', () => {
    expect(parseIndex('3')).toBe(3)
  })

  it('lit un index écrit en toutes lettres', () => {
    expect(parseIndex('deux')).toBe(2)
  })

  it('renvoie null pour un mot inconnu', () => {
    expect(parseIndex('foo')).toBeNull()
  })
})
