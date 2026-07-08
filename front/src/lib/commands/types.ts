export type Command =
  | { action: 'createFile'; name: string }
  | { action: 'createFolder'; name: string }
  | { action: 'open'; name: string }
  | { action: 'expand'; name: string }
  | { action: 'collapse'; name: string }
  | { action: 'delete'; name: string }
  | { action: 'move'; src: string; dst: string }
  | { action: 'run'; name: string | null }
  | { action: 'list'; name: string | null }
  | { action: 'insert'; text: string }
  | { action: 'edit'; edit: 'newline' | 'indent' | 'dedent' | 'deleteLine'; count?: number }
  | { action: 'goto'; line: number }
  | { action: 'gotoWord'; line: number; word: number }
  | { action: 'replaceLine'; line: number; text: string }
  | { action: 'deleteLineAt'; line: number }
  | { action: 'replaceWord'; line: number; word: number; text: string }
  | { action: 'deleteWord'; line: number; word: number }
  | { action: 'gotoWordPart'; line: number; word: number; start: number; end: number }
  | { action: 'replaceWordPart'; line: number; word: number; start: number; end: number; text: string }
  | { action: 'deleteWordPart'; line: number; word: number; start: number; end: number }
  | { action: 'save' }
  | { action: 'close' }
