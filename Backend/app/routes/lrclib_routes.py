"""
Endpoint compatibili LRCLIB (https://lrclib.net/docs).

Tutti gli endpoint sono montati sotto /api e seguono lo schema LRCLIB:

    GET  /api/get               - lookup by track signature
    GET  /api/get-cached        - lookup by track signature (cache only)
    GET  /api/get/<id>          - lookup by ID
    GET  /api/search            - search records
    POST /api/publish           - publish new lyrics (richiede X-Publish-Token)
    POST /api/request-challenge - richiedi challenge PoW per publish
"""

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models.challenge import PowChallenge
from app.models.lyrics import Song
from app.services.crypto_service import (
    difficulty_to_target,
    generate_token,
    parse_publish_token,
)
from app.services.auth_service import get_user_by_id
from app.services.lyrics_service import (
    PublishError,
    delete_song,
    get_by_signature,
    list_user_songs,
    publish_song_lrclib,
    search_songs,
    update_song,
)
from app.routes._helpers import make_error as _err

lrclib_bp = Blueprint("lrclib", __name__, url_prefix="/api")


# ─── GET /api/get ────────────────────────────────────────────────────────────

@lrclib_bp.route("/get", methods=["GET"])
def get_lyrics():
    """
    Cerca lyrics per signature: track_name + artist_name (+ album_name +
    duration opzionali). Risponde 404 se nessun match.
    """
    track_name = request.args.get("track_name", "").strip()
    artist_name = request.args.get("artist_name", "").strip()
    album_name = request.args.get("album_name", "").strip() or None
    duration_raw = request.args.get("duration")

    if not track_name or not artist_name:
        return _err(
            "MissingParametersError",
            400,
            "track_name e artist_name sono obbligatori",
        )

    duration = None
    if duration_raw:
        try:
            duration = float(duration_raw)
        except (TypeError, ValueError):
            return _err("InvalidParameterError", 400, "duration deve essere numerica")

    song = get_by_signature(track_name, artist_name, album_name, duration)
    if not song:
        return _err("TrackNotFoundError", 404, "Lyrics non trovate")

    return jsonify(song.to_lrclib()), 200


# ─── GET /api/get-cached ─────────────────────────────────────────────────────

@lrclib_bp.route("/get-cached", methods=["GET"])
def get_lyrics_cached():
    """
    Variante 'cache only' di /api/get. Nella nostra implementazione il DB
    locale È la cache, quindi il comportamento è identico a /api/get.
    """
    return get_lyrics()


# ─── GET /api/get/<id> ───────────────────────────────────────────────────────

@lrclib_bp.route("/get/<int:song_id>", methods=["GET"])
def get_lyrics_by_id(song_id: int):
    from app.extensions import db
    song = db.session.get(Song, song_id)
    if not song:
        return _err("TrackNotFoundError", 404, "Lyrics non trovate")
    return jsonify(song.to_lrclib()), 200


# ─── GET /api/search ─────────────────────────────────────────────────────────

@lrclib_bp.route("/search", methods=["GET"])
def search_lyrics():
    """
    Ricerca lyrics per parametri liberi.

    Parametri (almeno uno):
      q             ricerca generica su titolo/artista
      track_name    titolo (LIKE)
      artist_name   artista (LIKE)
      album_name    album (LIKE)
    """
    q = request.args.get("q", "").strip()
    track_name = request.args.get("track_name", "").strip()
    artist_name = request.args.get("artist_name", "").strip()
    album_name = request.args.get("album_name", "").strip()

    if not any([q, track_name, artist_name, album_name]):
        return _err(
            "MissingParametersError",
            400,
            "fornisci almeno uno tra: q, track_name, artist_name, album_name",
        )

    results = search_songs(
        q=q,
        title=track_name,
        artist=artist_name,
        album=album_name,
    )
    return jsonify([s.to_lrclib() for s in results]), 200


# ─── POST /api/request-challenge ─────────────────────────────────────────────

