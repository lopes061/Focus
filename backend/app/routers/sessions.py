from fastapi import APIRouter
from app.database.database import conexao_banco_dados

router = APIRouter()

@router.post("/sessions")
def create_session(user_id: int, session: dict):
    banco = conexao_banco_dados()
    cursor = banco.cursor()
    cursor.execute("""
                   INSERT INTO pomodoro_sessions (user_id,minutos_foco,minutos_pausa_curta,minutos_pausa_longa,pomodoros_completos)
                   VALUES(?,?,?,?,?)
                   """,
                   (
                       session["user_id"],
                       session.get("minutos_foco", 0),
                       session.get("minutos_pausa_curta", 0),
                       session.get("minutos_pausa_longa", 0),
                       session.get("pomodoros_completos", 0)
                   ))
    
    cursor.execute(""" 
                UPDATE users
                SET total_minutos = total_minutos + ?
                WHERE id = ?
            """, (session.get("minutos_foco",0),session["user_id"]))

    banco.commit()
    banco.close()
    return {"message": "Sessão criada com sucesso!"}

@router.get("/sessions/{user_id}")
def get_sessions(user_id: int):
    banco = conexao_banco_dados()
    cursor = banco.cursor()
    cursor.execute("""
                   SELECT minutos_foco, minutos_pausa_curta, minutos_pausa_longa, pomodoros_completos, criado_em,id
                   FROM pomodoro_sessions
                   WHERE user_id = ?
                   ORDER BY criado_em DESC
                   """, (user_id,))
    rows = cursor.fetchall()
    banco.close()
    sessions = []
    for row in rows:
        sessions.append({
            "id": row["id"],
            "minutos_foco": row["minutos_foco"],
            "minutos_pausa_curta": row["minutos_pausa_curta"],
            "minutos_pausa_longa": row["minutos_pausa_longa"],
            "pomodoros_completos": row["pomodoros_completos"],
            "criado_em": row["criado_em"]
        })
    return sessions
