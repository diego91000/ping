// Reconnaissance et synthèse vocales via la Web Speech API.
// Ne marche que sur Chrome / Edge (objet préfixé webkitSpeechRecognition).
// On expose un hook simple : useSpeechRecognition(), plus speak() pour la TTS.
import { useCallback, useEffect, useRef, useState } from 'react'

// La Web Speech API n'est pas typée par TypeScript : on décrit le minimum
// dont on se sert.
type SpeechResultEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}

type SpeechErrorEvent = {
  error: string
}

type RecognitionInstance = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  onresult: ((event: SpeechResultEvent) => void) | null
  onend: (() => void) | null
  onerror: ((event: SpeechErrorEvent) => void) | null
}

// Récupère la classe SpeechRecognition du navigateur (ou null si non supportée).
function getRecognitionClass(): (new () => RecognitionInstance) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => RecognitionInstance
    webkitSpeechRecognition?: new () => RecognitionInstance
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

// Synthèse vocale : fait lire un texte à voix haute (l'app "parle").
// Très utile pour un utilisateur malvoyant. Supportée par tous les navigateurs.
export function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const synth = window.speechSynthesis
      synth.cancel() // on coupe ce qui est éventuellement en train d'être dit
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'fr-FR'
      utterance.onend = () => resolve()
      utterance.onerror = () => resolve()
      synth.speak(utterance)
    } catch {
      // synthèse indisponible : on ignore
      resolve()
    }
  })
}

export type SpeechHook = {
  supported: boolean // le navigateur sait-il faire de la reconnaissance ?
  listening: boolean // est-on en train d'écouter ?
  transcript: string // le dernier texte reconnu
  start: () => void
  stop: () => void
  reset: () => void // efface le texte reconnu
}

export function useSpeechRecognition(): SpeechHook {
  const recognitionRef = useRef<RecognitionInstance | null>(null)
  const listeningRef = useRef(false)
  const [supported] = useState(() => getRecognitionClass() !== null)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')

  function setListeningState(value: boolean) {
    listeningRef.current = value
    setListening(value)
  }

  // On crée l'objet de reconnaissance une fois, au montage.
  useEffect(() => {
    const RecognitionClass = getRecognitionClass()
    if (!RecognitionClass) {
      return
    }

    const recognition = new RecognitionClass()
    recognition.lang = 'fr-FR'
    recognition.continuous = false // une phrase par écoute, puis le panel relance automatiquement
    recognition.interimResults = false // seulement le résultat final
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      const firstResult = event.results[0]?.[0]?.transcript ?? ''
      setTranscript(firstResult)
    }
    recognition.onend = () => setListeningState(false)
    recognition.onerror = () => setListeningState(false)

    recognitionRef.current = recognition

    // Nettoyage : on coupe tout si le composant disparaît.
    return () => {
      recognition.onresult = null
      recognition.onend = null
      recognition.onerror = null
      try {
        recognition.stop()
      } catch {
        // rien à faire si ce n'était pas démarré
      }
    }
  }, [])

  const start = useCallback(() => {
    const recognition = recognitionRef.current
    if (!recognition || listeningRef.current) {
      return
    }
    setTranscript('')
    try {
      recognition.start()
      setListeningState(true)
    } catch {
      // start() lève si déjà en cours : on ignore.
    }
  }, [])

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop()
    } catch {
      // stop() peut lever si l'écoute est déjà terminée : on ignore.
    } finally {
      setListeningState(false)
    }
  }, [])

  const reset = useCallback(() => {
    setTranscript('')
  }, [])

  return { supported, listening, transcript, start, stop, reset }
}
