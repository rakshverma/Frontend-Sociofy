import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    if (import.meta.env.MODE === 'production') {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
}

    <App />
  </StrictMode>,
)
