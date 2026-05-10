"""
Modelli del dominio Lyrics: Artist, Album, Song.
"""

from datetime import datetime

from app.extensions import db


class Artist(db.Model):
    __tablename__ = "artists"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    songs = db.relationship("Song", backref="artist", lazy=True)
    albums = db.relationship("Album", backref="artist", lazy=True)

    def to_dict(self):
        return {"id": self.id, "name": self.name}


class Album(db.Model):
    __tablename__ = "albums"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(300), nullable=False)
    year = db.Column(db.Integer, nullable=True)
    artist_id = db.Column(db.Integer, db.ForeignKey("artists.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    songs = db.relationship("Song", backref="album", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "year": self.year,
            "artist_id": self.artist_id,
        }


class Song(db.Model):
    __tablename__ = "songs"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(300), nullable=False)
    artist_id = db.Column(db.Integer, db.ForeignKey("artists.id"), nullable=False)
    album_id = db.Column(db.Integer, db.ForeignKey("albums.id"), nullable=True)
    lyrics = db.Column(db.Text, nullable=False)
    # Testo sincronizzato: lista JSON di {"time": 12.5, "line": "testo..."}
    synced_lyrics = db.Column(db.Text, nullable=True)
    # Durata della traccia in secondi (richiesta dalla spec LRCLIB)
    duration = db.Column(db.Float, nullable=True)
    # Brano strumentale (nessun testo cantato)
    instrumental = db.Column(db.Boolean, default=False, nullable=False)
    # Utente che ha pubblicato (nullable: pubblicazione anonima via PoW)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    submitter = db.relationship("User", foreign_keys=[user_id])

    def to_dict(self, full: bool = False):
        data = {
            "id": self.id,
            "title": self.title,
            "artist": self.artist.name if self.artist else None,
            "artist_id": self.artist_id,
            "album": self.album.title if self.album else None,
            "album_id": self.album_id,
            "duration": self.duration,
            "instrumental": bool(self.instrumental),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if full:
            data["lyrics"] = self.lyrics
            data["synced_lyrics"] = self.synced_lyrics
        return data

    # ── LRCLIB-shaped serialization ───────────────────────────────────────────
    def to_lrclib(self) -> dict:
        """Return the song in LRCLIB API shape (camelCase, LRC synced format)."""
        from app.utils.lrc import json_to_lrc

        return {
            "id": self.id,
            "trackName": self.title,
            "artistName": self.artist.name if self.artist else None,
            "albumName": self.album.title if self.album else None,
            "duration": self.duration,
            "instrumental": bool(self.instrumental),
            "plainLyrics": self.lyrics or "",
            "syncedLyrics": json_to_lrc(self.synced_lyrics),
            "submittedBy": self.submitter.username if self.submitter else None,
        }
