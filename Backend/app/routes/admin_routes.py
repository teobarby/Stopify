"""
Route di amministrazione (richiedono utente con `is_admin = True`).

Montate sotto /admin:

    GET /admin/songs      - elenco completo del catalogo (anche brani anonimi),
                            con filtri opzionali ?q, ?user_id, ?anonymous

L'accesso è ristretto via decorator @admin_required: il JWT viene validato,
poi si carica l'utente dal DB e si controlla `is_admin`.
"""

from functools import wraps

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.services.auth_service import get_user_by_id
from app.services.lyrics_service import list_all_songs

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


# ─── Helper di errore in stile LRCLIB ────────────────────────────────────────

def _err(code: str, status: int, message: str):
    return (
        jsonify({"statusCode": status, "error": code, "message": message}),
        status,
    )


# ─── Decorator @admin_required ───────────────────────────────────────────────

def admin_required(fn):
    """
    Pretende un JWT valido + che l'utente corrente abbia is_admin=True.
    In caso contrario risponde con 403 (Forbidden) o 401 se il token manca.
    """

    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        identity = get_jwt_identity()
        if identity is None:
            return _err("AuthRequiredError", 401, "Autenticazione richiesta")

        user = get_user_by_id(int(identity))
        if user is None:
            return _err("UserNotFoundError", 401, "Utente non trovato")

        if not user.is_admin:
            return _err(
                "ForbiddenError",
                403,
                "Solo gli amministratori possono accedere a questa risorsa",
            )

        return fn(*args, **kwargs)

    return wrapper


# ─── GET /admin/songs ────────────────────────────────────────────────────────

@admin_bp.route("/songs", methods=["GET"])
@admin_required
def admin_list_songs():
    """
    Elenca tutti i brani del catalogo, brani anonimi inclusi.

    Query string opzionali:
        q          ricerca su titolo/artista (LIKE)
        user_id    filtra per autore specifico
        anonymous  se 'true' ritorna solo i brani anonimi (user_id NULL)
    """
    q = request.args.get("q", "").strip()
    only_anonymous = request.args.get("anonymous", "").lower() in ("1", "true", "yes")

    user_id_raw = request.args.get("user_id", "").strip()
    user_id = None
    if user_id_raw:
        try:
            user_id = int(user_id_raw)
        except ValueError:
            return _err("InvalidParameterError", 400, "user_id deve essere intero")

    songs = list_all_songs(q=q, only_anonymous=only_anonymous, user_id=user_id)
    return jsonify([s.to_lrclib() for s in songs]), 200
