import sqlite3

banco = sqlite3.connect('focus.db')
cursor = banco.cursor()

cursor.execute("""
               INSERT INTO users (username, email, password,total_minutos)
               VALUES
               ('joao', 'joao@email.com', 'senha123', 120),
               ('maria', 'maria@email.com', 'senha456', 180),
               ('pedro', 'pedro@email.com', 'senha789', 90),
               ('TESTE', 'teste@gmail.com', 'senha456',1000)
               """)


banco.commit()
banco.close()

print("Dados de teste inseridos com sucesso!")

