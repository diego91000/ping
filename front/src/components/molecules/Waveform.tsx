// Molécule : onde sonore, retour visuel à chaque action.
// Verte quand la dernière commande a réussi, rouge quand elle a échoué,
// puis elle retombe au repos après un court instant.
import { useEffect, useState } from 'react'
import { useActivities } from '@/hooks/useActivities'
import styles from './Waveform.module.css'

type Mood = 'idle' | 'ok' | 'ko'

// Une barre par élément (juste pour dessiner l'onde).
const BARS = [0, 1, 2, 3, 4, 5, 6, 7, 8]

function Waveform() {
  const commands = useActivities('command')
  const [mood, setMood] = useState<Mood>('idle')
  const lastId = commands.length > 0 ? commands[commands.length - 1].id : 0

  // À chaque nouvelle commande, on joue l'onde (verte/rouge) ~1,2 s.
  useEffect(() => {
    if (commands.length === 0) {
      return
    }
    const last = commands[commands.length - 1]
    setMood(last.ok ? 'ok' : 'ko')
    const timer = setTimeout(() => setMood('idle'), 1200)
    return () => clearTimeout(timer)
    // On ne réagit qu'à l'arrivée d'une nouvelle commande.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastId])

  const moodClass = mood === 'ok' ? styles.ok : mood === 'ko' ? styles.ko : ''

  return (
    <div className={[styles.waveform, moodClass].filter(Boolean).join(' ')} aria-hidden="true">
      {BARS.map((index) => (
        <span
          key={index}
          className={styles.bar}
          style={{ animationDelay: `${index * 0.07}s` }}
        />
      ))}
    </div>
  )
}

export default Waveform
