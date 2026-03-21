import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const tipos = [
  { value: 'sugestao', label: '💡 Sugestão', color: 'bg-blue-500/10 border-blue-500/30 text-blue-600' },
  { value: 'bug',      label: '🐛 Bug',      color: 'bg-red-500/10 border-red-500/30 text-red-600' },
  { value: 'outro',    label: '💬 Outro',    color: 'bg-muted border-border text-muted-foreground' },
];

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState('sugestao');
  const [mensagem, setMensagem] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, mensagem, email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro ao enviar');

      setSuccess(true);
      setMensagem('');
      setEmail('');
      setTimeout(() => {
        setSuccess(false);
        setOpen(false);
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Bolinha flutuante */}
      <button
        onClick={() => setOpen(!open)}
        title="Enviar feedback"
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:scale-110 transition-all duration-200 flex items-center justify-center"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {/* Formulário */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-80 rounded-xl bg-card border border-border shadow-2xl animate-fade-in">
          <div className="p-4 border-b border-border">
            <h3 className="font-bold text-muted-87">Enviar feedback</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Sugestões, bugs ou qualquer coisa!</p>
          </div>

          {success ? (
            <div className="p-6 text-center">
              <p className="text-3xl mb-2">🎉</p>
              <p className="font-medium text-muted-87">Obrigado pelo feedback!</p>
              <p className="text-sm text-muted-foreground mt-1">Sua mensagem foi enviada.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              {/* Tipo */}
              <div className="flex gap-2">
                {tipos.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTipo(t.value)}
                    className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-all ${
                      tipo === t.value ? t.color : 'bg-muted border-border text-muted-foreground opacity-50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Email (opcional) */}
              <div>
                <Input
                  type="email"
                  placeholder="Seu email (opcional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-sm"
                />
              </div>

              {/* Mensagem */}
              <div>
                <textarea
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  placeholder="Descreva sua sugestão ou bug..."
                  required
                  rows={4}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-87 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" size="sm" disabled={loading}>
                {loading ? 'Enviando...' : (
                  <span className="flex items-center gap-2">
                    <Send size={14} /> Enviar
                  </span>
                )}
              </Button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
