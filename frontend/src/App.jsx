import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/Header";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Ranking from "./pages/Ranking";
import NotFound from "./pages/NotFound";
import ChangePassword from './pages/ChangePassword';
import { useTimer } from "./hooks/useTimer";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/Useauth";
import FeedbackButton from '@/components/FeedbackButton';

const queryClient = new QueryClient();

function AppContent() {
  const timer = useTimer();
  const{ mustChangePassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // use Effect para o cara n conseguir fugir de ir para o change-password
  useEffect(() => {
    if (mustChangePassword && location.pathname !== '/change-password')
    {
      navigate('/change-password',{ replace: true});
    }
  },[mustChangePassword,location.pathname]);

  const handleReset = () => {
    if (timer.isRunning) {
      if (!confirm('O timer está em andamento. Deseja realmente resetar?')) return;
    }
    timer.reset();
  };

  // Atualiza o slider E salva no banco ao mesmo tempo
  const handleChangeFocusMinutes = (v) => {
    timer.setFocusMinutes(v);
    timer.saveConfig({ focus: v * 60 });
  };

  const handleChangeShortBreakMinutes = (v) => {
    timer.setShortBreakMinutes(v);
    timer.saveConfig({ shortBreak: v * 60 });
  };

  const handleChangeLongBreakMinutes = (v) => {
    timer.setLongBreakMinutes(v);
    timer.saveConfig({ longBreak: v * 60 });
  };

  return (
    <>
      <Header />
      <Routes>
        <Route
          path="/"
          element={
            <Index
              mode={timer.mode}
              timeFormatted={timer.formatTime(timer.timeLeft)}
              progress={timer.progress}
              isRunning={timer.isRunning}
              pomodorosCompleted={timer.pomodorosCompleted}
              onSwitchMode={timer.switchMode}
              onStart={timer.start}
              onPause={timer.pause}
              onReset={handleReset}
              focusMinutes={timer.focusMinutes}
              shortBreakMinutes={timer.shortBreakMinutes}
              longBreakMinutes={timer.longBreakMinutes}
              onChangeFocusMinutes={handleChangeFocusMinutes}
              onChangeShortBreakMinutes={handleChangeShortBreakMinutes}
              onChangeLongBreakMinutes={handleChangeLongBreakMinutes}
              onLoadConfig={timer.loadConfig}
            />
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/history" element={<History />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path= "/change-password" element= {<ChangePassword/>}/>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <FeedbackButton />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;