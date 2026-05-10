"""
Esporta i blueprint per la registrazione nell'app factory.
"""

from app.routes.auth_routes import auth_bp
from app.routes.lrclib_routes import lrclib_bp
from app.routes.lyrics_routes import lyrics_bp

__all__ = ["auth_bp", "lrclib_bp", "lyrics_bp"]
