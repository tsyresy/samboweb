import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import './index.css'

// Après un déploiement, un onglet resté ouvert peut réclamer un morceau de code
// (page chargée à la demande) qui n'existe plus : on recharge une fois pour
// récupérer la nouvelle version plutôt que d'afficher une page blanche.
window.addEventListener('vite:preloadError', (event) => {
  const key = 'e-sambo:reloaded-after-deploy'
  try {
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
  } catch {
    return
  }
  event.preventDefault()
  window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
