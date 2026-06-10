from datetime import datetime, timezone

from app.extensions import db


class Song(db.Model):
    __tablename__ = "songs"
l
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(300), nullable=False)
    artist_name = db.Column(db.String(200), nullable=False)
    album_name = db.Column(db.String(300), nullable=True)
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
            "artistName": self.artist_name,
            "albumName": self.album_name,
            "duration": self.duration,
            "instrumental": bool(self.instrumental),
            "plainLyrics": self.lyrics or "",
            "syncedLyrics": json_to_lrc(self.synced_lyrics),
            "submittedBy": self.submitter.username if self.submitter else None,
        }
