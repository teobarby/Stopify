"""
Entry-point del backend Flask.

Usage:
    python main.py             # avvia il server di sviluppo
    flask --app main run       # alternativa con il CLI di Flask
"""

import json

from werkzeug.security import generate_password_hash

from app import create_app
from app.extensions import db
from app.models import Song, User

app = create_app()


# ─── Bootstrap admin ─────────────────────────────────────────────────────────

def _seed_admin():
    """
    Crea l'utente amministratore al primo avvio, leggendo le credenziali da
    config (ADMIN_USERNAME / ADMIN_EMAIL / ADMIN_PASSWORD).

    Se esiste già un utente con quello username o un qualsiasi
    altro admin, non fa nulla. Serve solo a garantire che ci sia sempre
    almeno un admin nel sistema.
    """
    username = app.config.get("ADMIN_USERNAME", "admin")
    email = app.config.get("ADMIN_EMAIL", "admin@stopify.local")
    password = app.config.get("ADMIN_PASSWORD", "admin123")

    # Se esiste già almeno un admin nel sistema, non creare nulla
    if User.query.filter_by(is_admin=True).first() is not None:
        return

    # Se esiste già un utente con quello username, promuovilo ad admin
    existing = User.query.filter(
        db.func.lower(User.username) == username.lower()
    ).first()
    if existing is not None:
        existing.is_admin = True
        db.session.commit()
        print(f"✅ Utente esistente '{username}' promosso ad admin.")
        return

    admin = User(
        username=username,
        email=email.lower(),
        password_hash=generate_password_hash(password),
        is_admin=True,
    )
    db.session.add(admin)
    db.session.commit()
    print(
        f"✅ Admin creato: username='{username}', password='{password}' "
        f"(cambialo via env ADMIN_PASSWORD)."
    )


# ─── Catalogo di seed (testi originali) ──────────────────────────────────────

