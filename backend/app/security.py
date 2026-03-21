from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database.database import conexao_banco_dados
import secrets

SECRET_KEY = "63f4945d921d599f27ae4fdf5bada3f1"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: int, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "email": email, "exp": expire, "type": "access"}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(user_id: int) -> str:
    token = secrets.token_urlsafe(64)
    expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    banco = conexao_banco_dados()
    cursor = banco.cursor()
    cursor.execute(
        "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
        (user_id, token, expires_at.isoformat())
    )
    banco.commit()
    banco.close()
    return token


def validate_refresh_token(token: str) -> dict:
    banco = conexao_banco_dados()
    cursor = banco.cursor()
    cursor.execute(
        "SELECT * FROM refresh_tokens WHERE token = ? AND revoked = 0", (token,)
    )
    row = cursor.fetchone()
    banco.close()
    if not row:
        raise HTTPException(status_code=401, detail="Refresh token inválido")
    expires_at = datetime.fromisoformat(row["expires_at"])
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        revoke_refresh_token(token)
        raise HTTPException(status_code=401, detail="Refresh token expirado")
    return dict(row)


def revoke_refresh_token(token: str):
    banco = conexao_banco_dados()
    cursor = banco.cursor()
    cursor.execute("UPDATE refresh_tokens SET revoked = 1 WHERE token = ?", (token,))
    banco.commit()
    banco.close()


def revoke_all_user_tokens(user_id: int):
    banco = conexao_banco_dados()
    cursor = banco.cursor()
    cursor.execute("UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?", (user_id,))
    banco.commit()
    banco.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Token inválido")
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado ou inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    banco = conexao_banco_dados()
    cursor = banco.cursor()
    cursor.execute("SELECT id, username, email, is_ativo FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    banco.close()
    if not user or not user["is_ativo"]:
        raise HTTPException(status_code=401, detail="Usuário não encontrado ou inativo")
    return dict(user)
