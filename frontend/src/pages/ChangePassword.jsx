import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/Useauth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ChangePassword() {
  const { user, passwordChanged } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ nova_senha: '', confirmar_senha: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.nova_senha !== form.confirmar_senha) {
      setError('As senhas não coincidem');
      return;
    }
    if (form.nova_senha.length < 8) {
      setError('Senha deve ter pelo menos 8 caracteres');
      return;
    }
    if (!/[A-Z]/.test(form.nova_senha)) {
      setError('Senha deve ter pelo menos uma letra maiúscula');
      return;
    }
    if (!/[0-9]/.test(form.nova_senha)) {
      setError('Senha deve ter pelo menos um número');
      return;
    }

    setLoading(true);
    try {
      const accessToken = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ nova_senha: form.nova_senha }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro ao trocar senha');

      // Atualiza tokens novos retornados pelo backend
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);

      passwordChanged(); // limpa o flag de senha temporária
      navigate('/'); // entra no app normalmente
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="rounded-xl bg-card p-8 shadow-xl border border-border">
          <div className="mb-6 text-center">
            <span className="text-4xl">🔐</span>
            <h1 className="mt-2 text-2xl font-bold text-muted-87">Criar nova senha</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Você entrou com uma senha temporária. Crie uma senha definitiva para continuar.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Nova senha"
                className="pl-10 pr-10"
                value={form.nova_senha}
                onChange={(e) => setForm(p => ({ ...p, nova_senha: e.target.value }))}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirmar nova senha"
                className="pl-10"
                value={form.confirmar_senha}
                onChange={(e) => setForm(p => ({ ...p, confirmar_senha: e.target.value }))}
                required
              />
            </div>

            <ul className="text-xs text-muted-foreground space-y-1 pl-1">
              <li className={form.nova_senha.length >= 8 ? 'text-green-600' : ''}>• Mínimo 8 caracteres</li>
              <li className={/[A-Z]/.test(form.nova_senha) ? 'text-green-600' : ''}>• Uma letra maiúscula</li>
              <li className={/[0-9]/.test(form.nova_senha) ? 'text-green-600' : ''}>• Um número</li>
            </ul>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar nova senha'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
