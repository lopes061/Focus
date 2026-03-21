import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/Useauth';

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate('/login');
  };

  // Gera as iniciais do avatar (ex: "João Silva" → "JS")
  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '?';

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-muted-87">
          <span className="text-2xl">🍅</span>
          <span>Focus</span>
        </Link>

        <nav className="hidden md:flex items-center gap-4">
          <Link to="/ranking" className="text-sm text-muted-60 hover:text-muted-87 transition-colors">Ranking</Link>
          {isAuthenticated ? (
            <>
              <Link to="/history" className="text-sm text-muted-60 hover:text-muted-87 transition-colors">Histórico</Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>Sair</Button>

              {/* Avatar — bolinha com iniciais, leva ao perfil */}
              <Link
                to="/profile"
                title={`Perfil de ${user?.username}`}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold hover:opacity-80 transition-opacity"
              >
                {initials}
              </Link>
            </>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm">Entrar</Button>
            </Link>
          )}
        </nav>

        <button className="md:hidden text-muted-87" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background animate-fade-in">
          <nav className="container flex flex-col gap-3 py-4">
            <Link to="/ranking" className="text-sm text-muted-60 hover:text-muted-87 transition-colors" onClick={() => setMobileOpen(false)}>Ranking</Link>
            {isAuthenticated ? (
              <>
                <Link to="/history" className="text-sm text-muted-60 hover:text-muted-87 transition-colors" onClick={() => setMobileOpen(false)}>Histórico</Link>
                <Link to="/profile" className="text-sm text-muted-60 hover:text-muted-87 transition-colors" onClick={() => setMobileOpen(false)}>Perfil</Link>
                <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>Sair</Button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" size="sm" className="w-full">Entrar</Button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}