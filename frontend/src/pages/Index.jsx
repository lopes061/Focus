import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import CircularTimer from '@/components/CircularTimer';
import RankingList from '@/components/RankingList';
import { RotateCcw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const modeLabels = {
  focus: 'Foco',
  shortBreak: 'Pausa Curta',
  longBreak: 'Pausa Longa',
};

const modeTabColors = {
  focus: 'bg-timer-focus text-primary-foreground',
  shortBreak: 'bg-timer-short text-primary-foreground',
  longBreak: 'bg-timer-long text-primary-foreground',
};

export default function Index({
  mode, timeFormatted, progress, isRunning, pomodorosCompleted,
  onSwitchMode, onStart, onPause, onReset,
  focusMinutes, shortBreakMinutes, longBreakMinutes,
  onChangeFocusMinutes, onChangeShortBreakMinutes, onChangeLongBreakMinutes,
  onLoadConfig, // função para recarregar configs do banco
}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Recarrega configs do banco toda vez que o usuário volta para esta página
  useEffect(() => {
    onLoadConfig?.();
  }, [location.pathname]);

  // Carrega ranking
  useEffect(() => {
    fetch(`${API_URL}/ranking?limit=5`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      <section className="container py-10 md:py-16">
        <div className="mx-auto max-w-lg">
          <div className="mb-8 flex justify-center gap-2">
            {Object.keys(modeLabels).map((m) => (
              <button
                key={m}
                onClick={() => onSwitchMode(m)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-300 ${
                  mode === m ? modeTabColors[m] : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {modeLabels[m]}
              </button>
            ))}
          </div>

          <div className="flex justify-center mb-8">
            <CircularTimer timeFormatted={timeFormatted} progress={progress} mode={mode} isRunning={isRunning} />
          </div>

          <div className="flex justify-center gap-2 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-3 w-3 rounded-full transition-colors ${
                  i < pomodorosCompleted % 4 ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          <div className="flex justify-center gap-4">
            {isRunning ? (
              <Button onClick={onPause} size="lg" variant="outline" className="px-10 text-base">Pausar</Button>
            ) : (
              <Button onClick={onStart} size="lg" className="px-10 text-base bg-secondary hover:bg-secondary/90 text-secondary-foreground pulse-soft">Iniciar</Button>
            )}
            <Button onClick={onReset} size="lg" variant="outline" className="px-6">
              <RotateCcw size={18} />
            </Button>
          </div>

          <div className="mt-10 rounded-xl bg-card border border-border p-6 space-y-6 text-sm text-muted-87">
            <p className="font-semibold text-center">Ajustar tempos do Pomodoro</p>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Tempo de foco</span>
                <span className="font-timer text-muted-87">{focusMinutes} min</span>
              </div>
              <Slider
                value={[focusMinutes]}
                onValueChange={([v]) => onChangeFocusMinutes?.(v)}
                min={15}
                max={120}
                step={5}
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Pausa curta</span>
                <span className="font-timer text-muted-87">{shortBreakMinutes} min</span>
              </div>
              <Slider
                value={[shortBreakMinutes]}
                onValueChange={([v]) => onChangeShortBreakMinutes?.(v)}
                min={3}
                max={10}
                step={1}
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Pausa longa</span>
                <span className="font-timer text-muted-87">{longBreakMinutes} min</span>
              </div>
              <Slider
                value={[longBreakMinutes]}
                onValueChange={([v]) => onChangeLongBreakMinutes?.(v)}
                min={10}
                max={60}
                step={5}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container pb-16">
        <div className="mx-auto max-w-lg">
          <h2 className="mb-6 text-center text-2xl font-bold text-muted-87">🏆 Ranking Global</h2>
          {loading ? (
            <p>Carregando ranking...</p>
          ) : (
            <RankingList users={users} limit={5} />
          )}
          <div className="mt-6 text-center">
            <Link to="/ranking">
              <Button variant="outline" size="sm">Ver ranking completo</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}