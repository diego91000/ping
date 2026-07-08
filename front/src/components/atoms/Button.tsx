// Atome : bouton texte. Trois variantes de couleur (default / primary / subtle).
import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.css'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'primary' | 'subtle'
}

function Button({
  variant = 'default',
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = [styles.button, styles[variant], className]
    .filter(Boolean)
    .join(' ')
  return <button type={type} className={classes} {...rest} />
}

export default Button
