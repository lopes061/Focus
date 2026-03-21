import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/Useauth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [focusTime, setFocusTime] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [autoStart, setAutoStart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Iniciais do avatar (ex: "teste" → "TE", "joão silva" → "JO")
  const initials = name ? name.slice(0, 2).toUpperCase() : '?';

  // Carrega dados do usuário ao abrir a página
  useEffect(() => {
    if (!user) return;

    const accessToken = localStorage.getItem('access_token');
    fetch(`${API_URL}/config/${user.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setName(data.username ?? user.username ?? '');
        setEmail(user.email ?? '');
        setFocusTime(data.tempo_foco ?? 25);
        setShortBreak(data.tempo_pausa_curta ?? 5);
        setLongBreak(data.tempo_pausa_longa ?? 15);
        setAutoStart(!!data.auto_iniciar);
      })
      .catch(() => {
        // fallback para dados do AuthContext
        setName(user.username ?? '');
        setEmail(user.email ?? '');
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async () => {
    setError('');
    setSuccess(false);
    setSaving(true);

    const accessToken = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/config/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          nome: name,
          tempo_foco: focusTime,
          tempo_pausa_curta: shortBreak,
          tempo_pausa_longa: longBreak,
          auto_iniciar: autoStart,
        }),
      });

      if (!res.ok) throw new Error('Erro ao salvar');
      // Atualiza o nome no AuthContext para refletir no Header imediatamente
      updateUser({ username: name });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        Carregando perfil...
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-lg animate-fade-in">
      <h1 className="text-2xl font-bold text-muted-87 mb-8">Perfil</h1>

      {/* Avatar com iniciais */}
      <div className="flex flex-col items-center mb-8">
        <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center text-3xl font-bold text-primary-foreground select-none">
          {initials}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{email}</p>
      </div>

      <div className="space-y-6">

        {success && (
          <div className="rounded-lg bg-green-500/10 border border-green-500/30 px-4 py-3 text-sm text-green-600">
            Alterações salvas com sucesso!
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Nome */}
        <div>
          <label className="text-sm text-muted-foreground mb-1.5 block">Nome</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        {/* Email (somente leitura) */}
        <div>
          <label className="text-sm text-muted-foreground mb-1.5 block">Email</label>
          <Input value={email} disabled className="opacity-60 cursor-not-allowed" />
        </div>

        {/* Configurações do Timer */}
        <div className="rounded-xl bg-card border border-border p-6 space-y-6">
          <h2 className="font-bold text-muted-87">Configurações do Timer</h2>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Tempo de foco</span>
              <span className="font-timer text-muted-87">{focusTime} min</span>
            </div>
            <Slider value={[focusTime]} onValueChange={([v]) => setFocusTime(v)} min={15} max={120} step={5} />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Pausa curta</span>
              <span className="font-timer text-muted-87">{shortBreak} min</span>
            </div>
            <Slider value={[shortBreak]} onValueChange={([v]) => setShortBreak(v)} min={3} max={10} step={1} />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Pausa longa</span>
              <span className="font-timer text-muted-87">{longBreak} min</span>
            </div>
            <Slider value={[longBreak]} onValueChange={([v]) => setLongBreak(v)} min={10} max={30} step={5} />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Auto-iniciar próximo</span>
            <Switch checked={autoStart} onCheckedChange={setAutoStart} />
          </div>
        </div>

        <Button className="w-full" size="lg" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </div>
    </div>
  );
}