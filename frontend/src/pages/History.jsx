import { useState, useEffect } from 'react';
import { Clock, Trophy, Target, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/Useauth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const statCards = [
  { icon: Clock,       label: 'Total focado',  key: 'totalFocused' },
  { icon: Trophy,      label: 'Posição',        key: 'position' },
  { icon: Target,      label: 'Pomodoros',      key: 'totalPomodoros' },
  { icon: TrendingUp,  label: 'Média diária',   key: 'dailyAverage' },
];

// ─── Helpers de data ──────────────────────────────────────────────────────────

function startOf(period) {
  const now = new Date();
  if (period === 'week') {
    const d = new Date(now);
    d.setDate(now.getDate() - now.getDay()); // domingo da semana atual
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return new Date(now.getFullYear(), 0, 1); // ano
}

function formatMinutes(totalMinutes) {
  if (!totalMinutes) return '0min';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function History() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');

  // Busca sessões do backend
  useEffect(() => {
    if (!user) return;
    const accessToken = localStorage.getItem('access_token');

    fetch(`${API_URL}/sessions/${user.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSessions(data))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [user]);

  // Filtra sessões pelo período selecionado
  const filtered = sessions.filter((s) => {
    const sessionDate = new Date(s.criado_em);
    return sessionDate >= startOf(period);
  });

  // Calcula stats do período filtrado
  const totalMinutosFoco = filtered.reduce((acc, s) => acc + (s.minutos_foco || 0), 0);
  const totalPomodoros   = filtered.reduce((acc, s) => acc + (s.pomodoros_completos || 0), 0);

  // Dias únicos com sessão no período
  const diasUnicos = new Set(
    filtered.map((s) => new Date(s.criado_em).toDateString())
  ).size;

  const mediaMinutosDiarios = diasUnicos > 0 ? Math.round(totalMinutosFoco / diasUnicos) : 0;

  const stats = {
    totalFocused:  formatMinutes(totalMinutosFoco),
    position:      user?.total_minutos ? `#?` : '—',
    totalPomodoros: String(totalPomodoros),
    dailyAverage:  formatMinutes(mediaMinutosDiarios),
  };

  // Agrupa sessões por dia para exibição
  const porDia = filtered.reduce((acc, s) => {
    const dia = new Date(s.criado_em).toDateString();
    if (!acc[dia]) acc[dia] = { date: s.criado_em, minutosFoco: 0, pausas: 0, pomodoros: 0 };
    acc[dia].minutosFoco      += s.minutos_foco || 0;
    acc[dia].pausas           += (s.minutos_pausa_curta > 0 || s.minutos_pausa_longa > 0) ? 1 : 0;
    acc[dia].pomodoros        += s.pomodoros_completos || 0;
    return acc;
  }, {});

  const sessoesPorDia = Object.values(porDia).sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  return (
    <div className="container py-8 max-w-2xl animate-fade-in">
      <h1 className="text-2xl font-bold text-muted-87 mb-6">Histórico</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl bg-card border border-border p-4 text-center card-hover">
            <s.icon size={20} className="mx-auto mb-2 text-accent" />
            <p className="text-lg font-bold font-timer text-muted-87">{stats[s.key]}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtro de período */}
      <div className="flex gap-2 mb-6">
        {[['week', 'Semana'], ['month', 'Mês'], ['year', 'Ano']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              period === key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista de sessões */}
      {loading ? (
        <p className="text-center text-muted-foreground py-12">Carregando histórico...</p>
      ) : sessoesPorDia.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-3">🍅</p>
          <p className="font-medium">Nenhuma sessão neste período</p>
          <p className="text-sm mt-1">Complete um pomodoro para ver seu histórico aqui!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessoesPorDia.map((s) => (
            <div key={s.date} className="rounded-xl bg-card border border-border p-5 card-hover">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-muted-87">{formatDate(s.date)}</h3>
                <span className="text-sm font-timer text-accent">🍅 x{s.pomodoros}</span>
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>⏱ {formatMinutes(s.minutosFoco)}</span>
                <span>☕ {s.pausas} pausas</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}