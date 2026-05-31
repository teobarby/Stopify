# Stopify — Relazione Tecnica

Sistema per la raccolta e consultazione di **lyrics musicali** (testi piani e sincronizzati) compatibile con la specifica [LRCLIB](https://lrclib.net/docs).

> **Corso:** Architettura, Reti e Sicurezza — A.A. 2025/2026
> **Studente:** Matteo Barbieri
> **Università:** Università degli Studi — Corso di Laurea Magistrale in Ingegneria Informatica

---

## Indice

1. [Obiettivi del progetto](#1-obiettivi-del-progetto)
2. [Specifiche funzionali](#2-specifiche-funzionali)
3. [Stack tecnologico](#3-stack-tecnologico)
4. [Architettura del sistema](#4-architettura-del-sistema)
5. [Schema del database](#5-schema-del-database)
6. [API REST](#6-api-rest)
7. [Autenticazione e Proof of Work](#7-autenticazione-e-proof-of-work)
8. [Sicurezza](#8-sicurezza)
9. [Setup e avvio](#9-setup-e-avvio)
10. [Struttura del repository](#10-struttura-del-repository)
11. [Test](#11-test)
12. [Conclusioni e sviluppi futuri](#12-conclusioni-e-sviluppi-futuri)

---

## 1. Obiettivi del progetto

Stopify nasce con l'obiettivo di implementare un sistema distribuito client-server per la gestione di lyrics musicali, che rispetti la specifica open-source **LRCLIB**. Il progetto copre in modo integrato i temi centrali del corso:

- **Architettura a strati** (*Routes → Services → Models*) per separare le responsabilità e facilitare la manutenibilità del codice
- **Comunicazione client-server** tramite API REST in JSON su HTTP
- **Sicurezza applicativa**: autenticazione con JWT (access token), hashing delle password con PBKDF2-SHA256 e meccanismo anti-spam Proof of Work
- **Persistenza dei dati** con un database relazionale gestito tramite ORM (SQLAlchemy + SQLite)
- **Client mobile multipiattaforma** in React Native / Expo (iOS, Android, Web)

---

## 2. Specifiche funzionali

Il sistema è composto da due componenti principali:

- **Backend Flask** (`Backend/`) — server REST con persistenza SQLite
- **App Mobile Expo / React Native** (`MobileApp/`) — client iOS / Android / Web

### Requisiti funzionali

Il backend implementa l'intera specifica LRCLIB richiesta dalla traccia del progetto:

| # | Funzionalità | Endpoint | Metodo |
|---|---|---|---|
| RF1 | Lookup lyrics per signature (titolo + artista) | `GET /api/get` | GET |
| RF2 | Lookup lyrics (solo cache locale) | `GET /api/get-cached` | GET |
| RF3 | Lookup lyrics per ID | `GET /api/get/<id>` | GET |
| RF4 | Ricerca full-text nel catalogo | `GET /api/search` | GET |
| RF5 | Pubblicazione di nuove lyrics | `POST /api/publish` | POST |
| RF6 | Richiesta challenge Proof of Work | `POST /api/request-challenge` | POST |
| RF7 | Registrazione e autenticazione utente | `/auth/register`, `/auth/login` | POST |
| RF8 | Lista brani pubblicati dall'utente autenticato | `GET /api/me/songs` | GET |
| RF9 | Modifica di un proprio brano | `PUT /api/songs/<id>` | PUT |
| RF10 | Cancellazione di un proprio brano | `DELETE /api/songs/<id>` | DELETE |
| RF11 | Vista admin: catalogo completo con filtri | `GET /admin/songs` | GET |

### Requisiti non funzionali

- **Scalabilità**: architettura stateless, pronta per la migrazione da SQLite a PostgreSQL
- **Sicurezza**: password hashed, JWT firmati con scadenza, PoW one-shot per le pubblicazioni anonime
- **Usabilità**: app mobile con routing file-based, gradienti e blur per un'interfaccia moderna
- **Portabilità**: backend eseguibile su qualsiasi sistema con Python ≥ 3.10; app testabile su simulatore o device fisico

---

## 3. Stack tecnologico

### Backend

| Componente | Tecnologia | Versione | Motivazione della scelta |
|---|---|---|---|
| Web framework | Flask | 3.1 | Leggero, flessibile, ottimo per API REST; ampia documentazione |
| ORM | Flask-SQLAlchemy | 3.1 | Astrazione sul DB, query parametrizzate (sicurezza SQL injection) |
| Database | SQLite | embedded | Semplice da deployare senza server separato; adatto al prototipo |
| Autenticazione | Flask-JWT-Extended | 4.7 | Gestione nativa di access token JWT con HS256 |
| CORS | Flask-CORS | 6.0 | Necessario per le chiamate cross-origin dall'app mobile |
| Hashing password | werkzeug.security | — | PBKDF2-SHA256 con salt randomico, già incluso nell'ecosistema Flask |
| Migrazioni DB | script idempotente (`migrate.py`) | — | Aggiornamento dello schema senza perdita di dati |

### App Mobile

| Componente | Tecnologia | Versione | Motivazione della scelta |
|---|---|---|---|
| Framework UI | React Native | 0.81 | Unica codebase per iOS, Android e Web |
| Runtime | Expo SDK | 54 | Semplifica build, aggiornamenti OTA e accesso alle API native |
| Routing | expo-router | 6 | File-based routing, struttura chiara e manutenibile |
| Sicurezza token | expo-secure-store | — | Persiste JWT su Keychain (iOS) e Keystore (Android) |
| UI avanzata | expo-linear-gradient, expo-blur | — | Effetti visivi moderni senza dipendenze native custom |
| Linguaggio | TypeScript | — | Type safety end-to-end, riduce errori a runtime |

---

## 4. Architettura del sistema

### Vista ad alto livello

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

### Architettura a strati del backend

Il backend è organizzato secondo il pattern *Routes → Services → Models*, che garantisce separazione delle responsabilità e testabilità della logica di business indipendentemente dal layer HTTP.

```
app/
├── routes/      ← Entrypoint HTTP: validazione payload, formattazione risposta
├── services/    ← Business logic: transazioni, eccezioni di dominio
├── models/      ← ORM models (SQLAlchemy): mapping tabelle ↔ oggetti Python
└── utils/       ← Helper trasversali: encoder LRC, funzioni di sicurezza
```

**Motivazione:** questa separazione permette di testare la logica di business senza montare una request Flask, e isola i dettagli di trasporto (HTTP, JSON) dal dominio applicativo (gestione delle lyrics, autenticazione, PoW).

### Flusso di una richiesta tipica

```
Client HTTP
    │
    ▼
[Route] ── valida i parametri, autentica JWT (se richiesto)
    │
    ▼
[Service] ── esegue la business logic, interagisce con il DB
    │
    ▼
[Model] ── SQLAlchemy: query parametrizzate, gestione transazioni
    │
    ▼
[Route] ── formatta la risposta JSON, imposta lo status code
    │
    ▼
Client HTTP
```

---

## 5. Schema del database

```
┌────────────┐       ┌────────────┐       ┌────────────┐
│   users    │       │  artists   │       │   albums   │
├────────────┤       ├────────────┤       ├────────────┤
│ id PK      │       │ id PK      │       │ id PK      │
│ username   │       │ name       │       │ title      │
│ email      │       └─────┬──────┘       │ artist_id ─┼──┐
│ password_  │             │              └────────────┘  │
│   hash     │             │                              │
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

**Scelte progettuali:**

- `Song.user_id` è nullable per supportare il modello ibrido: valorizzato per brani pubblicati da utenti autenticati, `NULL` per brani anonimi (via PoW) o di seed.
- `synced_lyrics` è memorizzato come stringa JSON (`[{"time": 12.5, "line": "..."}]`). La conversione bidirezionale con il formato LRC standard (`[mm:ss.xx] testo`) è gestita da `app/utils/lrc.py`, disaccoppiando il formato di storage da quello di trasporto.
- La tabella `pow_challenges` tiene traccia dei token usati per garantire il vincolo one-shot senza bisogno di un sistema di cache esterno.

---

## 6. API REST

Tutte le risposte sono JSON con codifica UTF-8. Gli errori restituiscono un oggetto JSON con il campo `message`:

```json
{ "message": "Lyrics non trovate" }
```

Gli errori globali (404, 405, 500 non intercettati dalle route) usano il campo `error`:

```json
{ "error": "Risorsa non trovata" }
```

### Endpoint compatibili LRCLIB (`/api/*`)

#### `GET /api/get` — Lookup per signature

Cerca lyrics per titolo e artista; la durata è opzionale con tolleranza ±2s.

**Query parameters:** `track_name` (req), `artist_name` (req), `album_name` (opt), `duration` (opt, secondi)

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

```bash
curl "http://localhost:5000/api/get?track_name=Midnight+Drive&artist_name=Solar+Static&duration=198"
```

#### `GET /api/get-cached` — Lookup (solo cache locale)

Identico a `/api/get`. Nella nostra implementazione i due endpoint coincidono perché il DB locale *è* la cache: non è previsto un fallback su sorgenti esterne.

#### `GET /api/get/<id>` — Lookup per ID

```bash
curl http://localhost:5000/api/get/1
```

#### `GET /api/search` — Ricerca full-text

Richiede almeno uno tra `q`, `track_name`, `artist_name`, `album_name`. Ritorna fino a 50 risultati.

```bash
curl "http://localhost:5000/api/search?q=midnight"
```

#### `POST /api/request-challenge` — Challenge PoW

Emette una nuova challenge one-shot.

**Risposta 200:**
```json
{
  "prefix": "0fbe285cf9198af4beffd38bc7b854ac085908422b68246e09052d8532f1dfb0",
  "target": "0000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
}
```

#### `POST /api/publish` — Pubblicazione lyrics

Richiede **uno tra**:
- `Authorization: Bearer <jwt>` → pubblicazione attribuita all'utente (senza PoW)
- `X-Publish-Token: <prefix>:<nonce>` → pubblicazione anonima (PoW necessario)

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
| `POST /auth/register` | `{username, email, password}` | `{user, accessToken}` |
| `POST /auth/login` | `{usernameOrEmail, password}` | `{user, accessToken}` |
| `GET  /auth/me` | `Authorization: Bearer <accessToken>` | `{user}` |

**Validazione registrazione:**
- `username` — `^[A-Za-z0-9_]{3,30}$`
- `email` — formato standard, normalizzata in lowercase
- `password` — minimo 8 caratteri, almeno una cifra
- Username ed email univoci (case-insensitive)

### Endpoint estensioni app (sotto `/api/*`)

| Endpoint | Descrizione |
|---|---|
| `GET /api/health` | Health-check del server |
| `GET /api/explore?page=&limit=&sort=` | Catalogo paginato (`recent` / `title` / `artist`) |

---

## 7. Autenticazione e Proof of Work

### Modello ibrido

La pubblicazione di lyrics supporta due flussi distinti, permettendo sia utenti registrati che anonimi nel rispetto della specifica LRCLIB:

```
┌─ Utente loggato ─────────► JWT (Bearer) ──► /api/publish ──► song con submittedBy
│
└─ Utente anonimo ──► PoW challenge ──► nonce ──► X-Publish-Token ──► /api/publish ──► song anonima
```

### JWT (JSON Web Token)

| Parametro | Valore |
|---|---|
| Algoritmo | HS256 |
| Access token | durata 30 minuti |
| Identity claim | `user.id` (stringa) |
| Trasporto | Header `Authorization: Bearer <token>` |

L'app mobile persiste il token con `expo-secure-store` (Keychain su iOS, Keystore su Android). Alla ricezione di un `401` il client svuota la sessione locale e reindirizza al login.

### Proof of Work (LRCLIB-style)

Il PoW è il meccanismo scelto dalla specifica LRCLIB per **rallentare lo spam di pubblicazioni anonime** senza richiedere registrazione né CAPTCHA visivi.

**Algoritmo:**

1. Il client chiama `POST /api/request-challenge` e riceve `{prefix, target}`.
2. Il client cerca un `nonce` intero tale che, in esadecimale:
   ```
   SHA-256(prefix + nonce)  ≤  target   (confronto lessicografico)
   ```
   La ricerca avviene per tentativi incrementali (`nonce = 0, 1, 2, …`).
3. Il client invia `prefix:nonce` nell'header `X-Publish-Token` del `POST /api/publish`.
4. Il server verifica la disuguaglianza, marca il prefix come `used = True` (vincolo one-shot) e accetta la pubblicazione.

**Parametri di difficoltà:** `POW_DIFFICULTY = 4` → target con 4 zeri esadecimali iniziali ≈ ~65.000 tentativi medi, ~0,5 s su un device mobile moderno. Il valore è configurabile in `app/config.py`.

**Motivazione della scelta:** il PoW richiede potenza di calcolo, non un'identità; questo bilancia apertura (chiunque può contribuire) e protezione dallo spam automatizzato.

---

## 8. Sicurezza

### Misure implementate

| Misura | Descrizione | Standard di riferimento |
|---|---|---|
| Hash password | PBKDF2-SHA256 con salt randomico per ogni record (`werkzeug.security`) | OWASP Password Storage |
| JWT firmati | HS256, scadenza 30 min (access token) | RFC 7519 |
| Risposta unificata | Login fallito → messaggio `"Credenziali non valide"` indipendentemente dalla causa (user non esiste / password errata), per prevenire user enumeration | OWASP |
| Validazione input | Regex lato server su username, email e password | — |
| PoW one-shot | Ogni challenge token è valido una sola volta; riuso → rifiuto | Specifica LRCLIB |
| ORM con bound parameters | Tutte le query passano per SQLAlchemy, eliminando SQL injection | OWASP SQL Injection |
| CORS configurato | Intestazioni CORS abilitate (restrizione degli origini da applicare in produzione) | — |
| Error handler globali | 404 / 405 / 500 restituiscono JSON strutturato senza stack trace | — |

### Considerazioni per un deployment in produzione

| Aspetto | Stato attuale (sviluppo) | Da fare in produzione |
|---|---|---|
| HTTPS / TLS | HTTP plain, `debug=True` | nginx / Caddy davanti a Flask con certificato TLS |
| `JWT_SECRET_KEY` | Fallback hard-coded in `config.py` | Obbligatoria via env; abortire l'avvio se mancante |
| Rate limiting | Non implementato | `Flask-Limiter` su `/auth/login` (5 req/min/IP) e `/auth/register` |
| Logging autenticazione | stdout | Log file rotato con `python-json-logger`, alert su soglia |
| Backup DB | Manuale | Snapshot LiteFS / cron rsync notturno |
| GDPR | `GET /auth/me` per leggere i dati | Aggiungere `DELETE /auth/me` per cancellazione account |

### Modello di minaccia

| Minaccia | Mitigazione implementata |
|---|---|
| Credential stuffing | Hash password lento (PBKDF2), rate limit (deferred) |
| User enumeration | Risposta uniforme su credenziali invalide |
| Token replay | Scadenza access token 30 min; logout revoca il token lato client |
| Spam di pubblicazioni | PoW per anonimi; attribuzione + possibilità di ban per autenticati |
| SQL injection | SQLAlchemy ORM con query parametrizzate |
| XSS / CSRF | API stateless con JWT in header (non in cookie) → CSRF non applicabile |

---

## 9. Setup e avvio

### Prerequisiti

- Python ≥ 3.10
- Node.js ≥ 18
- npm o yarn

### Backend

```bash
cd Backend

# 1. Crea e attiva il virtual environment
python3 -m venv ../venv
source ../venv/bin/activate          # Windows: ..\venv\Scripts\activate

# 2. Installa le dipendenze
pip install -r requirements.txt

# 3. Migrazione idempotente del DB
#    Crea le tabelle se non esistono e aggiunge le colonne aggiunte dopo la
#    prima release (idempotente: sicuro da rieseguire su un DB già aggiornato).
python migrate.py

# 4. Avvio del server di sviluppo
python main.py
```

Il server è disponibile su `http://0.0.0.0:5000`. Al primo avvio, se il DB è vuoto, viene popolato automaticamente con un catalogo di esempio di 4 brani originali (testi inventati per il progetto).

**Variabili d'ambiente (opzionali in sviluppo, obbligatorie in produzione):**

```bash
export DATABASE_URL="sqlite:////path/assoluto/al/db.sqlite"  # default: lyrics.db nella cwd
export JWT_SECRET_KEY="chiave-sicura-da-configurare"         # default insicuro: 'super-secret-key'
export SECRET_KEY="chiave-sicura-da-configurare"             # default insicuro: 'change-me-in-production'
```

### App Mobile

```bash
cd MobileApp

# 1. Installa le dipendenze Node
npm install

# 2. (Opzionale) Persistenza sicura del JWT su iOS/Android
npx expo install expo-secure-store

# 3. Avvia Metro Bundler
npx expo start
```

> ⚠️ **Configurazione rete**: `BASE_URL` viene letto da `app.json → expo.extra.apiBaseUrl` (con fallback a `http://localhost:5000`). Per testare su device fisico o emulatore Android, impostare l'IP della propria macchina in `app.json`:
> ```json
> { "expo": { "extra": { "apiBaseUrl": "http://192.168.x.x:5000" } } }
> ```

---

## 10. Struttura del repository

```
Stopify/
├── Backend/
│   ├── app/
│   │   ├── __init__.py          # App factory + error handlers globali
│   │   ├── config.py            # Config (env-aware, con fallback per sviluppo)
│   │   ├── extensions.py        # db, jwt, cors — istanze singleton
│   │   ├── errors.py            # AppError — eccezione di dominio unificata
│   │   ├── models/
│   │   │   ├── lyrics.py        # Artist, Album, Song
│   │   │   ├── user.py          # User
│   │   │   └── challenge.py     # PowChallenge
│   │   ├── routes/
│   │   │   ├── lrclib_routes.py # /api/* (LRCLIB + estensioni app)
│   │   │   ├── auth_routes.py   # /auth/*
│   │   │   ├── admin_routes.py  # /admin/*
│   │   │   └── _helpers.py      # make_error — helper HTTP condiviso
│   │   ├── services/
│   │   │   ├── lyrics_service.py
│   │   │   ├── auth_service.py
│   │   │   └── crypto_service.py  # Generazione/verifica PoW, parse token
│   │   └── utils/
│   │       └── lrc.py           # Encoder/decoder LRC ↔ JSON
│   ├── main.py                  # Entrypoint + seed catalogo
│   ├── migrate.py               # Migrazione idempotente dello schema
│   ├── lyrics.db                # SQLite (da escludere con .gitignore in produzione)
│   └── requirements.txt
│
├── MobileApp/
│   ├── app/                     # Schermate (expo-router, file-based routing)
│   │   ├── _layout.tsx          # Root layout con AuthProvider
│   │   ├── index.tsx            # Home
│   │   ├── login.tsx            # Login
│   │   ├── register.tsx         # Registrazione
│   │   ├── search.tsx           # Ricerca nel catalogo
│   │   ├── explore.tsx          # Catalogo paginato
│   │   ├── publish.tsx          # Pubblicazione (JWT o PoW)
│   │   ├── my-lyrics.tsx        # Brani pubblicati dall'utente autenticato
│   │   ├── admin.tsx            # Pannello admin (solo is_admin=true)
│   │   ├── song/[id].tsx        # Dettaglio brano + lyrics sincronizzate
│   │   └── edit-song/[id].tsx   # Modifica un proprio brano
│   ├── src/
│   │   ├── api.ts               # Client REST verso il backend
│   │   ├── AuthContext.tsx      # Stato di autenticazione globale (React Context)
│   │   ├── storage.ts           # Wrapper SecureStore con fallback su localStorage (web)
│   │   ├── dialog.ts            # Wrapper cross-platform per Alert e conferme
│   │   └── sha256.ts            # SHA-256 client-side per il calcolo del nonce PoW
│   ├── constants/
│   │   └── theme.ts             # Colori condivisi (PRIMARY, BG_GRADIENT, TEXT_MUTED, …)
│   ├── styles/                  # StyleSheet dedicati per ogni schermata
│   ├── components/              # ThemedText, ThemedView, ...
│   ├── hooks/
│   ├── assets/
│   └── package.json
│
└── docs/
    └── README.md                # Questo documento
```

---

## 11. Test

Il backend può essere verificato manualmente tramite `curl` o strumenti come Postman/Insomnia, usando gli endpoint documentati nella sezione §6. Per un test rapido dell'health-check:

```bash
curl http://localhost:5000/api/health
```

---

## 12. Conclusioni e sviluppi futuri

Il progetto Stopify ha raggiunto tutti gli obiettivi fissati dalla traccia del corso: l'implementazione completa della specifica LRCLIB, l'autenticazione JWT, il meccanismo Proof of Work per le pubblicazioni anonime e un'app mobile funzionante su iOS, Android e Web da una singola codebase TypeScript.

Le scelte architetturali (separazione Routes/Services/Models, ORM SQLAlchemy, JWT stateless, PoW one-shot) riflettono i principi di progettazione sicura e manutenibile discussi nel corso.

### Sviluppi futuri

- **Rate limiting** con Flask-Limiter (5 req/min/IP su `/auth/login`)
- **HTTPS in produzione** tramite nginx / Caddy con certificato TLS
- **Logging strutturato** con `python-json-logger` e rotazione su file
- **`DELETE /auth/me`** per cancellazione account (GDPR art. 17)
- **OpenAPI / Swagger** auto-generato dalla specifica degli endpoint
- **CI/CD** con GitHub Actions: lint, type-check, smoke test su ogni PR
- **Migrazione a PostgreSQL** per il deploy in produzione multi-utente
- **Pulizia periodica** della tabella `pow_challenges` (rimozione dei token usati o scaduti)
