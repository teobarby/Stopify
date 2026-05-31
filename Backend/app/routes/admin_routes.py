from functools import wraps

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.services.auth_service import get_user_by_id
from app.services.lyrics_service import list_all_songs
from app.routes._helpers import make_error as _err

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user = get_user_by_id(int(get_jwt_identity()))
        if user is None:
            return _err("Utente non trovato", 401)
        if not user.is_admin:
            return _err("Solo gli amministratori possono accedere a questa risorsa", 403)
        return fn(*args, **kwargs)
    return wrapper


@admin_bp.route("/songs", methods=["GET"])
@admin_required
def admin_list_songs():
    q = request.args.get("q", "").strip()
    only_anonymous = request.args.get("anonymous", "").lower() in ("1", "true", "yes")
    user_id = request.args.get("user_id", type=int)

    songs = list_all_songs(q=q, only_anonymous=only_anonymous, user_id=user_id)
    return jsonify([s.to_lrclib() for s in songs]), 200
