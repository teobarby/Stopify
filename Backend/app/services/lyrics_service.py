"""
Servizio di business logic per le lyrics:
ricerca, esplorazione, pubblicazione (con PoW), endpoint LRCLIB.
"""

import json
from typing import Optional

from app.extensions import db
from app.models.lyrics import Artist, Album, Song
from app.models.challenge import PowChallenge
from app.services.crypto_service import (
    difficulty_to_target,
    verify_pow,
)
from app.utils.lrc import lrc_to_json


# ─── Ricerca ─────────────────────────────────────────────────────────────────

def search_songs(q: str = "", title: str = "", artist: str = "", album: str = ""):
    query = (
        Song.query
        .join(Artist, Song.artist_id == Artist.id)
        .outerjoin(Album, Song.album_id == Album.id)
    )

    if q:
        pattern = f"%{q}%"
        query = query.filter(
            db.or_(Song.title.ilike(pattern), Artist.name.ilike(pattern))
        )
    if title:
        query = query.filter(Song.title.ilike(f"%{title}%"))
    if artist:
        query = query.filter(Artist.name.ilike(f"%{artist}%"))
    if album:
        query = query.filter(Album.title.ilike(f"%{album}%"))

    return query.order_by(Song.title).limit(50).all()


# ─── Esplora ─────────────────────────────────────────────────────────────────

def explore_songs(page: int = 1, limit: int = 20, sort: str = "recent"):
    limit = min(limit, 50)

    query = Song.query.join(Artist, Song.artist_id == Artist.id)

    if sort == "title":
        query = query.order_by(Song.title)
    elif sort == "artist":
        query = query.order_by(Artist.name)
    else:
        query = query.order_by(Song.created_at.desc())

    return query.paginate(page=page, per_page=limit, error_out=False)


# ─── Pubblicazione (con PoW) ─────────────────────────────────────────────────

class PublishError(Exception):
    """Errore durante la pubblicazione: include status HTTP suggerito."""

    def __init__(self, message: str, status: int = 400, extra: Optional[dict] = None):
        super().__init__(message)
        self.message = message
        self.status = status
        self.extra = extra or {}


# ─── Limiti dimensionali sui campi del payload ───────────────────────────────
#
# Difesa anti-DoS: blocca payload abnormi senza dover affidarsi solo al
# limite globale `MAX_CONTENT_LENGTH`. I valori sono volutamente generosi
# per accettare brani lunghi (es. opera lirica) ma fermare upload sproporzionati.

MAX_TITLE_LEN = 300        # allineato allo schema DB
MAX_ARTIST_LEN = 200
MAX_ALBUM_LEN = 300
MAX_PLAIN_LYRICS_LEN = 50_000     # ~50 KB di testo puro
MAX_SYNCED_LYRICS_LEN = 100_000   # ~100 KB (timestamp aggiungono peso)
MAX_DURATION_SEC = 7_200          # 2 ore (oltre è sospetto)
MIN_DURATION_SEC = 0


def _validate_payload_lengths(payload: dict) -> None:
    """
    Solleva PublishError(422) se uno dei campi di lunghezza variabile
    eccede i limiti. Da chiamare DOPO il check dei campi obbligatori.
    """
    checks = [
        ("trackName",     MAX_TITLE_LEN,         payload.get("trackName")),
        ("artistName",    MAX_ARTIST_LEN,        payload.get("artistName")),
        ("albumName",     MAX_ALBUM_LEN,         payload.get("albumName")),
        ("plainLyrics",   MAX_PLAIN_LYRICS_LEN,  payload.get("plainLyrics")),
        ("syncedLyrics",  MAX_SYNCED_LYRICS_LEN, payload.get("syncedLyrics")),
    ]
    for field, limit, value in checks:
        if value is None:
            continue
        if not isinstance(value, str):
            raise PublishError(
                f"Il campo '{field}' deve essere una stringa",
                422,
            )
        if len(value) > limit:
            raise PublishError(
                f"Il campo '{field}' eccede la lunghezza massima "
                f"({len(value)} > {limit} caratteri)",
                422,
                {"field": field, "max": limit, "got": len(value)},
            )

    # Durata: accetta anche string-numeric (es. "180.5") e numeri.
    duration = payload.get("duration")
    if duration is not None and duration != "":
        try:
            d = float(duration)
        except (TypeError, ValueError):
            raise PublishError(
                "Il campo 'duration' deve essere numerico",
                422,
            )
        if d < MIN_DURATION_SEC or d > MAX_DURATION_SEC:
            raise PublishError(
                f"La durata deve essere compresa tra {MIN_DURATION_SEC} "
                f"e {MAX_DURATION_SEC} secondi",
                422,
                {"min": MIN_DURATION_SEC, "max": MAX_DURATION_SEC},
            )


# ─── LRCLIB-style: ricerca per signature ─────────────────────────────────────

