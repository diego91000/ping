// Retour sonore : un bip aigu et doux en cas de succès, un bip grave en cas
// d'échec. Généré à la volée avec l'API audio du navigateur (aucun fichier son,
// aucune dépendance). Utile surtout pour un utilisateur malvoyant.

// On réutilise un seul contexte audio pour toute l'app.
let audioContext: AudioContext | null = null

function getContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext()
  }
  return audioContext
}

// Joue une courte note. ok = true -> aigu/doux, ok = false -> grave/dur.
export function playFeedback(ok: boolean) {
  try {
    const context = getContext()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.connect(gain)
    gain.connect(context.destination)

    oscillator.type = ok ? 'sine' : 'square'
    oscillator.frequency.value = ok ? 780 : 160

    // Petit fondu d'entrée/sortie pour éviter le "clic" désagréable.
    const now = context.currentTime
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)

    oscillator.start(now)
    oscillator.stop(now + 0.22)
  } catch {
    // Audio indisponible (navigateur qui bloque le son) : on ignore.
  }
}
