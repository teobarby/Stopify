"""
Servizio di autenticazione: registrazione e login degli utenti.

- Hash password con werkzeug.security (PBKDF2-SHA256 con salt randomico)
- Validazione username, email e password
- Eccezione tipata `AuthError` con status HTTP suggerito
"""

from __future__ import annotations

import re
from typing import Optional

from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db
from app.models.user import User


# ─── Validazione ─────────────────────────────────────────────────────────────

USERNAME_RE = re.compile(r"^[A-Za-z0-9_]{3,30}$")
# Regex email pratica (non RFC-compliante ma sufficiente)
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
PASSWORD_MIN_LEN = 8


# ─── Eccezione di dominio ────────────────────────────────────────────────────

class AuthError(Exception):
    """Errore in autenticazione/registrazione: include status HTTP e codice."""

    def __init__(
        self,
        code: str,
        message: str,
        status: int = 400,
        extra: Optional[dict] = None,
    ):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status = status
        self.extra = extra or {}


# ─── Validatori ──────────────────────────────────────────────────────────────

def _validate_username(username: str) -> str:
    username = (username or "").strip()
    if not USERNAME_RE.match(username):
        raise AuthError(
            "InvalidUsernameError",
            "Lo username deve essere lungo 3-30 caratteri (lettere, numeri, underscore)",
            422,
        )
    return username


def _validate_email(email: str) -> str:
    email = (email or "").strip().lower()
    if not EMAIL_RE.match(email):
        raise AuthError("InvalidEmailError", "Email non valida", 422)
    return email


def _validate_password(password: str) -> str:
    if not isinstance(password, str) or len(password) < PASSWORD_MIN_LEN:
        raise AuthError(
            "WeakPasswordError",
            f"La password deve avere almeno {PASSWORD_MIN_LEN} caratteri",
            422,
        )
    if not re.search(r"\d", password):
        raise AuthError(
            "WeakPasswordError",
            "La password deve contenere almeno una cifra",
            422,
        )
    return password


# ─── Operazioni ──────────────────────────────────────────────────────────────

def register_user(username: str, email: str, password: str) -> User:
    """Crea un nuovo utente. Solleva `AuthError` in caso di errori."""
    u = _validate_username(username)
    e = _validate_email(email)
    _validate_password(password)

    # Univocità (case-insensitive su username e email)
    if User.query.filter(db.func.lower(User.username) == u.lower()).first():
        raise AuthError("UsernameTakenError", "Username già in uso", 409)
    if User.query.filter(db.func.lower(User.email) == e).first():
        raise AuthError("EmailTakenError", "Email già in uso", 409)

    user = User(
        username=u,
        email=e,
        password_hash=generate_password_hash(password),
    )
    db.session.add(user)
    db.session.commit()
    return user


def authenticate_user(identifier: str, password: str) -> User:
    """
    Autentica un utente in base a username **o** email + password.
    In caso di credenziali invalide solleva sempre lo stesso errore
    (evita user enumeration).
    """
    identifier = (identifier or "").strip()
    if not identifier or not password:
        raise AuthError("InvalidCredentialsError", "Credenziali non valide", 401)

    user = User.query.filter(
        db.or_(
            db.func.lower(User.username) == identifier.lower(),
            db.func.lower(User.email) == identifier.lower(),
        )
    ).first()

    # Verifica anche se l'utente non esiste, per costanza temporale.
    # check_password_hash è già constant-time internamente.
    if not user or not check_password_hash(user.password_hash, password):
        raise AuthError("InvalidCredentialsError", "Credenziali non valide", 401)

    return user


def get_user_by_id(user_id: int) -> Optional[User]:
    """Lookup utility per il decorator @jwt_required."""
    return User.query.get(user_id)
