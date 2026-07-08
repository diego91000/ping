// Organisme : zone "Commande" — écoute permanente → mot-clé "écoute" →
// commande entendue → l'app la répète → Valider / Annuler.
import { useEffect, useRef, useState } from 'react'
import { Panel, Waveform } from '@/components/molecules'
import { Button } from '@/components/atoms'
import { useSpeechRecognition, speak } from '@/hooks/useSpeechRecognition'
import { parseCommand, describeCommand, type Command } from '@/lib/commands'
import styles from './CommandPanel.module.css'

type CommandPanelProps = {
  // Exécute une commande validée et renvoie un message à dire (fourni par la page).
  onRun: (command: Command) => Promise<string>
  className?: string // placement dans la grille (fourni par le template)
}

type ConfirmationAnswer = 'validate' | 'cancel'

function normalizeHeardText(text: string): string {
  return text
    .trim()
    .replace(/\b(?:un|une|en)\s+dante\b/gi, 'indente')
    .replace(/\b(?:un|une|en)\s+dente\b/gi, 'indente')
    .replace(/\bdescendantes?\b/gi, 'désindente')
    .replace(/\b(?:d[éeè]s|des)\s+indentes?\b/gi, 'désindente')
    .replace(/\b(\d+)\s*[x×]\b/gi, '$1 fois')
}

function normalizeLooseText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,!?‘’']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeConfirmationText(text: string): string {
  return normalizeLooseText(text)
}

function parseConfirmationAnswer(text: string): ConfirmationAnswer | null {
  const normalized = normalizeConfirmationText(text)

  if (/^(?:valide|valider|validez|valides|oui|ok|okay|confirme|confirmer)$/.test(normalized)) {
    return 'validate'
  }

  if (/^(?:annule|annuler|annulez|non|stop|cancel)$/.test(normalized)) {
    return 'cancel'
  }

  return null
}

function extractCommandAfterWakeWord(text: string): string | null {
  const normalized = normalizeLooseText(text)
  const match = normalized.match(/(?:^|\s)(?:ecoute|ecoutes|ecoutez|ecouter)(?:\s+(.+))?$/)

  if (!match) {
    return null
  }

  return match[1]?.trim() ?? ''
}

function isStopListeningCommand(text: string): boolean {
  const normalized = normalizeLooseText(text)
  return /^(?:arrete|arreter|stop|pause|coupe|couper)\s+(?:l\s+)?ecoute(?:\s+active)?$/.test(normalized)
}

