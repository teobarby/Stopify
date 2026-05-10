import os
from datetime import timedelta

BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))


class Config:
    # Database — la URI può essere sovrascritta via env (DATABASE_URL)
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        f"sqlite:///{os.path.join(BASE_DIR, 'lyrics.db')}",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "super-secret-key")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=30)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)

    # Generic Flask secret
    SECRET_KEY = os.environ.get("SECRET_KEY", "change-me-in-production")

    # Limite massimo del body di una richiesta (anti-DoS leggero)
    MAX_CONTENT_LENGTH = 256 * 1024  # 256 KB

    # Proof of Work — numero di zeri esadecimali iniziali richiesti dal SHA-256
    POW_DIFFICULTY = 4
