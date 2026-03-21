import smtplib
import os
from pathlib import Path
from dotenv import load_dotenv
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")


def enviar_email_senha_temporaria(destinatario: str, username: str, senha_temporaria: str):
    """Envia email com senha temporária para o usuário."""

    assunto = "🍅 Focus — Sua nova senha temporária"

    corpo_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 48px;">🍅</span>
            <h1 style="color: #1e293b; font-size: 22px; margin-top: 8px;">Focus On Max</h1>
        </div>

        <div style="background: white; border-radius: 10px; padding: 24px; border: 1px solid #e2e8f0;">
            <p style="color: #1e293b; font-size: 16px;">Olá, <strong>{username}</strong>!</p>
            <p style="color: #64748b;">Recebemos uma solicitação de recuperação de senha para sua conta.</p>

            <p style="color: #64748b;">Sua senha temporária é:</p>

            <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0;">
                <span style="font-size: 24px; font-weight: bold; color: #4f46e5; letter-spacing: 4px;">
                    {senha_temporaria}
                </span>
            </div>

            <p style="color: #64748b; font-size: 14px;">
                Use essa senha para entrar e depois troque-a no seu perfil.
            </p>

            <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
                Se você não solicitou isso, ignore este email. Sua senha original continua a mesma.
            </p>
        </div>

        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">
            © Focus On Max
        </p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = assunto
    msg["From"] = SMTP_USER
    msg["To"] = destinatario
    msg.attach(MIMEText(corpo_html, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_USER, destinatario, msg.as_string())