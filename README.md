# Stopify

Sistema per la raccolta e consultazione di **lyrics musicali** (testi piani e
sincronizzati) associati a brani di qualsiasi artista. Il backend espone una
API REST compatibile con la specifica [LRCLIB](https://lrclib.net/docs);
l'app mobile permette di esplorare il catalogo, leggere i testi sincronizzati
con timestamp e contribuire pubblicandone di nuovi.

> Progetto per il corso di **Architettura, reti e sicurezza** — A.A. 2025/2026

---

## Indice

1. [Panoramica](#panoramica)
2. [Stack tecnologico](#stack-tecnologico)
3. [Architettura](#architettura)
4. [Setup e avvio](#setup-e-avvio)
5. [API REST](#api-rest)
6. [Autenticazione e Proof of Work](#autenticazione-e-proof-of-work)
7. [Schema del database](#schema-del-database)
8. [Struttura del repository](#struttura-del-repository)
9. [Test](#test)
10. [Sicurezza](#sicurezza)
11. [Roadmap / future work](#roadmap--future-work)

---

## Panoramica

Stopify è composto da due componenti:

- **Backend Flask** (`Backend/`) — API REST + persistenza SQLite
- **App Mobile Expo / React Native** (`MobileApp/`) — client iOS / Android / Web

Il backend implementa **tutti gli endpoint LRCLIB richiesti** dalla traccia
del progetto:

| Funzionalità | Endpoint | Metodo |
|---|---|---|
| Lookup per signature | `/api/get` | GET |
| Lookup per signature (cache only) | `/api/get-cached` | GET |
| Lookup per ID | `/api/get/<id>` | GET |
| Ricerca | `/api/search` | GET |
| Pubblicazione | `/api/publish` | POST |
| Richiesta challenge PoW | `/api/request-challenge` | POST |

In aggiunta sono implementati: registrazione/login utenti con **JWT**
(access + refresh token), pubblicazione attribuita all'utente loggato,
endpoint ausiliari usati dall'app mobile (`/search`, `/songs/<id>`,
`/explore`, `/artists`, `/albums`, `/health`).

---

## Stack tecnologico

### Backend

- **Python 3.10+**
- **Flask 3.1** + **Flask-SQLAlchemy 3.1** — REST framework + ORM
- **Flask-JWT-Extended 4.7** — JWT authentication
- **Flask-CORS 6.0** — gestione CORS
- **werkzeug.security** — hashing PBKDF2-SHA256 delle password
- **SQLite** — DB embedded (file `lyrics.db`)
- **Flask-Migrate / Alembic** — opzionale, attualmente le migrazioni sono
  gestite con uno script idempotente (`migrate.py`)

### Mobile

- **React Native 0.81** + **Expo SDK 54**
- **expo-router 6** — file-based routing
- **expo-linear-gradient**, **expo-blur** — UI moderna con gradienti e blur
- **expo-secure-store** (opzionale) — persistenza sicura del JWT su Keychain
  iOS / Keystore Android
- **TypeScript** end-to-end

---

## Architettura

```
┌────────────────────┐         HTTPS / HTTP          ┌────────────────────┐
│   Mobile App       │◄─────────────────────────────►│   Flask Backend    │
│   (Expo / RN)      │       JSON over REST          │   (port 5000)      │
└────────────────────┘                               └─────────┬──────────┘
                                                               │
                                                          SQLAlchemy ORM
                                                               │
                                                     ┌─────────▼──────────┐
                                                     │  SQLite (file DB)  │
                                                     │   lyrics.db        │
                                                     └────────────────────┘
```

Il backend è organizzato a **strati** secondo il pattern
*Routes → Services → Models*:

```
app/
├── routes/      ← entrypoint HTTP, validazione payload, formattazione risposta
├── services/    ← business logic, transazioni, eccezioni di dominio
├── models/      ← SQLAlchemy ORM models
└── utils/       ← helper trasversali (LRC encoder, security)
```

Questa separazione permette di testare la logica di business senza dover
montare una request Flask, e isola i dettagli di trasporto dal dominio.

---

## Setup e avvio

### Prerequisiti

- Python ≥ 3.10
- Node.js ≥ 18
- npm o yarn

### Backend

```bash
cd Backend

# 1. Virtual environment
python3 -m venv ../venv
source ../venv/bin/activate

# 2. Dipendenze
pip install -r requirements.txt

# 3. Migrazione idempotente del DB (aggiunge colonne nuove se necessario)
python migrate.py

# 4. Avvio del server di sviluppo
python main.py
```

Il server gira di default su `http://0.0.0.0:5000`. Al primo avvio, se il DB
è vuoto, viene popolato automaticamente con un **catalogo di esempio** di 4
brani originali (testi inventati per il progetto).

#### Variabili d'ambiente (opzionali)

```bash
export DATABASE_URL="sqlite:////path/assoluto/al/db.sqlite"  # default: lyrics.db nel cwd
export JWT_SECRET_KEY="cambiami-in-produzione"               # default: 'super-secret-key' (insicuro)
export SECRET_KEY="cambiami-in-produzione"                   # default: 'change-me-in-production'
```

In produzione **JWT_SECRET_KEY e SECRET_KEY vanno obbligatoriamente
configurate via env**: i fallback hard-coded sono solo per sviluppo locale.

### Mobile App

```bash
cd MobileApp

# 1. Installa dipendenze
npm install

# 2. (Opzionale) Persistenza sicura del JWT su iOS/Android
npx expo install expo-secure-store

# 3. Avvio Metro + scelta della piattaforma
npx expo start
```

> ⚠️ **Configurazione `BASE_URL`**: il file `MobileApp/src/api.ts` punta a
> `http://192.168.178.114:5000` (IP della macchina di sviluppo). Sostituire
> con l'IP della propria macchina locale per testare con un device fisico.

---

## API REST

Tutte le risposte sono JSON con codifica UTF-8. Gli errori seguono lo schema
LRCLIB:

```json
{
  "statusCode": 404,
  "error": "TrackNotFoundError",
  "message": "Lyrics non trovate"
}
```

### Endpoint compatibili LRCLIB (`/api/*`)

#### `GET /api/get`

Cerca lyrics per signature (titolo + artista + opzionalmente album e durata).

**Query parameters:**
- `track_name` — obbligatorio
- `artist_name` — obbligatorio
- `album_name` — opzionale
- `duration` — opzionale (secondi, tolleranza ±2s)

**Risposta 200:**
```json
{
  "id": 2,
  "trackName": "Midnight Drive",
  "artistName": "Solar Static",
  "albumName": "Polar Lights",
  "duration": 198.0,
  "instrumental": false,
  "plainLyrics": "...",
  "syncedLyrics": "[00:00.00] ...\n[00:04.20] ...",
  "submittedBy": null
}
```

**Esempio:**
```bash
curl "http://localhost:5000/api/get?track_name=Midnight+Drive&artist_name=Solar+Static&duration=198"
```

#### `GET /api/get-cached`

Identico a `/api/get` ma senza fallback su sorgenti esterne. Nella nostra
implementazione locale i due endpoint coincidono, perché il DB locale
*è* la cache.

#### `GET /api/get/<id>`

Lookup diretto per ID univoco LRCLIB.

```bash
curl http://localhost:5000/api/get/1
```

#### `GET /api/search`

Ricerca con almeno uno tra: `q` (full-text su titolo/artista),
`track_name`, `artist_name`, `album_name`. Ritorna fino a 50 risultati.

```bash
curl "http://localhost:5000/api/search?q=midnight"
```

#### `POST /api/request-challenge`

Emette una nuova challenge PoW. Una sola chiamata = un solo token, riusabile
una volta sola.

**Risposta 200:**
```json
{
  "prefix": "0fbe285cf9198af4beffd38bc7b854ac085908422b68246e09052d8532f1dfb0",
  "target": "0000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
}
```

#### `POST /api/publish`

Pubblica un nuovo brano. Richiede **uno tra**:

- `Authorization: Bearer <jwt>` → publish attribuito (no PoW)
- `X-Publish-Token: <prefix>:<nonce>` → publish anonimo (PoW richiesto)

**Body JSON:**
```json
{
  "trackName": "Demo Track",
  "artistName": "Demo Artist",
  "albumName": "Optional Album",
  "duration": 123.4,
  "plainLyrics": "First line\nSecond line",
  "syncedLyrics": "[00:00.00] First line\n[00:03.50] Second line",
  "instrumental": false
}
```

### Endpoint di autenticazione (`/auth/*`)

| Endpoint | Body / Header | Risposta |
|---|---|---|
| `POST /auth/register` | `{username, email, password}` | `{user, accessToken, refreshToken}` |
| `POST /auth/login` | `{usernameOrEmail, password}` | `{user, accessToken, refreshToken}` |
| `POST /auth/refresh` | `Authorization: Bearer <refresh>` | `{accessToken}` |
| `GET  /auth/me` | `Authorization: Bearer <access>` | `{user}` |

**Validazione registrazione:**

- `username` — `^[A-Za-z0-9_]{3,30}$`
- `email` — formato email standard, trasformata in lowercase
- `password` — minimo 8 caratteri, almeno una cifra
- Username ed email univoci (case-insensitive)

### Endpoint ausiliari (per l'app mobile)

| Endpoint | Descrizione |
|---|---|
| `GET /health` | health-check |
| `GET /search?q=&title=&artist=&album=` | ricerca (formato snake_case) |
| `GET /songs/<id>` | dettaglio brano (formato snake_case) |
| `GET /explore?page=&limit=&sort=` | catalogo paginato (recent / title / artist) |
| `GET /artists` / `/artists/<id>` | lista / dettaglio artista |
| `GET /albums?artist_id=` | lista album |

Restituiscono lo stesso dominio degli endpoint LRCLIB ma in formato
compatibile con l'app mobile (`snake_case`, JSON sincronizzato invece di LRC).

---

## Autenticazione e Proof of Work

### Modello ibrido

La pubblicazione di lyrics supporta due flussi alternativi:

```
┌─ Utente loggato ─────────► JWT (Bearer) ──► /api/publish ──► song con submittedBy
│
└─ Utente anonimo ──► PoW challenge ──► nonce ──► X-Publish-Token ──► /api/publish ──► song anonima
```

### JWT

- Algoritmo: **HS256**
- Access token: durata **30 minuti**
- Refresh token: durata **7 giorni**
- Identity claim: `user.id` (stringa)
- Trasporto: header `Authorization: Bearer <token>`

L'app mobile salva i token con `expo-secure-store` (Keychain / Keystore) e
implementa **auto-refresh** trasparente: se una richiesta fallisce con `401`,
il client tenta un refresh con il refresh token e ripete la chiamata
originale.

### Proof of Work (LRCLIB-style)

Il PoW serve a **rallentare lo spam di pubblicazioni anonime** senza
richiedere registrazione né CAPTCHA visivi.

**Flusso:**

1. Client chiama `POST /api/request-challenge` → riceve `{prefix, target}`
2. Client cerca un `nonce` tale che
   ```
   SHA-256(prefix + nonce)  ≤  target   (confronto lessicografico hex)
   ```
   Provando: `nonce = 0, 1, 2, …` finché non lo trova.
3. Client invia `prefix:nonce` come header `X-Publish-Token` nel
   `POST /api/publish`.
4. Server verifica la disuguaglianza, marca il prefix come usato (one-shot),
   e accetta la pubblicazione.

La difficoltà è impostata nella config (`POW_DIFFICULTY = 4`, ovvero target
con 4 zeri esadecimali iniziali ≈ ~65k tentativi medi, ~0.5s su un device
mobile moderno).

---

## Schema del database

```
┌────────────┐       ┌────────────┐       ┌────────────┐
│   users    │       │  artists   │       │   albums   │
├────────────┤       ├────────────┤       ├────────────┤
│ id PK      │       │ id PK      │       │ id PK      │
│ username   │       │ name       │       │ title      │
│ email      │       │ created_at │       │ year       │
│ password_  │       └─────┬──────┘       │ artist_id ─┼──┐
│   hash     │             │              └────────────┘  │
└─────┬──────┘             │                              │
      │                    │           ┌──────────────────┘
      │ user_id            │ artist_id │ album_id
      │      (nullable)    │           │ (nullable)
      │                    ▼           ▼
      │              ┌──────────────────────┐
      └─────────────►│        songs         │
                     ├──────────────────────┤
                     │ id PK                │
                     │ title                │
                     │ artist_id FK         │
                     │ album_id FK (nullable)│
                     │ user_id FK (nullable) │
                     │ lyrics               │
                     │ synced_lyrics (JSON) │
                     │ duration             │
                     │ instrumental         │
                     │ created_at           │
                     └──────────────────────┘

┌──────────────────────┐
│   pow_challenges     │
├──────────────────────┤
│ id PK                │
│ token (prefix)       │
│ difficulty           │
│ used (bool)          │
│ created_at           │
└──────────────────────┘
```

**`Song.user_id`** è nullable per supportare il modello ibrido:
- valorizzato → brano pubblicato da un utente autenticato
- `NULL` → brano pubblicato anonimamente (via PoW) o brano di seed

Il campo `synced_lyrics` è memorizzato come stringa JSON
(`[{"time": 12.5, "line": "..."}]`); la conversione bidirezionale con il
formato standard LRC (`[mm:ss.xx] testo`) è gestita da `app/utils/lrc.py`.

---

## Struttura del repository

```
Stopify/
├── Backend/
│   ├── app/
│   │   ├── __init__.py          # app factory + error handlers
│   │   ├── config.py            # Config (env-aware)
│   │   ├── extensions.py        # db, jwt, cors (singletons)
│   │   ├── models/
│   │   │   ├── lyrics.py        # Artist, Album, Song
│   │   │   ├── user.py          # User
│   │   │   └── challenge.py     # PowChallenge
│   │   ├── routes/
│   │   │   ├── lrclib_routes.py # /api/* (spec LRCLIB)
│   │   │   ├── auth_routes.py   # /auth/*
│   │   │   └── lyrics_routes.py # /search, /songs, /explore, ...
│   │   ├── services/
│   │   │   ├── lyrics_service.py
│   │   │   ├── auth_service.py
│   │   │   └── crypto_service.py
│   │   └── utils/
│   │       ├── lrc.py           # encoder/decoder LRC ↔ JSON
│   │       └── security.py
│   ├── main.py                  # entrypoint + seed catalogo
│   ├── migrate.py               # migrazione idempotente
│   ├── lyrics.db                # SQLite (gitignored in produzione)
│   └── requirements.txt
│
├── MobileApp/
│   ├── app/                     # screens (expo-router)
│   │   ├── _layout.tsx          # root con AuthProvider
│   │   ├── index.tsx            # home
│   │   ├── login.tsx            # login
│   │   ├── register.tsx         # registrazione
│   │   ├── search.tsx           # ricerca
│   │   ├── explore.tsx          # catalogo
│   │   ├── publish.tsx          # pubblicazione (JWT o PoW)
│   │   └── song/[id].tsx        # dettaglio brano + lyrics sincronizzate
│   ├── src/
│   │   ├── api.ts               # client REST + auto-refresh JWT
│   │   ├── AuthContext.tsx      # state auth globale
│   │   ├── storage.ts           # wrapper SecureStore con fallback
│   │   └── sha256.ts            # SHA-256 client-side per PoW
│   ├── components/              # ThemedText, ThemedView, ...
│   ├── hooks/
│   ├── assets/
│   └── package.json
│
└── README.md                    # questo file
```

---

## Test

Il backend espone un test client Flask in-process. I test sono organizzati in
due script ad hoc nella cartella di sviluppo:

- **API LRCLIB** — verifica `/api/get`, `/api/get-cached`, `/api/search`,
  `/api/request-challenge`, `/api/publish` (sia via PoW sia via JWT)
- **Auth flow** — register, login (con username e con email), refresh, /me,
  rifiuto di credenziali invalide, rifiuto di token riutilizzati

Lanciare in un terminale separato:

```bash
cd Backend
DATABASE_URL="sqlite:////tmp/lyrics_test.db" python -c "
from app import create_app
from app.extensions import db
app = create_app()
with app.app_context():
    db.create_all()
"
DATABASE_URL="sqlite:////tmp/lyrics_test.db" python /path/to/test_endpoints.py
DATABASE_URL="sqlite:////tmp/lyrics_test.db" python /path/to/test_auth.py
```

---

## Sicurezza

### Implementato nel codice

- ✅ **Hash password** con PBKDF2-SHA256 (`werkzeug.security`), salt randomico
  per ogni record
- ✅ **JWT firmati** HS256, scadenza 30 min (access) / 7 giorni (refresh)
- ✅ **Constant-time password check** anche per utenti inesistenti, per
  evitare timing attacks
- ✅ **Risposta unificata** sui login falliti (`InvalidCredentialsError`)
  per evitare user enumeration
- ✅ **Validazione input** lato server con regex su username/email/password
- ✅ **PoW one-shot**: ogni challenge token è valido per una sola
  pubblicazione, marcato `used=True` dopo l'uso
- ✅ **CORS** abilitato (configurazione restrittiva da applicare in
  produzione)
- ✅ **Error handler globali** 404 / 405 / 500 senza stack trace verso il
  client

### Da configurare in produzione (deferred)

| Aspetto | Stato attuale | In produzione |
|---|---|---|
| HTTPS / TLS | HTTP plain, `debug=True` | nginx / Caddy davanti a Flask con TLS |
| `JWT_SECRET_KEY` | fallback hard-coded | obbligatoria via env, abortire l'app se mancante |
| Rate limiting | assente | `Flask-Limiter` su `/auth/login` (5/min/IP) e `/auth/register` |
| Logging dei login falliti | stdout | log file rotato, alert su soglia |
| Backup DB | manuale | snapshot LiteFS / cron rsync notturno |
| GDPR | endpoint `/auth/me` per leggere | aggiungere `DELETE /auth/me` per cancellare account + dati associati |

### Modello di minaccia coperto

| Minaccia | Mitigazione |
|---|---|
| Credential stuffing | hash password lento (PBKDF2), rate limit (deferred) |
| User enumeration | risposte uniformi su login fallito |
| Token replay | scadenza access 30 min, refresh revocabile lato client |
| Spam di pubblicazioni | PoW per anonimi, attribuzione + ban per autenticati |
| SQL injection | SQLAlchemy ORM con parametri bound |
| XSS / CSRF | API stateless con JWT in header (non in cookie) → CSRF non applicabile |

---

## Roadmap / future work

- [ ] **Documento dei requisiti** completo (FR/NFR, use case diagram, class
      diagram, analisi di sicurezza approfondita)
- [ ] **Rate limiting** con Flask-Limiter
- [ ] **Logging strutturato** con `python-json-logger` + rotazione su file
- [ ] **Endpoint `/auth/me` DELETE** per cancellazione account (GDPR)
- [ ] **`/api/search`** con `submittedBy=<username>` per filtrare i propri
      contributi
- [ ] **OpenAPI / Swagger** auto-generato
- [ ] **CI/CD** (GitHub Actions): lint + type-check + smoke test su PR
- [ ] **App mobile**: schermata "Le mie pubblicazioni" e "Modifica/elimina
      brano" per l'utente autenticato
- [ ] **Migrazione a PostgreSQL** per il deploy in produzione

---

## Autore

**Matteo Barbieri** — A.A. 2025/2026
Università degli Studi — Corso di Laurea Magistrale in Ingegneria Informatica
