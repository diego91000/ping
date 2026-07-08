// Molécule : petit champ de saisie inline dans l'arbre (création / renommage),
// façon VSCode. Entrée = valider, Échap = annuler, perte de focus = annuler.
import { useState } from 'react'
import { TextInput } from '@/components/atoms'
import styles from './NameInput.module.css'

type NameInputProps = {
  icon: string // 📄 ou 📁, pour rester cohérent avec les lignes de l'arbre
  label: string // libellé lu par les lecteurs d'écran (aria-label)
  initialValue?: string
  onSubmit: (name: string) => void
  onCancel: () => void
}

function NameInput({
  icon,
  label,
  initialValue = '',
  onSubmit,
  onCancel,
}: NameInputProps) {
  const [value, setValue] = useState(initialValue)

  return (
    <span className={styles.nameInput}>
      <span aria-hidden="true">{icon}</span>
      <TextInput
        aria-label={label}
        autoFocus
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onFocus={(event) => event.target.select()}
        onBlur={onCancel}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            onSubmit(value)
          } else if (event.key === 'Escape') {
            onCancel()
          }
        }}
      />
    </span>
  )
}

export default NameInput
