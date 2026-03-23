import { useState, useEffect, useCallback, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const DEFAULT_CONFIG = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
  autoStart: false,
};

export function useTimer() {
  const [mode, setMode] = useState('focus');
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_CONFIG.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0);
  const [configLoaded, setConfigLoaded] = useState(false);
  const intervalRef = useRef(null);
  const originalTitle = useRef(document.title);
  const autoStartRef = useRef(false);

  // Carrega a config do banco
  const loadConfig = useCallback(() => {
    const user = localStorage.getItem('user');
    const accessToken = localStorage.getItem('access_token');
    if (!user || !accessToken) return;

    const { id } = JSON.parse(user);

    fetch(`${API_URL}/config/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        const newConfig = {
          focus: (data.tempo_foco ?? 25) * 60,
          shortBreak: (data.tempo_pausa_curta ?? 5) * 60,
          longBreak: (data.tempo_pausa_longa ?? 15) * 60,
          autoStart: !!data.auto_iniciar,
        };
        autoStartRef.current = newConfig.autoStart;
        setConfig(newConfig);
        if (!isRunning) setTimeLeft(newConfig.focus); // só atualiza se não estiver rodando
      })
      .catch(() => {})
      .finally(() => setConfigLoaded(true));
  }, [isRunning]);

  useEffect(() => {
    loadConfig();
  }, []);

  const totalTime = config[mode];
  const progress = 1 - timeLeft / totalTime;

  const formatTime = useCallback((seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }, []);

  const playSound = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 1000;
        gain2.gain.value = 0.3;
        osc2.start();
        osc2.stop(ctx.currentTime + 0.5);
      }, 600);
    } catch {}
  }, []);

  const switchMode = useCallback((newMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(config[newMode]);
  }, [config]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(config[mode]);
  }, [mode, config]);

  const setFocusMinutes = useCallback((minutes) => {
    const seconds = minutes * 60;
    setConfig((prev) => ({ ...prev, focus: seconds }));
    if (mode === 'focus') setTimeLeft(seconds);
  }, [mode]);

  const setShortBreakMinutes = useCallback((minutes) => {
    const seconds = minutes * 60;
    setConfig((prev) => ({ ...prev, shortBreak: seconds }));
    if (mode === 'shortBreak') setTimeLeft(seconds);
  }, [mode]);

  const setLongBreakMinutes = useCallback((minutes) => {
    const seconds = minutes * 60;
    setConfig((prev) => ({ ...prev, longBreak: seconds }));
    if (mode === 'longBreak') setTimeLeft(seconds);
  }, [mode]);

  // Salva config no banco (chamado ao soltar o slider no Index) 
  const saveConfig = useCallback((updates = {}) => {
    const userStr = localStorage.getItem('user');
    const accessToken = localStorage.getItem('access_token');
    if (!userStr || !accessToken) return;

    const { id } = JSON.parse(userStr);
    const merged = { ...config, ...updates };

    fetch(`${API_URL}/config/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        tempo_foco: Math.round(merged.focus / 60),
        tempo_pausa_curta: Math.round(merged.shortBreak / 60),
        tempo_pausa_longa: Math.round(merged.longBreak / 60),
        auto_iniciar: merged.autoStart,
      }),
    }).catch(() => {});
  }, [config]);

  // Tick do timer 
    useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            playSound();

            if (mode === 'focus') {
              setPomodorosCompleted((p) => p + 1);

              const userStr = localStorage.getItem('user');
              const accessToken = localStorage.getItem('access_token');
              if (userStr && accessToken) {
                const { id } = JSON.parse(userStr);
                fetch(`${API_URL}/sessions`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                  },
                  body: JSON.stringify({
                    user_id: id,
                    minutos_foco: config.focus / 60,
                    minutos_pausa_curta: 0,
                    minutos_pausa_longa: 0,
                    pomodoros_completos: 1,
                  }),
                });
              }

              if (autoStartRef.current) {
                setTimeout(() => setIsRunning(true), 1000);
              }
            }

            return config[mode];
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode, playSound, config]);

  useEffect(() => {
    if (isRunning) {
      document.title = `${formatTime(timeLeft)} - Focus`;
    } else {
      document.title = originalTitle.current;
    }
    return () => { document.title = originalTitle.current; };
  }, [timeLeft, isRunning, formatTime]);

  return {
    mode,
    timeLeft,
    isRunning,
    pomodorosCompleted,
    progress,
    totalTime,
    formatTime,
    switchMode,
    start,
    pause,
    reset,
    configLoaded,
    loadConfig,
    saveConfig,
    focusMinutes: config.focus / 60,
    shortBreakMinutes: config.shortBreak / 60,
    longBreakMinutes: config.longBreak / 60,
    setFocusMinutes,
    setShortBreakMinutes,
    setLongBreakMinutes,
  };
}