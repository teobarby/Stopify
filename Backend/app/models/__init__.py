"""
Esporta tutti i modelli per facilitare l'importazione e la registrazione
con SQLAlchemy / Flask-Migrate.
"""

from app.models.lyrics import Artist, Album, Song
from app.models.challenge import PowChallenge
from app.models.user import User

__all__ = ["Artist", "Album", "Song", "PowChallenge", "User"]