def get_by_signature(
    track_name: str,
    artist_name: str,
    album_name: Optional[str] = None,
    duration: Optional[float] = None,
    duration_tolerance: float = 2.0,
) -> Optional[Song]:
    """
    Cerca un brano matchando track + artist (case-insensitive). Se sono
    forniti anche `album` e/o `duration`, vengono usati come ulteriore filtro.
    Per duration accetta una tolleranza di ± `duration_tolerance` secondi.
    Restituisce il brano più simile o None.
    """
    if not track_name or not artist_name:
        return None

    q = (
        Song.query
        .join(Artist, Song.artist_id == Artist.id)
        .outerjoin(Album, Song.album_id == Album.id)
        .filter(
            Song.title.ilike(track_name.strip()),
            Artist.name.ilike(artist_name.strip()),
        )
    )

    if album_name:
        q = q.filter(Album.title.ilike(album_name.strip()))

    candidates = q.all()
    if not candidates:
        return None

    if duration is None:
        return candidates[0]

    # Pick the candidate with closest duration (within tolerance)
    def _delta(s: Song) -> float:
        return abs((s.duration or 0) - duration)

    best = min(candidates, key=_delta)
    if best.duration is None or _delta(best) <= duration_tolerance:
        return best
    return None


# ─── LRCLIB-style: publish ───────────────────────────────────────────────────

def publish_song_lrclib(
    payload: dict,
    prefix: str | None = None,
    nonce: str | None = None,
    user_id: int | None = None,
) -> Song:
    """
    Pubblica un brano nel formato LRCLIB.

    Accetta uno tra:
      - autenticazione utente (`user_id` non None) → publish attribuito
      - PoW (`prefix` + `nonce`)                    → publish anonimo

    Se entrambi sono assenti, solleva PublishError 401.
    """
    if not payload:
        raise PublishError("Body JSON non valido o assente", 400)

    required = ["trackName", "artistName", "plainLyrics"]
    missing = [f for f in required if not str(payload.get(f, "")).strip()]
    if missing:
        raise PublishError(f"Campi mancanti: {', '.join(missing)}", 422)

    _validate_payload_lengths(payload)

    # ── Autorizzazione: JWT _o_ PoW ──────────────────────────────────────────
    if user_id is None:
        if not prefix or not nonce:
            raise PublishError(
                "Autenticazione richiesta: fornisci un Bearer token "
                "oppure un X-Publish-Token (prefix:nonce)",
                401,
            )

        challenge = PowChallenge.query.filter_by(token=prefix, used=False).first()
        if not challenge:
            raise PublishError("Token PoW non valido o già utilizzato", 403)

        target = difficulty_to_target(challenge.difficulty)
        if not verify_pow(prefix, nonce, target):
            raise PublishError(
                "Proof of Work non superata",
                403,
                {"target": target},
            )

        # ── Marca atomicamente la challenge come usata ──────────────────────
        # UPDATE ... WHERE used=False garantisce che solo UNA richiesta
        # concorrente con lo stesso prefix:nonce passi qui (rowcount = 1).
        # Tutte le altre vedono rowcount = 0 e vengono rifiutate, evitando
        # double-publish in race condition.
        result = db.session.execute(
            db.update(PowChallenge)
            .where(
                PowChallenge.token == prefix,
                PowChallenge.used == False,  # noqa: E712 — SQL boolean
            )
            .values(used=True)
        )
        if result.rowcount != 1:
            raise PublishError(
                "Token PoW già consumato da un'altra richiesta concorrente",
                409,
            )
        db.session.flush()

    # ── Risoluzione/creazione artist & album ────────────────────────────────
    artist_name = str(payload["artistName"]).strip()
    artist = Artist.query.filter(Artist.name.ilike(artist_name)).first()
    if not artist:
        artist = Artist(name=artist_name)
        db.session.add(artist)
        db.session.flush()

    album = None
    album_name = str(payload.get("albumName", "") or "").strip()
    if album_name:
        album = Album.query.filter(
            Album.title.ilike(album_name),
            Album.artist_id == artist.id,
        ).first()
        if not album:
            album = Album(title=album_name, artist_id=artist.id)
            db.session.add(album)
            db.session.flush()

    # ── Creazione brano ─────────────────────────────────────────────────────
    duration = payload.get("duration")
    try:
        duration = float(duration) if duration is not None else None
    except (TypeError, ValueError):
        duration = None

    synced_lrc = payload.get("syncedLyrics")
    synced_json = lrc_to_json(synced_lrc) if synced_lrc else None

    instrumental = bool(payload.get("instrumental", False))

    song = Song(
        title=str(payload["trackName"]).strip(),
        artist_id=artist.id,
        album_id=album.id if album else None,
        lyrics=str(payload["plainLyrics"]).strip(),
        synced_lyrics=synced_json,
        duration=duration,
        instrumental=instrumental,
        user_id=user_id,
    )
    db.session.add(song)
    db.session.commit()
    return song


