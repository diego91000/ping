import type { Command } from './types'
import { NUMBER_PATTERN, parseVoiceNumber } from './voiceNumbers'
import { toComparison, toPythonString, translateSymbols } from './symbols'

const EDIT_COUNT_SUFFIX = `(?:\\s+(${NUMBER_PATTERN})(?:\\s*(?:fois|foi|foix|x))?)?`
const REPLACE_SEPARATOR_PATTERN = '(?:par|part|avec)'

function normalizeCodeCommandText(text: string): string {
  return text
    .replace(/\bdescendantes?\b/g, 'désindente')
    .replace(/\b(?:d[éeè]s|des)\s+indentes?\b/g, 'désindente')
    .replace(/\b(\d+)\s*[x×]\b/g, '$1 fois')
}

function parseWordPartEdition(text: string): Command | null {
  let m: RegExpMatchArray | null

  m = text.match(
    new RegExp(String.raw`\b(?:remplace|remplacer|modifie|modifier)\s+(?:la\s+)?ligne\s+(${NUMBER_PATTERN})\s+mode\s+(?:lettre|caract[èe]re)s?\s+(${NUMBER_PATTERN})(?:\s+(?:à|a|jusqu[’']?à|jusqu[’']?a)\s+(${NUMBER_PATTERN}))?\s+${REPLACE_SEPARATOR_PATTERN}\s+(.+)`),
  )
  if (m) {
    const start = parseVoiceNumber(m[2])
    return {
      action: 'replaceWordPart',
      line: parseVoiceNumber(m[1]),
      word: 2,
      start,
      end: m[3] ? parseVoiceNumber(m[3]) : start,
      text: translateSymbols(m[4]),
    }
  }

  m = text.match(
    new RegExp(String.raw`^(?:(?:va|aller)\s*(?:à|a)?\s*)?(?:la\s+)?ligne\s+(${NUMBER_PATTERN})\s+mode\s+(?:lettre|caract[èe]re)s?\s+(${NUMBER_PATTERN})(?:\s+(?:à|a|jusqu[’']?à|jusqu[’']?a)\s+(${NUMBER_PATTERN}))?$`),
  )
  if (m) {
    const start = parseVoiceNumber(m[2])
    return {
      action: 'gotoWordPart',
      line: parseVoiceNumber(m[1]),
      word: 2,
      start,
      end: m[3] ? parseVoiceNumber(m[3]) : start,
    }
  }

  m = text.match(
    new RegExp(String.raw`\b(?:remplace|remplacer|modifie|modifier)\s+(?:la\s+)?ligne\s+(${NUMBER_PATTERN})\s+(?:mot|mot\s+num[ée]ro)\s+(${NUMBER_PATTERN})\s+(?:lettre|caract[èe]re)s?\s+(${NUMBER_PATTERN})(?:\s+(?:à|a|jusqu[’']?à|jusqu[’']?a)\s+(${NUMBER_PATTERN}))?\s+${REPLACE_SEPARATOR_PATTERN}\s+(.+)`),
  )
  if (m) {
    const start = parseVoiceNumber(m[3])
    return {
      action: 'replaceWordPart',
      line: parseVoiceNumber(m[1]),
      word: parseVoiceNumber(m[2]),
      start,
      end: m[4] ? parseVoiceNumber(m[4]) : start,
      text: translateSymbols(m[5]),
    }
  }

  m = text.match(
    new RegExp(String.raw`^(?:(?:va|aller)\s*(?:à|a)?\s*)?(?:la\s+)?ligne\s+(${NUMBER_PATTERN})\s+(?:au\s+)?(?:mot|mot\s+num[ée]ro)\s+(${NUMBER_PATTERN})\s+(?:lettre|caract[èe]re)s?\s+(${NUMBER_PATTERN})(?:\s+(?:à|a|jusqu[’']?à|jusqu[’']?a)\s+(${NUMBER_PATTERN}))?$`),
  )
  if (m) {
    const start = parseVoiceNumber(m[3])
    return {
      action: 'gotoWordPart',
      line: parseVoiceNumber(m[1]),
      word: parseVoiceNumber(m[2]),
      start,
      end: m[4] ? parseVoiceNumber(m[4]) : start,
    }
  }

  m = text.match(
    new RegExp(String.raw`\b(?:efface|effacer|supprime|supprimer|retire|retirer|enl[èe]ve|enlever)\s+(?:la\s+)?ligne\s+(${NUMBER_PATTERN})\s+mode\s+(?:lettre|caract[èe]re)s?\s+(${NUMBER_PATTERN})(?:\s+(?:à|a|jusqu[’']?à|jusqu[’']?a)\s+(${NUMBER_PATTERN}))?`),
  )
  if (m) {
    const start = parseVoiceNumber(m[2])
    return {
      action: 'deleteWordPart',
      line: parseVoiceNumber(m[1]),
      word: 2,
      start,
      end: m[3] ? parseVoiceNumber(m[3]) : start,
    }
  }

  m = text.match(
    new RegExp(String.raw`\b(?:efface|effacer|supprime|supprimer|retire|retirer|enl[èe]ve|enlever)\s+(?:la\s+)?ligne\s+(${NUMBER_PATTERN})\s+(?:mot|mot\s+num[ée]ro)\s+(${NUMBER_PATTERN})\s+(?:lettre|caract[èe]re)s?\s+(${NUMBER_PATTERN})(?:\s+(?:à|a|jusqu[’']?à|jusqu[’']?a)\s+(${NUMBER_PATTERN}))?`),
  )
  if (m) {
    const start = parseVoiceNumber(m[3])
    return {
      action: 'deleteWordPart',
      line: parseVoiceNumber(m[1]),
      word: parseVoiceNumber(m[2]),
      start,
      end: m[4] ? parseVoiceNumber(m[4]) : start,
    }
  }

  return null
}

