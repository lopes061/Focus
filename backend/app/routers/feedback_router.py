from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.email_service import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

router = APIRouter(prefix="/feedback", tags=["feedback"])

TIPO_EMOJI = {
    "sugestao": "💡",
    "bug": "🐛",
    "outro": "💬",
}

TIPO_LABEL = {
    "sugestao": "Sugestão",
    "bug": "Bug",
    "outro": "Outro",
}


class FeedbackSchema(BaseModel):
    tipo: str  # sugestao | bug | outro
    mensagem: str
    email: Optional[str] = None


@router.post("")
def enviar_feedback(data: FeedbackSchema):
    if data.tipo not in TIPO_EMOJI:
        raise HTTPException(status_code=400, detail="Tipo inválido")

    if not data.mensagem.strip():
        raise HTTPException(status_code=400, detail="Mensagem não pode ser vazia")

    emoji = TIPO_EMOJI[data.tipo]
    label = TIPO_LABEL[data.tipo]
    remetente = data.email or "Anônimo"

    assunto = f"{emoji} Focus — {label} de {remetente}"

    corpo_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 48px;">🍅</span>
            <h1 style="color: #1e293b; font-size: 22px; margin-top: 8px;">Focus — Feedback</h1>
        </div>

        <div style="background: white; border-radius: 10px; padding: 24px; border: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px; margin-bottom: 4px;">Tipo</p>
            <p style="color: #1e293b; font-size: 16px; font-weight: bold;">{emoji} {label}</p>

            <p style="color: #64748b; font-size: 14px; margin-top: 16px; margin-bottom: 4px;">De</p>
            <p style="color: #1e293b;">{remetente}</p>

            <p style="color: #64748b; font-size: 14px; margin-top: 16px; margin-bottom: 4px;">Mensagem</p>
            <div style="background: #f1f5f9; border-radius: 8px; padding: 16px;">
                <p style="color: #1e293b; white-space: pre-wrap;">{data.mensagem}</p>
            </div>
        </div>
    </div>
    """

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = assunto
        msg["From"] = SMTP_USER
        msg["To"] = SMTP_USER  # envia para o meu email o mesmo que usa para forget_password
        if data.email:
            msg["Reply-To"] = data.email  # facilita responder ao usuário
        msg.attach(MIMEText(corpo_html, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, SMTP_USER, msg.as_string())
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro ao enviar feedback")

    return {"message": "Feedback enviado com sucesso!"}
