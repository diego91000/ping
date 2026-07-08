// Chaque motif est entouré de (?<= )…(?= ) : on délimite par des espaces
// et pas par \b, qui ne marche pas autour des accents en regex JS.
const SYMBOLS: [RegExp, string][] = [
  [/(?<= )parenth[èe]se ouvrante(?= )/g, '('],
  [/(?<= )parenth[èe]se fermante(?= )/g, ')'],
  [/(?<= )crochet ouvrant(?= )/g, '['],
  [/(?<= )crochet fermant(?= )/g, ']'],
  [/(?<= )accolade ouvrante(?= )/g, '{'],
  [/(?<= )accolade fermante(?= )/g, '}'],
  [/(?<= )guillemets?(?= )/g, '"'],
  [/(?<= )apostrophe(?= )/g, "'"],
  [/(?<= )diff[ée]rent de(?= )/g, '!='],
  [/(?<= )inf[ée]rieur (?:ou )?[ée]gale? (?:à|a)(?= )/g, '<='],
  [/(?<= )sup[ée]rieur (?:ou )?[ée]gale? (?:à|a)(?= )/g, '>='],
  [/(?<= )inf[ée]rieur(?: (?:à|a))?(?= )/g, '<'],
  [/(?<= )sup[ée]rieur(?: (?:à|a))?(?= )/g, '>'],
  [/(?<= )double [ée]gale?(?= )/g, '=='],
  [/(?<= )[ée]gale?(?= )/g, '='],
  [/(?<= )deux points(?= )/g, ':'],
  [/(?<= )point virgule(?= )/g, ';'],
  [/(?<= )virgule(?= )/g, ','],
  [/(?<= )point(?= )/g, '.'],
  [/(?<= )plus(?= )/g, '+'],
  [/(?<= )moins(?= )/g, '-'],
  [/(?<= )(?:fois|[ée]toile)(?= )/g, '*'],
  [/(?<= )(?:divis[ée] par|divis[ée]|slash)(?= )/g, '/'],
  [/(?<= )(?:underscore|tiret bas)(?= )/g, '_'],
]

// Traduit une phrase dictée en code : les mots-symboles deviennent des symboles.
export function translateSymbols(raw: string): string {
  let text = ` ${raw.toLowerCase().replace(/\s+/g, ' ')} `
  for (const [pattern, symbol] of SYMBOLS) {
    text = text.replace(pattern, symbol)
  }
  return text
    .replace(/\s+/g, ' ')
    .replace(/\s*\.\s*/g, '.')
    .replace(/\s+([([{])/g, '$1')
    .replace(/([([{])\s+/g, '$1')
    .replace(/\s+([)\]},:;])/g, '$1')
    .replace(/"\s+/g, '"')
    .replace(/\s+"/g, '"')
    .trim()
}

// Convertit les "=" d'affectation en "==" pour une condition.
export function toComparison(code: string): string {
  return code.replace(/(^|[^=!<>])=(?!=)/g, '$1==')
}

export function toPythonString(raw: string): string {
  return raw.trim().replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}