function CommandPanel({ onRun, className }: CommandPanelProps) {
  const { supported, listening, transcript, start, stop, reset } =
    useSpeechRecognition()
  // Une commande validée est-elle en cours d'exécution ?
  const [busy, setBusy] = useState(false)
  // Commande reconnue, mais pas encore confirmée par "valider" ou le bouton.
  const [pendingCommand, setPendingCommand] = useState<Command | null>(null)
  // Quand l'utilisateur dit seulement "écoute", la prochaine phrase est lue comme commande.
  const [waitingForCommand, setWaitingForCommand] = useState(false)
  // Bouton pause/reprise : l'écoute se relance toute seule tant que c'est activé.
  const [alwaysListening, setAlwaysListening] = useState(true)
  // On n'affiche pas tout ce que le micro capte : seulement la commande après "écoute".
  const [displayedHeardText, setDisplayedHeardText] = useState('')
  // Permet d'annuler une relance automatique du micro devenue obsolète.
  const listenRequestRef = useRef(0)
  // Empêche la relance automatique pendant que la synthèse vocale parle.
  const [pausedForSpeech, setPausedForSpeech] = useState(false)

  const displayedCommand = pendingCommand

  function canStartListening(options?: { ignorePausedForSpeech?: boolean }) {
    return (
      supported &&
      alwaysListening &&
      !busy &&
      !listening &&
      (options?.ignorePausedForSpeech || !pausedForSpeech)
    )
  }

  function startIfAllowed() {
    if (canStartListening()) {
      start()
    }
  }

  async function listenAfterSpeech(text: string) {
    const requestId = listenRequestRef.current + 1
    listenRequestRef.current = requestId

    setPausedForSpeech(true)
    stop()
    await speak(text)

    if (listenRequestRef.current !== requestId) {
      setPausedForSpeech(false)
      return
    }

    setPausedForSpeech(false)
    // Ne pas appeler startIfAllowed() ici : juste après setPausedForSpeech(false),
    // l'ancien state React peut encore valoir true et bloquer la reprise.
    if (canStartListening({ ignorePausedForSpeech: true })) {
      start()
    }
  }

  function askConfirmation(command: Command, heardText: string) {
    setDisplayedHeardText(heardText)
    setWaitingForCommand(false)
    setPendingCommand(command)
    void listenAfterSpeech(`${describeCommand(command)}. Valider ou annuler ?`)
  }

  async function validate(commandToRun = displayedCommand) {
    if (!commandToRun) {
      return
    }

    listenRequestRef.current += 1
    stop()
    reset()
    setPendingCommand(null)
    setWaitingForCommand(false)
    setDisplayedHeardText('')
    setBusy(true)
    const result = await onRun(commandToRun)
    setBusy(false)
    await listenAfterSpeech(result) // l'app annonce ce qui s'est passé puis réécoute
  }

  function cancel() {
    listenRequestRef.current += 1
    stop()
    reset()
    setPendingCommand(null)
    setWaitingForCommand(false)
    setDisplayedHeardText('')
    void listenAfterSpeech('Annulé')
  }

  function stopActiveListening() {
    listenRequestRef.current += 1
    setAlwaysListening(false)
    setPausedForSpeech(false)
    setPendingCommand(null)
    setWaitingForCommand(false)
    setDisplayedHeardText('')
    reset()
    stop()
  }

  function toggleListening() {
    if (alwaysListening) {
      stopActiveListening()
    } else {
      setAlwaysListening(true)
      reset()
      start()
    }
  }

  // Écoute permanente : dès que Chrome arrête une phrase, on relance.
  useEffect(() => {
    startIfAllowed()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported, alwaysListening, busy, pausedForSpeech, listening])

  // À chaque nouvelle phrase entendue :
  // - si une confirmation est attendue, "valider" / "annuler" suffit ;
  // - si on a déjà dit "écoute", la phrase suivante est la commande ;
  // - sinon on ignore silencieusement tout ce qui ne contient pas "écoute".
  useEffect(() => {
    if (!transcript || busy) {
      return
    }

    const normalizedText = normalizeHeardText(transcript)

    if (isStopListeningCommand(normalizedText)) {
      stopActiveListening()
      return
    }

    if (pendingCommand) {
      const answer = parseConfirmationAnswer(normalizedText)
      reset()

      if (answer === 'validate') {
        void validate(pendingCommand)
        return
      }

      if (answer === 'cancel') {
        cancel()
        return
      }

      void listenAfterSpeech('Je n’ai pas compris. Dis valider ou annuler.')
      return
    }

    if (waitingForCommand) {
      reset()
      const commandText = extractCommandAfterWakeWord(normalizedText) ?? normalizedText
      const nextCommand = parseCommand(commandText)
      if (nextCommand) {
        askConfirmation(nextCommand, commandText)
      } else {
        setWaitingForCommand(false)
        setDisplayedHeardText(commandText)
        void listenAfterSpeech('Commande non comprise')
      }
      return
    }

    const commandText = extractCommandAfterWakeWord(normalizedText)
    reset()

    if (commandText === null) {
      return
    }

    if (!commandText) {
      setDisplayedHeardText('')
      setWaitingForCommand(true)
      return
    }

    const nextCommand = parseCommand(commandText)
    if (nextCommand) {
      askConfirmation(nextCommand, commandText)
    } else {
      setDisplayedHeardText(commandText)
      void listenAfterSpeech('Commande non comprise')
    }
    // On ne réagit qu'à un nouveau texte entendu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript])

  return (
    <Panel title="Commande" className={className}>
      <div className={styles.body}>
        <Waveform />

        {!supported && (
          <p className={styles.warning}>
            Reconnaissance vocale non supportée ici (utilise Chrome ou Edge).
          </p>
        )}

        {supported && (
          <button
            type="button"
            className={listening ? `${styles.mic} ${styles.micOn}` : styles.mic}
            aria-label={alwaysListening ? "Arrêter l'écoute active" : "Activer l'écoute"}
            onClick={toggleListening}
            disabled={busy}
          >
            <span aria-hidden="true">🎤</span>{' '}
            {alwaysListening
              ? listening
                ? 'Arrêter l’écoute'
                : 'Activation…'
              : "Activer l'écoute"}
          </button>
        )}

        {busy ? (
          <p className={styles.understood} aria-busy="true">
            Traitement…
          </p>
        ) : pendingCommand ? (
          <>
            {displayedHeardText && <p className={styles.heard}>« {displayedHeardText} »</p>}
            <p className={styles.understood}>→ {describeCommand(pendingCommand)}</p>
            <p className={styles.heard}>Dis « valider » ou « annuler ».</p>
          </>
        ) : waitingForCommand ? (
          <>
            <p className={styles.understood}>Je t’écoute.</p>
            <p className={styles.heard}>Dis ta commande.</p>
          </>
        ) : displayedHeardText ? (
          <>
            <p className={styles.heard}>« {displayedHeardText} »</p>
            <p className={styles.warning}>Commande non comprise</p>
          </>
        ) : (
          <p className={styles.heard}>Dis « écoute » puis ta commande. Dis « arrête écoute » pour couper.</p>
        )}
      </div>

      <div className={styles.actions}>
        <Button onClick={() => void validate()} disabled={!displayedCommand || busy}>
          Valider
        </Button>
        <Button
          onClick={cancel}
          disabled={(!displayedCommand && !waitingForCommand && !displayedHeardText) || busy}
        >
          Annuler
        </Button>
      </div>
    </Panel>
  )
}

export default CommandPanel
