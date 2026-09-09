import { useState } from 'react'
import Landing from './components/Landing.jsx'
import Dashboard from './components/Dashboard.jsx'

export default function App() {
  const [view, setView] = useState('landing')
  const [seedQuestion, setSeedQuestion] = useState('')

  const start = (question) => {
    setSeedQuestion(typeof question === 'string' ? question : '')
    setView('dashboard')
  }

  if (view === 'dashboard') {
    return <Dashboard initialQuestion={seedQuestion} onExit={() => setView('landing')} />
  }
  return <Landing onStart={start} />
}
