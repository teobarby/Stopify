from datetime import datetime, timezone

from app.extensions import db


class Artist(db.Model):
    __tablename__ = "artists"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, unique=True)

    songs = db.relationship("Song", backref="artist", lazy=True)
    albums = db.relationship("Album", backref="artist", lazy=True)


class Album(db.Model):
    __tablename__ = "albums"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(300), nullable=False)
    artist_id = db.Column(db.Integer, db.ForeignKey("artists.id"), nullable=False)

    songs = db.relationship("Song", backref="album", lazy=True)


class Song(db.Model):
    __tablename__ = "songs"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(300), nullable=False)
    artist_id = db.Column(db.Integer, db.ForeignKey("artists.id"), nullable=False)
    album_id = db.Column(db.Integer, db.ForeignKey("albums.id"), nullable=True)
    lyrics = db.Column(db.Text, nullable=False)
    synced_lyrics = db.Column(db.Text, nullable=True)
    duration = db.Column(db.Float, nullable=True)
    instrumental = db.Column(db.Boolean, default=False, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    submitter = db.relationship("User", foreign_keys=[user_id])

    def to_lrclib(self) -> dict:
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
