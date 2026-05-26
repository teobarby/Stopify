"""
test_endpoints.py
Test degli endpoint LRCLIB: /api/get, /api/get-cached, /api/search,
/api/request-challenge, /api/publish (via PoW e via JWT).

Usage:
    DATABASE_URL="sqlite:////tmp/lyrics_test.db" python test_endpoints.py
"""

import hashlib
import json
import sys

from app import create_app
from app.extensions import db

app = create_app()
client = app.test_client()

PASS = "\033[92m✓\033[0m"
FAIL = "\033[91m✗\033[0m"
errors = 0


def check(label: str, condition: bool, detail: str = "") -> None:
    global errors
    if condition:
        print(f"  {PASS} {label}")
    else:
        errors += 1
        msg = f"  {FAIL} {label}"
        if detail:
            msg += f" — {detail}"
        print(msg)


def solve_pow(prefix: str, target: str) -> str:
    nonce = 0
    while True:
        h = hashlib.sha256(f"{prefix}{nonce}".encode()).hexdigest()
        if h <= target:
            return str(nonce)
        nonce += 1


# ─── Setup ────────────────────────────────────────────────────────────────────

with app.app_context():
    db.create_all()
    # Seed un brano di test
    from app.models.lyrics import Artist, Album, Song

    artist = Artist(name="Test Artist")
    db.session.add(artist)
    db.session.flush()
    album = Album(title="Test Album", year=2024, artist_id=artist.id)
    db.session.add(album)
    db.session.flush()
    song = Song(
        title="Test Song",
        artist_id=artist.id,
        album_id=album.id,
        lyrics="Line one\nLine two",
        duration=120.0,
        instrumental=False,
    )
    db.session.add(song)
    db.session.commit()
    SONG_ID = song.id

print("\n── GET /api/get ─────────────────────────────────────────────────────")
r = client.get("/api/get?track_name=Test+Song&artist_name=Test+Artist")
check("status 200", r.status_code == 200, str(r.status_code))
data = r.get_json()
check("trackName corretto", data.get("trackName") == "Test Song", str(data))
check("artistName corretto", data.get("artistName") == "Test Artist")

r = client.get("/api/get")
check("400 senza parametri", r.status_code == 400)

r = client.get("/api/get?track_name=Inesistente&artist_name=Nessuno")
check("404 brano mancante", r.status_code == 404)

print("\n── GET /api/get-cached ──────────────────────────────────────────────")
r = client.get("/api/get-cached?track_name=Test+Song&artist_name=Test+Artist")
check("status 200 (identico a /api/get)", r.status_code == 200)

print("\n── GET /api/get/<id> ────────────────────────────────────────────────")
r = client.get(f"/api/get/{SONG_ID}")
check("status 200", r.status_code == 200)
check("id corretto", r.get_json().get("id") == SONG_ID)

r = client.get("/api/get/999999")
check("404 id inesistente", r.status_code == 404)

print("\n── GET /api/search ──────────────────────────────────────────────────")
r = client.get("/api/search?q=test")
check("status 200", r.status_code == 200)
check("lista non vuota", len(r.get_json()) > 0)

r = client.get("/api/search?track_name=Test+Song")
check("ricerca per track_name", r.status_code == 200)

r = client.get("/api/search")
check("400 senza parametri", r.status_code == 400)

print("\n── POST /api/request-challenge ──────────────────────────────────────")
r = client.post("/api/request-challenge")
check("status 200", r.status_code == 200)
ch = r.get_json()
check("campo prefix presente", "prefix" in ch)
check("campo target presente", "target" in ch)
check("target 64 char hex", len(ch.get("target", "")) == 64)

print("\n── POST /api/publish (PoW) ──────────────────────────────────────────")
r = client.post("/api/request-challenge")
ch = r.get_json()
nonce = solve_pow(ch["prefix"], ch["target"])
payload = {
    "trackName": "PoW Song",
    "artistName": "PoW Artist",
    "plainLyrics": "First line\nSecond line",
}
r = client.post(
    "/api/publish",
    json=payload,
    headers={"X-Publish-Token": f"{ch['prefix']}:{nonce}"},
)
check("status 201", r.status_code == 201, str(r.status_code))
pub = r.get_json()
check("trackName corretto", pub.get("trackName") == "PoW Song")
check("submittedBy null (anonimo)", pub.get("submittedBy") is None)

# Riutilizzo dello stesso token → rifiuto
r2 = client.post(
    "/api/publish",
    json=payload,
    headers={"X-Publish-Token": f"{ch['prefix']}:{nonce}"},
)
check("403 token PoW riutilizzato", r2.status_code == 403, str(r2.status_code))

print("\n── POST /api/publish (senza auth) ───────────────────────────────────")
r = client.post("/api/publish", json=payload)
check("401 senza auth né PoW", r.status_code == 401, str(r.status_code))

print("\n── POST /api/publish (JWT) ──────────────────────────────────────────")
# Crea utente + login
from werkzeug.security import generate_password_hash
from app.models.user import User

with app.app_context():
    u = User(
        username="testpub",
        email="testpub@test.com",
        password_hash=generate_password_hash("Password1"),
    )
    db.session.add(u)
    db.session.commit()

lr = client.post(
    "/auth/login", json={"usernameOrEmail": "testpub", "password": "Password1"}
)
check("login ok", lr.status_code == 200, str(lr.status_code))
access = lr.get_json().get("accessToken", "")

r = client.post(
    "/api/publish",
    json={**payload, "trackName": "JWT Song"},
    headers={"Authorization": f"Bearer {access}"},
)
check("status 201 con JWT", r.status_code == 201, str(r.status_code))
check("submittedBy valorizzato", r.get_json().get("submittedBy") == "testpub")

# ─── Risultato ────────────────────────────────────────────────────────────────

print()
if errors:
    print(f"\033[91m{errors} test falliti.\033[0m")
    sys.exit(1)
else:
    print("\033[92mTutti i test superati.\033[0m")
