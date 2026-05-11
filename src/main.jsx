import './styles/global.css'
import './styles/print.css'
import './styles/document.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

const saved = localStorage.getItem('markeon-theme')
let mode = 'dark'
try { mode = JSON.parse(saved)?.state?.mode || 'dark' } catch {}
document.documentElement.setAttribute('data-theme', mode)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
