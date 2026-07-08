// Atome : bouton icône seul. Le libellé (aria-label) est obligatoire pour
// l'accessibilité (utilisateur malvoyant / lecteur d'écran).
import type { ButtonHTMLAttributes } from 'react'
import styles from './IconButton.module.css'

type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-label'
> & {
  label: string // libellé accessible, obligatoire
  size?: 'sm' | 'md' | 'lg'
  variant?: 'ghost' | 'boxed'
}

function IconButton({
  label,
  size = 'sm',
  variant = 'ghost',
  className,
  type = 'button',
  children,
  ...rest
}: IconButtonProps) {
  const classes = [
    styles.iconButton,
    size !== 'sm' && styles[size],
    variant === 'boxed' && styles.boxed,
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <button type={type} className={classes} aria-label={label} {...rest}>
      {children}
    </button>
  )
}

export default IconButton
