import re

from werkzeug.security import check_password_hash, generate_password_hash

from app.errors import AppError
from app.extensions import db
from app.models.user import User

USERNAME_RE = re.compile(r"^[A-Za-z0-9_]{3,30}$")
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
PASSWORD_MIN_LEN = 8


def _validate_username(username: str) -> str:
    username = (username or "").strip()
    if not USERNAME_RE.match(username):
        raise AppError("Username non valido (3-30 caratteri: lettere, numeri, underscore)", 422)
    return username


def _validate_email(email: str) -> str:
    email = (email or "").strip().lower()
    if not EMAIL_RE.match(email):
        raise AppError("Email non valida", 422)
    return email


def _validate_password(password: str) -> str:
    if not isinstance(password, str) or len(password) < PASSWORD_MIN_LEN:
        raise AppError(f"La password deve avere almeno {PASSWORD_MIN_LEN} caratteri", 422)
    if not re.search(r"\d", password):
        raise AppError("La password deve contenere almeno una cifra", 422)
    return password


def register_user(username: str, email: str, password: str) -> User:
    u = _validate_username(username)
    e = _validate_email(email)
    _validate_password(password)

    if User.query.filter(db.func.lower(User.username) == u.lower()).first():
        raise AppError("Username già in uso", 409)
    if User.query.filter(db.func.lower(User.email) == e).first():
        raise AppError("Email già in uso", 409)

    user = User(username=u, email=e, password_hash=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()
    return user


def authenticate_user(identifier: str, password: str) -> User:
    identifier = (identifier or "").strip()
    if not identifier or not password:
        raise AppError("Credenziali non valide", 401)

    user = User.query.filter(
        db.or_(
            db.func.lower(User.username) == identifier.lower(),
            db.func.lower(User.email) == identifier.lower(),
        )
    ).first()

    if not user or not check_password_hash(user.password_hash, password):
        raise AppError("Credenziali non valide", 401)

    return user


def get_user_by_id(user_id: int):
    return db.session.get(User, user_id)
