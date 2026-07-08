const NUMBER_WORDS: Record<string, number> = {
  un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7,
  huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14,
  quinze: 15, seize: 16,
}

export function parseIndex(name: string): number | null {
  const text = name.trim().toLowerCase()
  if (/^\d+$/.test(text)) {
    return parseInt(text, 10)
  }
  return NUMBER_WORDS[text] ?? null
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\bpoint\b/g, '.')
    .replace(/\s+/g, '')
}

function baseName(path: string): string {
  const index = path.lastIndexOf('/')
  return index === -1 ? path : path.slice(index + 1)
}

function stem(name: string): string {
  const index = name.lastIndexOf('.')
  return index === -1 ? name : name.slice(0, index)
}

function distance(a: string, b: string): number {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) rows[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost)
    }
  }
  return rows[a.length][b.length]
}

export function matchFile(query: string, paths: string[]): string | null {
  const q = normalize(query)
  if (!q) return null

  let best: string | null = null
  let bestScore = 0
  let ambiguous = false

  for (const path of paths) {
    const name = normalize(baseName(path))
    const root = normalize(stem(baseName(path)))
    let score = 0
    if (normalize(path) === q) score = 100
    else if (name === q) score = 90
    else if (root === q) score = 80
    else if (name.includes(q) || root.includes(q)) score = 60
    else if (distance(root, q) <= 2) score = 40 - distance(root, q) * 5

    if (score > bestScore) {
      bestScore = score
      best = path
      ambiguous = false
    } else if (score === bestScore && score > 0) {
      ambiguous = true
    }
  }

  return ambiguous ? null : best
}
