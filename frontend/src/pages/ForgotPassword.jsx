import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || 'Erro ao processar solicitação');
        return;
      }

      setSent(true); // mostra tela de sucesso
    } catch (err) {
      setError('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="rounded-xl bg-card p-8 shadow-xl border border-border text-center">
            <span className="text-5xl">📬</span>
            <h1 className="mt-4 text-xl font-bold text-muted-87">Email enviado!</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Se o email <strong>{email}</strong> estiver cadastrado, você receberá
              uma senha temporária em instantes.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Verifique sua caixa de entrada e também a pasta de spam.
            </p>
            <Link to="/login">
              <Button className="mt-6 w-full" size="lg">Voltar para o login</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="rounded-xl bg-card p-8 shadow-xl border border-border">
          <div className="mb-6 text-center">
            <span className="text-4xl">🍅</span>
            <h1 className="mt-2 text-2xl font-bold text-muted-87">Recuperar senha</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Digite seu email e enviaremos uma senha temporária.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                type="email"
                placeholder="seu@email.com"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar senha temporária'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Lembrou a senha?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Voltar ao login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}