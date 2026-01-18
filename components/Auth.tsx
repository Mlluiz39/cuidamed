import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useToast } from '../contexts/ToastContext';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);

  const { addToast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'register') {
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;

        if (user) {
          const { error: insertError } = await supabase.from('users').insert({
            id: user.id,
            email: email,
            name: email.split('@')[0],
            created_at: new Date().toISOString(),
          });
          
          // Se erro for de duplicidade, ignorar
          if (insertError && insertError.code !== '23505') {
            console.error('Erro ao criar usuário público:', insertError);
          }
        }

        addToast('Cadastro realizado com sucesso! Faça login para continuar.', 'success');
        setMode('login');
      } else {
        const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;

        // Garantir que usuário existe na tabela pública também no login (para usuários antigos/criados manualmente)
        if (user) {
           const { data: existingUser } = await supabase.from('users').select('id').eq('id', user.id).single();
           if (!existingUser) {
              await supabase.from('users').insert({
                id: user.id,
                email: email,
                name: email.split('@')[0],
                created_at: new Date().toISOString(),
              });
           }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 animate-fadeIn">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4 shadow-lg shadow-blue-200">
            C
          </div>
          <h1 className="text-2xl font-bold text-slate-800">bem-vindo ao CuidaMed</h1>
          <p className="text-slate-500 mt-2">
            {mode === 'login' ? 'Faça login para acessar sua conta' : 'Crie sua conta para começar'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100 flex items-center gap-2">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="Sua senha segura"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-200 disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? 'Processando...' : mode === 'login' ? 'Entrar' : 'Criar Conta'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError(null);
              setEmail('');
              setPassword('');
            }}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            {mode === 'login' 
              ? 'Não tem uma conta? Crie agora' 
              : 'Já tem uma conta? Faça login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
