from fastapi import APIRouter
from app.database.database import conexao_banco_dados

router = APIRouter()

@router.get("/config/{user_id}")
def get_config(user_id: int):
    banco = conexao_banco_dados()
    cursor = banco.cursor()
    cursor.execute("""
                   SELECT users.username, tempo_foco, tempo_pausa_curta, tempo_pausa_longa, som_alarme, auto_iniciar
                   FROM pomodoro_config JOIN users ON pomodoro_config.user_id = users.id
                   WHERE user_id = ?
                   """, (user_id,))
    row = cursor.fetchone()
    banco.close()
    if row:
        return {
            "username": row["username"],
            "tempo_foco": row["tempo_foco"],
            "tempo_pausa_curta": row["tempo_pausa_curta"],
            "tempo_pausa_longa": row["tempo_pausa_longa"],
            "som_alarme": row["som_alarme"],
            "auto_iniciar": bool(row["auto_iniciar"])
        }

@router.put("/config/{user_id}")
def update_config(user_id: int, config: dict):
    banco = conexao_banco_dados()
    cursor = banco.cursor()
    cursor.execute("""
                   UPDATE pomodoro_config
                   SET tempo_foco = ?, tempo_pausa_curta = ?, tempo_pausa_longa = ?, som_alarme = ?, auto_iniciar = ?
                   WHERE user_id = ?
                   """,
                   (
                       config.get("tempo_foco", 25),
                       config.get("tempo_pausa_curta", 5),
                       config.get("tempo_pausa_longa", 15),
                       config.get("som_alarme", "alarme.mp3"),
                       int(config.get("auto_iniciar", False)),
                       user_id
                   )
    )
    if "nome" in config:
        cursor.execute("""
                       UPDATE users
                       SET username = ?
                       WHERE id = ?
                       """,
                       (
                           config["nome"],
                           user_id
                       ))
    banco.commit()
    banco.close()
    return {"message": "Configurações atualizadas com sucesso!"}
