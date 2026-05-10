"""
Route di autenticazione:

  POST /auth/register   - crea un nuovo utente
  POST /auth/login      - emette access + refresh token
  POST /auth/refresh    - emette un nuovo access token (richiede refresh token)
  GET  /auth/me         - info utente corrente (richiede access token)
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
)

from app.services.auth_service import (
    AuthError,
    authenticate_user,
    get_user_by_id,
    register_user,
)

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


# ─── Errori coerenti con lo stile LRCLIB ─────────────────────────────────────

def _err(code: str, status: int, message: str, **extra):
    body = {"statusCode": status, "error": code, "message": message}
    body.update(extra)
    return jsonify(body), status


def _auth_error(e: AuthError):
    return _err(e.code, e.status, e.message, **e.extra)


def _issue_tokens(user_id: int) -> dict:
    return {
        "accessToken": create_access_token(identity=str(user_id)),
        "refreshToken": create_refresh_token(identity=str(user_id)),
    }


# ─── POST /auth/register ─────────────────────────────────────────────────────

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    try:
        user = register_user(
            username=data.get("username", ""),
            email=data.get("email", ""),
            password=data.get("password", ""),
        )
    except AuthError as e:
        return _auth_error(e)

    return jsonify({
        "user": user.to_dict(),
        **_issue_tokens(user.id),
    }), 201


# ─── POST /auth/login ────────────────────────────────────────────────────────

@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Body JSON:
        usernameOrEmail   (oppure 'username' / 'email')
        password
    """
    data = request.get_json(silent=True) or {}
    identifier = (
        data.get("usernameOrEmail")
        or data.get("username")
        or data.get("email")
        or ""
    )
    password = data.get("password", "")

    try:
        user = authenticate_user(identifier, password)
    except AuthError as e:
        return _auth_error(e)

    return jsonify({
        "user": user.to_dict(),
        **_issue_tokens(user.id),
    }), 200


# ─── POST /auth/refresh ──────────────────────────────────────────────────────

@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    return jsonify({
        "accessToken": create_access_token(identity=str(user_id)),
    }), 200


# ─── GET /auth/me ────────────────────────────────────────────────────────────

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = get_user_by_id(int(user_id))
    if not user:
        return _err("UserNotFoundError", 404, "Utente non trovato")
    return jsonify({"user": user.to_dict()}), 200