@lrclib_bp.route("/request-challenge", methods=["POST"])
def request_challenge():
    """
    Emette una nuova sfida PoW.

    Risponde:
        {
          "prefix": "<32 byte hex>",
          "target": "<64 char hex>"
        }

    Il client deve trovare un nonce tale che
        SHA-256(prefix + nonce) <= target  (lessicograficamente, hex)
    e inviare 'prefix:nonce' come header X-Publish-Token nel POST /api/publish.
    """
    difficulty = current_app.config.get("POW_DIFFICULTY", 4)
    prefix = generate_token(32)
    target = difficulty_to_target(difficulty)

    challenge = PowChallenge(token=prefix, difficulty=difficulty)
    db.session.add(challenge)
    db.session.commit()

    return jsonify({"prefix": prefix, "target": target}), 200


# ─── POST /api/publish ───────────────────────────────────────────────────────

@lrclib_bp.route("/publish", methods=["POST"])
@jwt_required(optional=True)
def publish():
    """
    Pubblica nuove lyrics.

    Autorizzazione: deve essere fornito UNO tra:
        Authorization: Bearer <jwt>      → publish autenticato (no PoW)
        X-Publish-Token: <prefix>:<nonce> → publish anonimo (PoW richiesto)

    Body JSON:
        trackName     (obbligatorio)
        artistName    (obbligatorio)
        plainLyrics   (obbligatorio)
        albumName     (opzionale)
        duration      (opzionale, secondi)
        syncedLyrics  (opzionale, formato LRC)
        instrumental  (opzionale, default false)
    """
    payload = request.get_json(silent=True)

    # ── 1. Tenta autenticazione JWT ─────────────────────────────────────────
    user_identity = get_jwt_identity()
    user_id = int(user_identity) if user_identity is not None else None

    # ── 2. Altrimenti, prova il PoW token ───────────────────────────────────
    prefix: str | None = None
    nonce: str | None = None
    if user_id is None:
        header = request.headers.get("X-Publish-Token", "")
        parsed = parse_publish_token(header)
        if parsed:
            prefix, nonce = parsed

    try:
        song = publish_song_lrclib(payload, prefix=prefix, nonce=nonce, user_id=user_id)
    except PublishError as e:
        body = {"statusCode": e.status, "error": e.code, "message": e.message}
        body.update(e.extra)
        return jsonify(body), e.status

    return jsonify(song.to_lrclib()), 201


# ─── GET /api/me/songs ───────────────────────────────────────────────────────

@lrclib_bp.route("/me/songs", methods=["GET"])
@jwt_required()
def my_songs():
    """
    Elenca i brani pubblicati dall'utente autenticato (più recenti per primi).
    """
    user_id = int(get_jwt_identity())
    songs = list_user_songs(user_id)
    return jsonify([s.to_lrclib() for s in songs]), 200


# ─── PUT /api/songs/<id> ─────────────────────────────────────────────────────

@lrclib_bp.route("/songs/<int:song_id>", methods=["PUT"])
@jwt_required()
def update_my_song(song_id: int):
    """
    Aggiorna un brano. Richiede JWT e che `song.user_id == current_user`,
    oppure che l'utente sia admin (bypass del check di proprietà).
    Body identico al POST /api/publish.
    """
    user_id = int(get_jwt_identity())
    payload = request.get_json(silent=True)

    user = get_user_by_id(user_id)
    is_admin = bool(user and user.is_admin)

    try:
        song = update_song(song_id, payload, user_id, is_admin=is_admin)
    except PublishError as e:
        body = {"statusCode": e.status, "error": e.code, "message": e.message}
        body.update(e.extra)
        return jsonify(body), e.status

    return jsonify(song.to_lrclib()), 200


# ─── DELETE /api/songs/<id> ──────────────────────────────────────────────────

@lrclib_bp.route("/songs/<int:song_id>", methods=["DELETE"])
@jwt_required()
def delete_my_song(song_id: int):
    """
    Cancella un brano. Richiede JWT e che `song.user_id == current_user`,
    oppure che l'utente sia admin (bypass del check di proprietà).
    """
    user_id = int(get_jwt_identity())

    user = get_user_by_id(user_id)
    is_admin = bool(user and user.is_admin)

    try:
        delete_song(song_id, user_id, is_admin=is_admin)
    except PublishError as e:
        body = {"statusCode": e.status, "error": e.code, "message": e.message}
        body.update(e.extra)
        return jsonify(body), e.status

    return jsonify({"deleted": song_id}), 200
