from app.errors import AppError
from app.extensions import db
from app.models.lyrics import Song
from app.services.crypto_service import difficulty_to_target, verify_pow
from app.utils.lrc import lrc_to_json

def search_songs(q: str = "", title: str = "", artist: str = "", album: str = ""):
    query = Song.query
    if q:
        pattern = f"%{q}%"
        query = query.filter(db.or_(Song.title.ilike(pattern), Song.artist_name.ilike(pattern)))
    if title:
        query = query.filter(Song.title.ilike(f"%{title}%"))
    if artist:
        query = query.filter(Song.artist_name.ilike(f"%{artist}%"))
    if album:
        query = query.filter(Song.album_name.ilike(f"%{album}%"))
    return query.order_by(Song.title).limit(50).all()


def explore_songs(page: int = 1, limit: int = 20, sort: str = "recent"):
    limit = min(limit, 50)
    query = Song.query
    if sort == "title":
        query = query.order_by(Song.title)
    elif sort == "artist":
        query = query.order_by(Song.artist_name)
    else:
        query = query.order_by(Song.created_at.desc())
    return query.paginate(page=page, per_page=limit, error_out=False)


def get_by_signature(
    track_name: str,
    artist_name: str,
    album_name: str | None = None,
    duration: float | None = None,
    duration_tolerance: float = 2.0,
) -> Song | None:
    if not track_name or not artist_name:
        return None

    q = Song.query.filter(
        Song.title.ilike(track_name.strip()),
        Song.artist_name.ilike(artist_name.strip()),
    )
    if album_name:
        q = q.filter(Song.album_name.ilike(album_name.strip()))

    candidates = q.all()
    if not candidates:
        return None
    if duration is None:
        return candidates[0]

    def _delta(s: Song) -> float:
        return abs((s.duration or 0) - duration)

    best = min(candidates, key=_delta)
    return best if best.duration is None or _delta(best) <= duration_tolerance else None


def _parse_song_payload(payload: dict) -> dict:
    if not payload:
        raise AppError("Body JSON non valido o assente", 400)

    missing = [f for f in ["trackName", "artistName", "plainLyrics"] if not str(payload.get(f, "")).strip()]
    if missing:
        raise AppError(f"Campi mancanti: {', '.join(missing)}", 422)

    duration = payload.get("duration")
    try:
        duration = float(duration) if duration is not None else None
    except (TypeError, ValueError):
        duration = None

    synced_lrc = payload.get("syncedLyrics")
    return {
        "title": str(payload["trackName"]).strip(),
        "artist_name": str(payload["artistName"]).strip(),
        "album_name": (str(payload.get("albumName", "") or "").strip() or None),
        "lyrics": str(payload["plainLyrics"]).strip(),
        "synced_json": lrc_to_json(synced_lrc) if synced_lrc else None,
        "duration": duration,
        "instrumental": bool(payload.get("instrumental", False)),
    }


def publish_song_lrclib(
    payload: dict,
    prefix: str | None = None,
    nonce: str | None = None,
    user_id: int | None = None,
) -> Song:
    fields = _parse_song_payload(payload)

    if user_id is None:
        if not prefix or not nonce:
            raise AppError("Autenticazione richiesta: JWT o X-Publish-Token", 401)

        target = difficulty_to_target(4)
        if not verify_pow(prefix, nonce, target):
            raise AppError("Proof of Work non superata", 403)

    song = Song(
        title=fields["title"],
        artist_name=fields["artist_name"],
        album_name=fields["album_name"],
        lyrics=fields["lyrics"],
        synced_lyrics=fields["synced_json"],
        duration=fields["duration"],
        instrumental=fields["instrumental"],
        user_id=user_id,
    )
    db.session.add(song)
    db.session.commit()
    return song


def update_song(song_id: int, payload: dict, user_id: int, is_admin: bool = False) -> Song:
    song = db.session.get(Song, song_id)
    if song is None:
        raise AppError("Brano non trovato", 404)

    if not is_admin:
        if song.user_id is None:
            raise AppError("Questo brano è anonimo e non può essere modificato", 403)
        if song.user_id != user_id:
            raise AppError("Non sei l'autore di questo brano", 403)

    fields = _parse_song_payload(payload)

    song.title = fields["title"]
    song.artist_name = fields["artist_name"]
    song.album_name = fields["album_name"]
    song.lyrics = fields["lyrics"]
    song.synced_lyrics = fields["synced_json"]
    song.duration = fields["duration"]
    song.instrumental = fields["instrumental"]

    db.session.commit()
    return song


def delete_song(song_id: int, user_id: int, is_admin: bool = False) -> None:
    song = db.session.get(Song, song_id)
    if song is None:
        raise AppError("Brano non trovato", 404)

    if not is_admin:
        if song.user_id is None:
            raise AppError("Questo brano è anonimo e non può essere cancellato", 403)
        if song.user_id != user_id:
            raise AppError("Non sei l'autore di questo brano", 403)

    db.session.delete(song)
    db.session.commit()


def list_all_songs(q: str = "", only_anonymous: bool = False, user_id: int | None = None):
    query = Song.query
    if q:
        pattern = f"%{q}%"
        query = query.filter(db.or_(Song.title.ilike(pattern), Song.artist_name.ilike(pattern)))
    if only_anonymous:
        query = query.filter(Song.user_id.is_(None))
    elif user_id is not None:
        query = query.filter(Song.user_id == user_id)
    return query.order_by(Song.created_at.desc()).all()
