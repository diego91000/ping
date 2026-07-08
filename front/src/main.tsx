import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import EditorPage from '@/pages/EditorPage'
import LoginPage from '@/pages/LoginPage'

const TOKEN_STORAGE_KEY = 'ping-token'

function App() {
  const [token, setToken] = useState(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY) ?? '',
  )

  function handleLogin(newToken: string) {
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken)
    setToken(newToken)
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken('')
  }

  return token ? (
    <EditorPage token={token} onLogout={handleLogout} />
  ) : (
    <LoginPage onLogin={handleLogin} />
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
