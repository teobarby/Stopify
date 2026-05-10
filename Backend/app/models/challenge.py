"""
Modello PowChallenge per il meccanismo Proof of Work anti-spam.
"""

from datetime import datetime

from app.extensions import db


class PowChallenge(db.Model):
    """Sfide crittografiche per il meccanismo Proof of Work."""

    __tablename__ = "pow_challenges"

    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(64), unique=True, nullable=False)
    difficulty = db.Column(db.Integer, default=4)  # n. di zeri iniziali richiesti
    used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