function parseLineAndWordEdition(text: string): Command | null {
  let m: RegExpMatchArray | null

  // Chrome entend parfois « mot 2 » comme « mode ».
  m = text.match(
    new RegExp(
      `\\b(?:remplace|remplacer|modifie|modifier)\\s+(?:la\\s+)?ligne\\s+(${NUMBER_PATTERN})\\s+mode\\s+${REPLACE_SEPARATOR_PATTERN}\\s+(.+)`,
    ),
  )
  if (m) {
    return {
      action: 'replaceWord',
      line: parseVoiceNumber(m[1]),
      word: 2,
      text: translateSymbols(m[2]),
    }
  }

  m = text.match(
    new RegExp(
      `\\b(?:remplace|remplacer|modifie|modifier)\\s+(?:la\\s+)?ligne\\s+(${NUMBER_PATTERN})\\s+(?:mot|mot\\s+num[ée]ro)\\s+(${NUMBER_PATTERN})\\s+${REPLACE_SEPARATOR_PATTERN}\\s+(.+)`,
    ),
  )
  if (m) {
    return {
      action: 'replaceWord',
      line: parseVoiceNumber(m[1]),
      word: parseVoiceNumber(m[2]),
      text: translateSymbols(m[3]),
    }
  }

  m = text.match(
    new RegExp(
      `\\b(?:remplace|remplacer|modifie|modifier)\\s+(?:la\\s+)?ligne\\s+(${NUMBER_PATTERN})\\s+${REPLACE_SEPARATOR_PATTERN}\\s+(.+)`,
    ),
  )
  if (m) {
    return {
      action: 'replaceLine',
      line: parseVoiceNumber(m[1]),
      text: translateSymbols(m[2]),
    }
  }

  m = text.match(
    new RegExp(
      `\\b(?:efface|effacer|supprime|supprimer|retire|retirer|enl[èe]ve|enlever)\\s+(?:la\\s+)?ligne\\s+(${NUMBER_PATTERN})\\s+mode\\b`,
    ),
  )
  if (m) {
    return {
      action: 'deleteWord',
      line: parseVoiceNumber(m[1]),
      word: 2,
    }
  }

  m = text.match(
    new RegExp(
      `\\b(?:efface|effacer|supprime|supprimer|retire|retirer|enl[èe]ve|enlever)\\s+(?:la\\s+)?ligne\\s+(${NUMBER_PATTERN})\\s+(?:mot|mot\\s+num[ée]ro)\\s+(${NUMBER_PATTERN})\\b`,
    ),
  )
  if (m) {
    return {
      action: 'deleteWord',
      line: parseVoiceNumber(m[1]),
      word: parseVoiceNumber(m[2]),
    }
  }

  m = text.match(
    new RegExp(
      `\\b(?:efface|effacer|supprime|supprimer)\\s+(?:la\\s+)?ligne\\s+(${NUMBER_PATTERN})\\b`,
    ),
  )
  if (m) {
    return { action: 'deleteLineAt', line: parseVoiceNumber(m[1]) }
  }

  return null
}

function parseNavigation(text: string): Command | null {
  let m: RegExpMatchArray | null

  m = text.match(
    new RegExp(
      `^(?:(?:va|aller)\\s*(?:à|a)?\\s*)?(?:la\\s+)?ligne\\s+(${NUMBER_PATTERN})\\s+mode$`,
    ),
  )
  if (m) {
    return {
      action: 'gotoWord',
      line: parseVoiceNumber(m[1]),
      word: 2,
    }
  }

  m = text.match(
    new RegExp(
      `^(?:(?:va|aller)\\s*(?:à|a)?\\s*)?(?:la\\s+)?ligne\\s+(${NUMBER_PATTERN})\\s+(?:au\\s+)?(?:mot|mot\\s+num[ée]ro)\\s+(${NUMBER_PATTERN})$`,
    ),
  )
  if (m) {
    return {
      action: 'gotoWord',
      line: parseVoiceNumber(m[1]),
      word: parseVoiceNumber(m[2]),
    }
  }

  m = text.match(
    new RegExp(
      `(?:va|aller)\\s+(?:à|a)\\s+(?:la\\s+)?ligne\\s+(${NUMBER_PATTERN})`,
    ),
  )
  if (m) {
    return { action: 'goto', line: parseVoiceNumber(m[1]) }
  }

  return null
}

