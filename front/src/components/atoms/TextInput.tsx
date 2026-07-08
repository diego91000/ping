// Atome : champ de saisie texte.
import type { InputHTMLAttributes } from 'react'
import styles from './TextInput.module.css'

function TextInput({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input className={[styles.input, className].filter(Boolean).join(' ')} {...rest} />
  )
}

export default TextInput
