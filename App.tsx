import { useState, useEffect } from 'react'
import { supabase } from './services/supabaseClient'
import { Session } from '@supabase/supabase-js'

import Auth from './components/Auth'
import ToastContainer from './components/ToastContainer'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import PatientList from './components/PatientList'
import WhatsAppMonitor from './components/WhatsAppMonitor'
import MedicationManager from './components/MedicationManager'
import FullHistory from './components/FullHistory'
import AlertsHistory from './components/AlertsHistory'

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null)
  const [currentTab, setCurrentTab] = useState('dashboard')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [historyFilter, setHistoryFilter] = useState<{ patientId?: string }>({})

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleViewHistory = (patientId: string) => {
    setHistoryFilter({ patientId })
    setCurrentTab('history')
  }

  const handleViewAllAlerts = () => {
    setCurrentTab('alerts')
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard onViewAllAlerts={handleViewAllAlerts} />
      case 'patients':
        return <PatientList onViewHistory={handleViewHistory} />
      case 'whatsapp':
        return <WhatsAppMonitor />
      case 'medications':
        return <MedicationManager />
      case 'history':
        return <FullHistory initialPatientId={historyFilter.patientId} />
      case 'alerts':
        return <AlertsHistory />
      default:
        return <Dashboard onViewAllAlerts={handleViewAllAlerts} />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <ToastContainer />

      {/* Sidebar */}
      <Sidebar 
        currentTab={currentTab} 
        setTab={setCurrentTab} 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              C
            </div>
            <h1 className="font-bold text-slate-800">CuidaMed</h1>
          </div>
          <button 
            className="text-slate-500"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            ☰
          </button>
        </div>

        {/* Dynamic content */}
        <div className="max-w-6xl mx-auto h-full">
          {renderContent()}
        </div>

        {/* Mobile Tab Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`p-2 flex flex-col items-center ${
              currentTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <span className="text-xl">📊</span>
            <span className="text-[10px] font-bold">Painel</span>
          </button>

          <button
            onClick={() => setCurrentTab('patients')}
            className={`p-2 flex flex-col items-center ${
              currentTab === 'patients' ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <span className="text-xl">👥</span>
            <span className="text-[10px] font-bold">Pacientes</span>
          </button>

          <button
            onClick={() => setCurrentTab('medications')}
            className={`p-2 flex flex-col items-center ${
              currentTab === 'medications' ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <span className="text-xl">💊</span>
            <span className="text-[10px] font-bold">Remédios</span>
          </button>

          <button
            onClick={() => setCurrentTab('whatsapp')}
            className={`p-2 flex flex-col items-center ${
              currentTab === 'whatsapp' ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <span className="text-xl">💬</span>
            <span className="text-[10px] font-bold">Monitor</span>
          </button>
        </div>
      </main>
    </div>
  )
}

export default App