# ─── LRCLIB-style: gestione brani propri (update / delete) ───────────────────

def list_user_songs(user_id: int):
    """Ritorna l'elenco dei brani pubblicati dall'utente, dal più recente."""
    return (
        Song.query
        .filter(Song.user_id == user_id)
        .order_by(Song.created_at.desc())
        .all()
    )


def _resolve_artist_album(artist_name: str, album_name: str | None):
    """Crea o recupera Artist e Album. Restituisce (artist, album_or_None)."""
    artist = Artist.query.filter(Artist.name.ilike(artist_name)).first()
    if not artist:
        artist = Artist(name=artist_name)
        db.session.add(artist)
        db.session.flush()

    album = None
    if album_name:
        album = Album.query.filter(
            Album.title.ilike(album_name),
            Album.artist_id == artist.id,
        ).first()
        if not album:
            album = Album(title=album_name, artist_id=artist.id)
            db.session.add(album)
            db.session.flush()

    return artist, album


def update_song(
    song_id: int,
    payload: dict,
    user_id: int,
    is_admin: bool = False,
) -> Song:
    """
    Aggiorna un brano esistente.
    Solo il `submittedBy` può modificarlo, salvo che l'utente sia admin
    (in tal caso il check di proprietà viene bypassato e si può modificare
    anche un brano anonimo).

    Solleva PublishError con status:
      404 - brano inesistente
      403 - brano anonimo o non di proprietà dell'utente (non-admin)
      400 - body malformato
      422 - campi obbligatori mancanti
    """
    song = Song.query.get(song_id)
    if song is None:
        raise PublishError("Brano non trovato", 404)

    if not is_admin:
        if song.user_id is None:
            raise PublishError(
                "Questo brano è anonimo e non può essere modificato",
                403,
            )

        if song.user_id != user_id:
            raise PublishError(
                "Non sei l'autore di questo brano",
                403,
            )

    if not payload:
        raise PublishError("Body JSON non valido o assente", 400)

    required = ["trackName", "artistName", "plainLyrics"]
    missing = [f for f in required if not str(payload.get(f, "")).strip()]
    if missing:
        raise PublishError(f"Campi mancanti: {', '.join(missing)}", 422)

    _validate_payload_lengths(payload)

    artist, album = _resolve_artist_album(
        artist_name=str(payload["artistName"]).strip(),
        album_name=(str(payload.get("albumName", "") or "").strip() or None),
    )

    # Durata
    duration = payload.get("duration")
    try:
        duration = float(duration) if duration is not None else None
    except (TypeError, ValueError):
        duration = None

    # Synced lyrics (LRC → JSON)
    synced_lrc = payload.get("syncedLyrics")
    synced_json = lrc_to_json(synced_lrc) if synced_lrc else None

    song.title = str(payload["trackName"]).strip()
    song.artist_id = artist.id
    song.album_id = album.id if album else None
    song.lyrics = str(payload["plainLyrics"]).strip()
    song.synced_lyrics = synced_json
    song.duration = duration
    song.instrumental = bool(payload.get("instrumental", False))

    db.session.commit()
    return song


def delete_song(
    song_id: int,
    user_id: int,
    is_admin: bool = False,
) -> None:
    """
    Cancella un brano.
    Solo il `submittedBy` può cancellarlo, salvo che l'utente sia admin
    (in tal caso il check di proprietà viene bypassato e si può cancellare
    anche un brano anonimo).
    Solleva PublishError 404/403 in caso di errore.
    """
    song = Song.query.get(song_id)
    if song is None:
        raise PublishError("Brano non trovato", 404)

    if not is_admin:
        if song.user_id is None:
            raise PublishError(
                "Questo brano è anonimo e non può essere cancellato",
                403,
            )

        if song.user_id != user_id:
            raise PublishError("Non sei l'autore di questo brano", 403)

    db.session.delete(song)
    db.session.commit()


# ─── Admin: vista completa del catalogo ──────────────────────────────────────

def list_all_songs(q: str = "", only_anonymous: bool = False, user_id: int | None = None):
    """
    Ritorna tutti i brani del catalogo (incluso quelli anonimi).

    Filtri opzionali:
      q              ricerca su titolo o nome artista (LIKE)
      only_anonymous se True ritorna solo brani con user_id=NULL
      user_id        se non None filtra per autore specifico
    """
    query = (
        Song.query
        .join(Artist, Song.artist_id == Artist.id)
        .outerjoin(Album, Song.album_id == Album.id)
    )

    if q:
        pattern = f"%{q}%"
        query = query.filter(
            db.or_(Song.title.ilike(pattern), Artist.name.ilike(pattern))
        )

    if only_anonymous:
        query = query.filter(Song.user_id.is_(None))
    elif user_id is not None:
        query = query.filter(Song.user_id == user_id)

    return query.order_by(Song.created_at.desc()).all()
