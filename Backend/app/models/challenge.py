from datetime import datetime, timezone

from app.extensions import db


class PowChallenge(db.Model):
    __tablename__ = "pow_challenges"

    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(64), unique=True, nullable=False)
    difficulty = db.Column(db.Integer, default=4)
    used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