function parseFormattingEdit(text: string): Command | null {
  let m: RegExpMatchArray | null

  m = text.match(
    new RegExp(
      `\\b(?:nouvelle ligne|saut de ligne|retour (?:à|a) la ligne|retour ligne)${EDIT_COUNT_SUFFIX}\\b`,
    ),
  )
  if (m) {
    return {
      action: 'edit',
      edit: 'newline',
      count: m[1] ? parseVoiceNumber(m[1]) : 1,
    }
  }

  // Important : on teste la désindentation avant l'indentation.
  m = text.match(
    new RegExp(
      `\\b(?:d[éeè]sindente|d[éeè]sindenter|d[éeè]dente|descendante|descendantes|d[éeè]cale (?:à|a) gauche|(?:supprime|supprimer|retire|retirer|enl[èe]ve|enlever)\\s+(?:l['’]?|la\\s+)?indentation)${EDIT_COUNT_SUFFIX}\\b`,
    ),
  )
  if (m) {
    return {
      action: 'edit',
      edit: 'dedent',
      count: m[1] ? parseVoiceNumber(m[1]) : 1,
    }
  }

  m = text.match(
    new RegExp(
      `\\b(?:indente|indenter|d[éeè]cale (?:à|a) droite|tabulation)${EDIT_COUNT_SUFFIX}\\b`,
    ),
  )
  if (m) {
    return {
      action: 'edit',
      edit: 'indent',
      count: m[1] ? parseVoiceNumber(m[1]) : 1,
    }
  }

  if (/\b(?:efface|effacer|supprime|supprimer)\s+(?:la\s+|cette\s+)?ligne\b/.test(text)) {
    return { action: 'edit', edit: 'deleteLine' }
  }

  return null
}

function parsePythonSnippet(text: string): Command | null {
  let m: RegExpMatchArray | null

  if ((m = text.match(/\bimporte\s+(.+)/))) {
    return { action: 'insert', text: `import ${translateSymbols(m[1])}` }
  }
  if ((m = text.match(/\bcommentaire\s+(.+)/))) {
    return { action: 'insert', text: `# ${m[1].trim()}` }
  }
  if ((m = text.match(/\b(?:d[ée]finis(?: la fonction| une fonction)?|fonction)\s+(.+)/))) {
    return { action: 'insert', text: `def ${translateSymbols(m[1])}():` }
  }
  if ((m = text.match(/\bboucle\s+(.+?)\s+fois/))) {
    return { action: 'insert', text: `for i in range(${translateSymbols(m[1])}):` }
  }
  if ((m = text.match(/\bpour\s+(.+?)\s+de\s+(.+?)\s+(?:à|a)\s+(.+)/))) {
    return {
      action: 'insert',
      text: `for ${translateSymbols(m[1])} in range(${translateSymbols(m[2])}, ${translateSymbols(m[3])}):`,
    }
  }
  if ((m = text.match(/\btant que\s+(.+)/))) {
    return { action: 'insert', text: `while ${toComparison(translateSymbols(m[1]))}:` }
  }
  if (/^\s*sinon\s*$/.test(text)) {
    return { action: 'insert', text: 'else:' }
  }
  if ((m = text.match(/\bsi\s+(.+)/))) {
    return { action: 'insert', text: `if ${toComparison(translateSymbols(m[1]))}:` }
  }
  if ((m = text.match(/\b(?:retourne|renvoie)\s+(.+)/))) {
    return { action: 'insert', text: `return ${translateSymbols(m[1])}` }
  }
  if ((m = text.match(/\baffiche\s+(?:la\s+)?variable\s+(.+)/))) {
    return { action: 'insert', text: `print(${translateSymbols(m[1])})` }
  }
  if ((m = text.match(/\baffiche\s+(?:le texte|la cha[îi]ne)\s+(.+)/))) {
    return { action: 'insert', text: `print("${toPythonString(m[1])}")` }
  }
  if ((m = text.match(/\baffiche\s+(.+)/))) {
    return { action: 'insert', text: `print("${toPythonString(m[1])}")` }
  }
  if ((m = text.match(/\bvariable\s+(.+?)\s+(?:[ée]gale?|=)\s+(.+)/))) {
    return { action: 'insert', text: `${translateSymbols(m[1])} = ${translateSymbols(m[2])}` }
  }
  if ((m = text.match(/(?:[ée]cris|[ée]crire|ins[èe]re|ins[ée]rer|tape|taper)\s+(.+)/))) {
    return { action: 'insert', text: translateSymbols(m[1]) }
  }

  return null
}

// Reconnaît les commandes d'écriture/édition de code avant les commandes fichier.
export function parseCodeCommand(rawText: string): Command | null {
  const text = normalizeCodeCommandText(rawText)

  return (
    parseWordPartEdition(text) ??
    parseLineAndWordEdition(text) ??
    parseNavigation(text) ??
    parseFormattingEdit(text) ??
    parsePythonSnippet(text)
  )
}
