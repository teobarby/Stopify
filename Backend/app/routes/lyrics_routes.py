"""
Route ausiliarie usate dalla mobile app:
ricerca, esplora paginata, dettaglio brano, artisti, album, health.

La pubblicazione vive ora solo su POST /api/publish (lrclib_routes.py).
"""

from datetime import datetime

from flask import Blueprint, jsonify, request

from app.models.lyrics import Album, Artist, Song
from app.services.lyrics_service import explore_songs, search_songs

lyrics_bp = Blueprint("lyrics", __name__)


# ─── Health ──────────────────────────────────────────────────────────────────

@lyrics_bp.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "timestamp": datetime.utcnow().isoformat()})


# ─── Artisti ─────────────────────────────────────────────────────────────────

@lyrics_bp.route("/artists", methods=["GET"])
def get_artists():
    artists = Artist.query.order_by(Artist.name).all()
    return jsonify([a.to_dict() for a in artists]), 200


@lyrics_bp.route("/artists/<int:artist_id>", methods=["GET"])
def get_artist(artist_id):
    artist = Artist.query.get_or_404(artist_id)
    data = artist.to_dict()
    data["songs"] = [s.to_dict() for s in artist.songs]
    return jsonify(data), 200


# ─── Album ───────────────────────────────────────────────────────────────────

@lyrics_bp.route("/albums", methods=["GET"])
def get_albums():
    artist_id = request.args.get("artist_id", type=int)
    q = Album.query
    if artist_id:
        q = q.filter_by(artist_id=artist_id)
    albums = q.order_by(Album.title).all()
    return jsonify([a.to_dict() for a in albums]), 200


# ─── Ricerca ─────────────────────────────────────────────────────────────────

@lyrics_bp.route("/search", methods=["GET"])
def search():
    q = request.args.get("q", "").strip()
    title = request.args.get("title", "").strip()
    artist = request.args.get("artist", "").strip()
    album = request.args.get("album", "").strip()

    songs = search_songs(q=q, title=title, artist=artist, album=album)
    return jsonify({"results": [s.to_dict() for s in songs], "count": len(songs)}), 200


# ─── Singolo brano ───────────────────────────────────────────────────────────

@lyrics_bp.route("/songs/<int:song_id>", methods=["GET"])
def get_song(song_id):
    song = Song.query.get_or_404(song_id)
    return jsonify(song.to_dict(full=True)), 200


# ─── Esplora (catalogo paginato) ─────────────────────────────────────────────

@lyrics_bp.route("/explore", methods=["GET"])
def explore():
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 20, type=int)
    sort = request.args.get("sort", "recent")

    pagination = explore_songs(page=page, limit=limit, sort=sort)

    return jsonify({
        "songs": [s.to_dict() for s in pagination.items],
        "total": pagination.total,
        "page": page,
        "pages": pagination.pages,
        "has_next": pagination.has_next,
        "has_prev": pagination.has_prev,
    }), 200