SEED_CATALOG = [
    {
        "artist": "The Velvet Hours",
        "album": "Late Night Frequencies",
        "title": "Echoes in the Static",
        "duration": 215.0,
        "instrumental": False,
        "synced": [
            (0.0,  "I drove the long road to the city in the rain"),
            (4.6,  "Streetlights bleeding amber through the window pane"),
            (9.2,  "Every empty station playing songs we used to know"),
            (13.8, "The dial keeps spinning and I can't make it slow"),
            (19.5, "Echoes in the static, ghosts inside the wire"),
            (23.8, "Still I hear you calling through the radio fire"),
            (28.3, "Tell me where you go when the morning takes you home"),
            (33.0, "I'm the only signal in a world I left alone"),
            (38.5, "Coffee's getting colder by the dashboard light"),
            (43.0, "Some old paper city dreaming through the night"),
            (47.5, "I would trade tomorrow for a single yesterday"),
            (52.0, "Just to hear you whisper anything you used to say"),
            (57.5, "Echoes in the static, ghosts inside the wire"),
            (62.0, "Still I hear you calling through the radio fire"),
            (66.5, "Tell me where you go when the morning takes you home"),
            (71.0, "I'm the only signal in a world I left alone"),
        ],
    },
    {
        "artist": "Solar Static",
        "album": "Polar Lights",
        "title": "Midnight Drive",
        "duration": 198.0,
        "instrumental": False,
        "synced": [
            (0.0,  "Headlights cutting through a velvet sky"),
            (4.2,  "Highway humming like a lullaby"),
            (8.4,  "You and me and a tank half full"),
            (12.6, "A neon city pulling like a gravity pull"),
            (17.4, "Faster, faster, the engine sings"),
            (21.0, "The freeway grows electric wings"),
            (24.6, "Don't look back at the fading signs"),
            (28.2, "Tonight the world is yours and mine"),
            (33.0, "Stars are falling on the windshield glass"),
            (37.2, "Every mile a piece of plastic past"),
            (41.4, "Roll the windows, let the summer in"),
            (45.6, "The road belongs to anyone who's been"),
            (50.4, "Faster, faster, the engine sings"),
            (54.0, "The freeway grows electric wings"),
            (57.6, "Don't look back at the fading signs"),
            (61.2, "Tonight the world is yours and mine"),
        ],
    },
    {
        "artist": "Marco Vellini",
        "album": "Costa di vetro",
        "title": "Il faro spento",
        "duration": 232.0,
        "instrumental": False,
        "synced": [
            (0.0,  "C'è un faro spento sopra il porto vecchio"),
            (5.0,  "le barche stanche dormono nel sale"),
            (10.0, "e una ragazza accende uno specchio"),
            (15.0, "guardando il mare come un animale"),
            (21.0, "Ho camminato fino all'altra riva"),
            (26.0, "dove le pietre raccontano gli anni"),
            (31.0, "e la mia ombra non era più viva"),
            (36.0, "ma sorrideva come tra i tuoi panni"),
            (42.0, "Resta con me un'altra notte ancora"),
            (47.0, "finché la luna scioglie le finestre"),
            (52.0, "sarò la voce che ti chiama fuori"),
            (57.0, "sarò la mano che ti tiene a destra"),
            (63.0, "Domani il vento porterà altre cose"),
            (68.0, "nuvole bianche, ricordi e farfalle"),
            (73.0, "ma stanotte siamo solo due rose"),
            (78.0, "appese al filo di una stessa valle"),
        ],
    },
    {
        "artist": "Matteo",
        "album": "Pizza Tapes",
        "title": "Inno alla Pizza",
        "duration": 175.0,
        "instrumental": False,
        "synced": [
            (0.0,  "Vita la pizza, evviva la pizza"),
            (3.6,  "la mozzarella che si scioglie liscia"),
            (7.2,  "basilico fresco sopra al pomodoro"),
            (10.8, "forno a legna, questo è il vero oro"),
            (15.6, "Margherita classica o quattro formaggi"),
            (19.2, "diavola piccante, capricci dei saggi"),
            (22.8, "non c'è tristezza che resista al morso"),
            (26.4, "quando la pizza arriva al tuo soccorso"),
            (31.2, "Lunedì pizza, martedì pizza"),
            (34.8, "non si discute, è una vera ricchezza"),
            (38.4, "il sabato sera con tutti gli amici"),
            (42.0, "la pizza ci rende infinitamente felici"),
            (46.8, "Inno alla pizza, regina del mondo"),
            (50.4, "inno alla pizza, sapore profondo"),
            (54.0, "chi ha inventato questo capolavoro"),
            (57.6, "merita gloria, statua e alloro"),
        ],
    },
]


def _seed():
    """Popola il database con dati di esempio (testi originali)."""
    for entry in SEED_CATALOG:
        # Plain lyrics: rebuild from synced lines, raggruppando in strofe
        # da 4 righe ciascuna
        lines = [text for _, text in entry["synced"]]
        verses = []
        for i in range(0, len(lines), 4):
            verses.append("\n".join(lines[i : i + 4]))
        plain_lyrics = "\n\n".join(verses)

        synced_json = json.dumps(
            [{"time": t, "line": text} for t, text in entry["synced"]],
            ensure_ascii=False,
        )

        song = Song(
            title=entry["title"],
            artist_name=entry["artist"],
            album_name=entry["album"],
            lyrics=plain_lyrics,
            synced_lyrics=synced_json,
            duration=entry["duration"],
            instrumental=entry["instrumental"],
            user_id=None,  # brani di seed = anonimi
        )
        db.session.add(song)

    db.session.commit()
    print(f"✅ Seed completato: {len(SEED_CATALOG)} brani caricati.")


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        if Song.query.count() == 0:
            _seed()
        _seed_admin()
    app.run(host="0.0.0.0", port=5000, debug=True)
