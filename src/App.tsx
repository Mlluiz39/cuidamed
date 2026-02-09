import PatientApproval from './components/PatientApproval';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">
            CuidaMed - Painel Administrativo
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Sistema de Gerenciamento de Medicações
          </p>
        </div>
      </header>
      
      <main className="py-8">
        <PatientApproval />
      </main>
    </div>
  );
}

export default App;
