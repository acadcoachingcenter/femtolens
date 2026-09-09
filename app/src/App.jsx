import { useState } from 'react'
import Landing from './components/Landing.jsx'
import Dashboard from './components/Dashboard.jsx'
import { AuthProvider } from './lib/auth.jsx'

export default function App() {
  const [view, setView] = useState('landing')
  const [seedQuestion, setSeedQuestion] = useState('')

  const start = (question) => {
    setSeedQuestion(typeof question === 'string' ? question : '')
    setView('dashboard')
  }

  return (
    <AuthProvider>
      {view === 'dashboard' ? (
        <Dashboard initialQuestion={seedQuestion} onExit={() => setView('landing')} />
      ) : (
        <Landing onStart={start} />
      )}
    </AuthProvider>
  )
}
