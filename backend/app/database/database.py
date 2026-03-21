import sqlite3
import os

DATABASE_PATH = os.path.join(os.path.dirname(__file__), "focus.db")


def conexao_banco_dados():
    """Cria e retorna uma conexão com o banco de dados SQLite."""
    banco = sqlite3.connect(DATABASE_PATH)
    banco.row_factory = sqlite3.Row  
    return banco


def create_tables():
    """Cria todas as tabelas do banco de dados se não existirem."""
    banco = conexao_banco_dados()
    cursor = banco.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            total_minutos INTEGER DEFAULT 0,
            is_ativo BOOLEAN DEFAULT 1,
            token_recuperacao TEXT,
            token_recuperacao_expira DATETIME,
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pomodoro_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            minutos_foco INTEGER DEFAULT 0,
            minutos_pausa_curta INTEGER DEFAULT 0,
            minutos_pausa_longa INTEGER DEFAULT 0,
            pomodoros_completos INTEGER DEFAULT 0,
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pomodoro_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            tempo_foco INTEGER DEFAULT 25,
            tempo_pausa_curta INTEGER DEFAULT 5,
            tempo_pausa_longa INTEGER DEFAULT 15,
            som_alarme TEXT DEFAULT 'alarme.mp3',
            auto_iniciar BOOLEAN DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT NOT NULL UNIQUE,
            expires_at DATETIME NOT NULL,
            revoked INTEGER DEFAULT 0,
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')
    
    banco.commit()
    try: # add coluna temp se nao tiver 
        cursor.execute("ALTER TABLE users ADD COLUMN senha_temporaria BOOLEAN DEFAULT 0")
        banco.commit()
    except:
        pass # passa se ja existir
    banco.close()
    print("Tabelas criadas com sucesso!")

if __name__ == "__main__":
    create_tables()
    
    
