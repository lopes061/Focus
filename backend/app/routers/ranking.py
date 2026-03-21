from fastapi import APIRouter
from app.database.database import conexao_banco_dados

router = APIRouter()

@router.get("/ranking")
def get_ranking(limit: int = None):
    banco = conexao_banco_dados()
    cursor = banco.cursor()
    if limit:
        cursor.execute("""
            SELECT username,total_minutos
            FROM users
            WHERE total_minutos > 0
            ORDER BY total_minutos DESC
            LIMIT ?
        """, (limit,))
    else:
        cursor.execute("""
            SELECT username,total_minutos
            FROM users
            WHERE total_minutos > 0
            ORDER BY total_minutos DESC
        """)
    rows = cursor.fetchall()
    banco.close()
    ranking = []
    for i, row in enumerate(rows, start=1):
        ranking.append({
            "position": i,
            "name": row["username"],
            "hours": row["total_minutos"] // 60,
            "minutes": row["total_minutos"] % 60,
            "avatar": row["username"][:2].upper()
        })
    return ranking
