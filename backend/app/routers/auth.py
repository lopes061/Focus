from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, field_validator
from app.database.database import conexao_banco_dados
from app.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    validate_refresh_token, revoke_refresh_token,
    revoke_all_user_tokens, get_current_user
)
import re
from app.email_service import enviar_email_senha_temporaria
import random
import string

router = APIRouter(prefix="/auth", tags=["auth"])



class RegisterSchema(BaseModel):
    username: str
    email: EmailStr
    password: str

    @field_validator("username")
    @classmethod
    def username_valido(cls, v):
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Username deve ter pelo menos 2 caracteres")
        return v

    @field_validator("password")
    @classmethod
    def senha_forte(cls, v):
        if len(v) < 8:
            raise ValueError("Senha deve ter pelo menos 8 caracteres")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Senha deve ter pelo menos uma letra maiúscula")
        if not re.search(r"[0-9]", v):
            raise ValueError("Senha deve ter pelo menos um número")
        return v


class LoginSchema(BaseModel):
    email: EmailStr
    password: str


class RefreshSchema(BaseModel):
    refresh_token: str

class ForgotPasswordSchema(BaseModel):
    email: EmailStr

class ChangePasswordSchema(BaseModel):
    nova_senha: str

@router.post("/register", status_code=201)
def register(data: RegisterSchema):
    banco = conexao_banco_dados()
    cursor = banco.cursor()

    cursor.execute("SELECT id FROM users WHERE email = ?", (data.email,))
    if cursor.fetchone():
        banco.close()
        raise HTTPException(status_code=409, detail="Email já cadastrado")

    cursor.execute("SELECT id FROM users WHERE username = ?", (data.username,))
    if cursor.fetchone():
        banco.close()
        raise HTTPException(status_code=409, detail="Username já em uso")

    cursor.execute(
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
        (data.username, data.email, hash_password(data.password))
    )
    user_id = cursor.lastrowid

    # Cria config padrão do pomodoro para o novo usuário
    cursor.execute(
        "INSERT INTO pomodoro_config (user_id) VALUES (?)", (user_id,)
    )

    banco.commit()
    banco.close()

    access_token = create_access_token(user_id, data.email)
    refresh_token = create_refresh_token(user_id)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {"id": user_id, "username": data.username, "email": data.email}
    }


@router.post("/login")
def login(data: LoginSchema):
    banco = conexao_banco_dados()
    cursor = banco.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (data.email,))
    user = cursor.fetchone()
    banco.close()

    # Mensagem genérica(por segurança) — não revela se email existe
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")

    if not user["is_ativo"]:
        raise HTTPException(status_code=403, detail="Conta desativada")

    access_token = create_access_token(user["id"], user["email"])
    refresh_token = create_refresh_token(user["id"])

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "must_change_password": bool(user["senha_temporaria"]), # user tem senha temporaria on?
        "user": {"id": user["id"], "username": user["username"], "email": user["email"]}
    }


@router.post("/refresh")
def refresh(data: RefreshSchema):
    token_row = validate_refresh_token(data.refresh_token)
    user_id = token_row["user_id"]

    banco = conexao_banco_dados()
    cursor = banco.cursor()
    cursor.execute("SELECT id, username, email, is_ativo FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    banco.close()

    if not user or not user["is_ativo"]:
        raise HTTPException(status_code=401, detail="Usuário inválido")

    # Rotaciona: invalida o antigo, emite novo
    revoke_refresh_token(data.refresh_token)
    new_access = create_access_token(user["id"], user["email"])
    new_refresh = create_refresh_token(user["id"])

    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "user": {"id": user["id"], "username": user["username"], "email": user["email"]}
    }


@router.post("/logout")
def logout(data: RefreshSchema, current_user: dict = Depends(get_current_user)):
    revoke_refresh_token(data.refresh_token)
    return {"message": "Logout realizado com sucesso"}


@router.post("/logout-all")
def logout_all(current_user: dict = Depends(get_current_user)):
    revoke_all_user_tokens(current_user["id"])
    return {"message": "Logout realizado em todos os dispositivos"}


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordSchema):
    banco = conexao_banco_dados()
    cursor = banco.cursor()
    cursor.execute("SELECT id, username, email FROM users WHERE email = ?", (data.email,))
    user = cursor.fetchone()
    banco.close()

    if not user:
        return {"message": "Se esse email estiver cadastrado, você receberá a nova senha em breve."}

    # Gera senha temporária
    letras = random.choices(string.ascii_uppercase, k=3)
    numeros = random.choices(string.digits, k=3)
    especiais = random.choices("@#$!", k=2)
    partes = letras + numeros + especiais
    random.shuffle(partes)
    senha_temporaria = "".join(partes)

    # Tenta enviar o email PRIMEIRO
    try:
        enviar_email_senha_temporaria(user["email"], user["username"], senha_temporaria)
    except Exception:
        raise HTTPException(status_code=500, detail="Erro ao enviar email. Tente novamente.")

    # Salva senha hasheada e marca como temporária
    banco = conexao_banco_dados()
    cursor = banco.cursor()
    cursor.execute(
        "UPDATE users SET password = ?, senha_temporaria = 1 WHERE id = ?",
        (hash_password(senha_temporaria), user["id"])
    )
    banco.commit()
    banco.close()

    # Invalida todos os tokens ativos
    revoke_all_user_tokens(user["id"])

    return {"message": "Se esse email estiver cadastrado, você receberá a nova senha em breve."}


@router.post("/change-password")
def change_passsword(
    data: ChangePasswordSchema,
    current_user: dict = Depends(get_current_user) # Segurança que verifica o token e entrega o usuario logado 
):
    import re
    if len(data.nova_senha) < 8:
        raise HTTPException(status_code=400, detail="Senha deve ter pelo menos 8 caracteres")
    if not re.search(r"[A-Z]", data.nova_senha):
        raise HTTPException(status_code=400, detail="Senha deve ter pelo menos uma letra maiúscula")
    if not re.search(r"[0-9]", data.nova_senha):
        raise HTTPException(status_code=400, detail="Senha deve ter pelo menos um número")
    
    banco = conexao_banco_dados()
    cursor = banco.cursor()

    # Agora salvamos a nova senha e removemos flag temporaria
    
    cursor.execute(
        "UPDATE users SET password = ?, senha_temporaria = 0 WHERE id = ? ",
        (hash_password(data.nova_senha), current_user["id"])     
    )
    banco.commit()
    banco.close()

    # Invalidamos tokens antigos e emite novos

    revoke_all_user_tokens(current_user["id"])
    access_token = create_access_token(current_user["id"],current_user["email"])
    refresh_token = create_refresh_token(current_user["id"])

    return{
        "message": "Senha alterada com sucesso!",
        "access_token": access_token,
        "refresh_token": refresh_token,
    }