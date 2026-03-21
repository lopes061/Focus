
import { useEffect, useState } from 'react';
import RankingList from '@/components/RankingList';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Ranking() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/ranking`)
      .then((res) => {
        if (!res.ok) throw new Error('Erro ao buscar ranking');
        return res.json();
      })
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="container py-8 max-w-2xl animate-fade-in">
      <h1 className="text-2xl font-bold text-muted-87 mb-2">🏆 Ranking Completo</h1>
      <p className="text-sm text-muted-foreground mb-6">Veja quem está focando mais!</p>
      {loading ? (
        <p>Carregando ranking...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <RankingList users={users} />
      )}
    </div>
  );
}
