"""
Modello User — predisposto per l'autenticazione futura.
Attualmente l'app pubblica le lyrics in modo anonimo (PoW).
"""

from datetime import datetime

from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(200), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    # Ruolo: True per gli amministratori, False per gli utenti normali.
    # Gli admin possono modificare/cancellare qualunque brano e visualizzare
    # tutto il catalogo (anche i brani anonimi).
    is_admin = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "is_admin": bool(self.is_admin),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
