import { useState, type FormEvent } from 'react'
import { login } from '@/api/auth'
import { Button, Spinner, TextInput } from '@/components/atoms'
import styles from './LoginPage.module.css'

type LoginPageProps = {
  onLogin: (token: string) => void
}

function LoginPage({ onLogin }: LoginPageProps) {
  const [loginName, setLoginName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!loginName.trim() || !password) {
      setError('Entre ton login et ton mot de passe.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const token = await login(loginName.trim(), password)
      onLogin(token)
    } catch {
      setError(
        'Connexion impossible. Vérifie les identifiants et que le backend tourne.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="login-title">
        <div className={styles.brand}>PING</div>
        <h1 id="login-title" className={styles.title}>
          Connexion
        </h1>
        <p className={styles.subtitle}>
          Connecte-toi pour ouvrir l’éditeur vocal.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Login</span>
            <TextInput
              autoFocus
              autoComplete="username"
              value={loginName}
              onChange={(event) => setLoginName(event.target.value)}
              placeholder="admin.root"
              disabled={loading}
            />
          </label>

          <label className={styles.field}>
            <span>Mot de passe</span>
            <TextInput
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />
          </label>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            className={styles.submit}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner /> Connexion…
              </>
            ) : (
              'Se connecter'
            )}
          </Button>
        </form>
      </section>
    </main>
  )
}

export default LoginPage
