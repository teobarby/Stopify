from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models.lyrics import Song
from app.services.crypto_service import parse_publish_token
from app.errors import AppError
from app.services.auth_service import get_user_by_id
from app.services.lyrics_service import (
    delete_song,
    explore_songs,
    get_by_signature,
    list_all_songs,
    publish_song_lrclib,
    search_songs,
    update_song,
)
from app.routes._helpers import make_error as _err

lrclib_bp = Blueprint("lrclib", __name__, url_prefix="/api")


@lrclib_bp.route("/get", methods=["GET"])
def get_lyrics():
    track_name = request.args.get("track_name", "").strip()
    artist_name = request.args.get("artist_name", "").strip()
    album_name = request.args.get("album_name", "").strip() or None
    duration_raw = request.args.get("duration")

    if not track_name or not artist_name:
        return _err("track_name e artist_name sono obbligatori", 400)

    duration = None
    if duration_raw:
        try:
            duration = float(duration_raw)
        except (TypeError, ValueError):
            return _err("duration deve essere numerica", 400)

    song = get_by_signature(track_name, artist_name, album_name, duration)
    if not song:
        return _err("Lyrics non trovate", 404)
    return jsonify(song.to_lrclib()), 200


@lrclib_bp.route("/get-cached", methods=["GET"])
def get_lyrics_cached():
    return get_lyrics()


@lrclib_bp.route("/get/<int:song_id>", methods=["GET"])
def get_lyrics_by_id(song_id: int):
    song = db.session.get(Song, song_id)
    if not song:
        return _err("Lyrics non trovate", 404)
    return jsonify(song.to_lrclib()), 200


@lrclib_bp.route("/search", methods=["GET"])
def search_lyrics():
    q = request.args.get("q", "").strip()
    track_name = request.args.get("track_name", "").strip()
    artist_name = request.args.get("artist_name", "").strip()
    album_name = request.args.get("album_name", "").strip()

    if not any([q, track_name, artist_name, album_name]):
        return _err("Fornisci almeno uno tra: q, track_name, artist_name, album_name", 400)

    results = search_songs(q=q, title=track_name, artist=artist_name, album=album_name)
    return jsonify([s.to_lrclib() for s in results]), 200


@lrclib_bp.route("/request-challenge", methods=["POST"])
def request_challenge():
    from app.services.crypto_service import difficulty_to_target, generate_token
    prefix = generate_token(32)
    target = difficulty_to_target(4)
    return jsonify({"prefix": prefix, "target": target}), 200


@lrclib_bp.route("/publish", methods=["POST"])
@jwt_required(optional=True)
def publish():
    payload = request.get_json(silent=True)
    user_identity = get_jwt_identity()
    user_id = int(user_identity) if user_identity is not None else None

    prefix = None
    nonce = None
    if user_id is None:
        parsed = parse_publish_token(request.headers.get("X-Publish-Token", ""))
        if parsed:
            prefix, nonce = parsed

    try:
        song = publish_song_lrclib(payload, prefix=prefix, nonce=nonce, user_id=user_id)
    except AppError as e:
        return _err(e.message, e.status)

    return jsonify(song.to_lrclib()), 201


@lrclib_bp.route("/me/songs", methods=["GET"])
@jwt_required()
def my_songs():
    user_id = int(get_jwt_identity())
    songs = list_all_songs(user_id=user_id)
    return jsonify([s.to_lrclib() for s in songs]), 200


@lrclib_bp.route("/songs/<int:song_id>", methods=["PUT"])
@jwt_required()
def update_my_song(song_id: int):
    user_id = int(get_jwt_identity())
    payload = request.get_json(silent=True)
    user = get_user_by_id(user_id)
    try:
        song = update_song(song_id, payload, user_id, is_admin=bool(user and user.is_admin))
    except AppError as e:
        return _err(e.message, e.status)
    return jsonify(song.to_lrclib()), 200


@lrclib_bp.route("/songs/<int:song_id>", methods=["DELETE"])
@jwt_required()
def delete_my_song(song_id: int):
    user_id = int(get_jwt_identity())
    user = get_user_by_id(user_id)
    try:
        delete_song(song_id, user_id, is_admin=bool(user and user.is_admin))
    except AppError as e:
        return _err(e.message, e.status)
    return jsonify({"deleted": song_id}), 200


@lrclib_bp.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()})


@lrclib_bp.route("/explore", methods=["GET"])
def explore():
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 20, type=int)
    sort = request.args.get("sort", "recent")
    pagination = explore_songs(page=page, limit=limit, sort=sort)
    return jsonify({
        "songs": [s.to_lrclib() for s in pagination.items],
        "total": pagination.total,
        "page": page,
        "pages": pagination.pages,
        "has_next": pagination.has_next,
        "has_prev": pagination.has_prev,
    }), 200


