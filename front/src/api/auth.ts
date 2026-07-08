// Authentification : connexion au backend.
import { apiFetch } from './client'

// Se connecte au backend et renvoie le token JWT.
export async function login(
  loginName: string,
  password: string,
): Promise<string> {
  const response = await apiFetch('/api/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: loginName, password }),
  })

  if (!response.ok) {
    throw new Error('Échec de la connexion')
  }

  const data = await response.json()
  return data.token
}
