from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.database import conexao_banco_dados
from app.routers.auth import router as auth_router
from app.database.database import create_tables
from app.routers.ranking import router as ranking_router
from app.routers.config import router as config_router
from app.routers.sessions import router as sessions_router
from app.routers.feedback_router import router as feedback_router


create_tables()  # garante que as tabelas existam ao iniciar

app = FastAPI(title="Focus")

origins = [
    "http://localhost:8080",
    "http://192.168.1.29:8080",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(ranking_router)
app.include_router(config_router)
app.include_router(sessions_router)
app.include_router(feedback_router)