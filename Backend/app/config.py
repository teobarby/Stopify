import os
from datetime import timedelta

BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))


class Config:
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        f"sqlite:///{os.path.join(BASE_DIR, 'lyrics.db')}",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "super-secret-key")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=30)

    SECRET_KEY = os.environ.get("SECRET_KEY", "change-me-in-production")

    MAX_CONTENT_LENGTH = 256 * 1024

    POW_DIFFICULTY = 4

    ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
    ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@stopify.local")
    ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")
