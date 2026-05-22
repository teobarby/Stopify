# Stopify — App Mobile

Componente client del progetto Stopify: applicazione mobile multipiattaforma (iOS, Android, Web) per la consultazione e la pubblicazione di lyrics musicali sincronizzate.

> **Corso:** Architettura, Reti e Sicurezza — A.A. 2025/2026
> 
> Per la documentazione completa del sistema vedere [`docs/README.md`](../docs/README.md).

---

## Panoramica del componente

L'app mobile è il frontend del sistema Stopify. Comunica con il backend Flask tramite API REST e offre le seguenti funzionalità:

- Ricerca e navigazione del catalogo lyrics (per titolo, artista, album)
- Visualizzazione dei testi piani e sincronizzati (con timestamp LRC)
- Registrazione e login utente con gestione automatica del token JWT
- Pubblicazione di nuove lyrics — sia tramite autenticazione JWT sia tramite Proof of Work (per utenti anonimi)

---

## Stack tecnologico

| Componente | Tecnologia | Versione |
|---|---|---|
| Framework UI | React Native | 0.81 |
| Runtime / build | Expo SDK | 54 |
| Routing | expo-router (file-based) | 6 |
| Linguaggio | TypeScript | — |
| Storage sicuro token | expo-secure-store | — |
---

## Struttura del progetto

```
MobileApp/
├── app/                        # Schermate — expo-router (file-based routing)
│   ├── _layout.tsx             # Root layout con AuthProvider globale
│   ├── index.tsx               # Home
│   ├── login.tsx               # Login utente
│   ├── register.tsx            # Registrazione utente
│   ├── search.tsx              # Ricerca nel catalogo
│   ├── explore.tsx             # Catalogo paginato (ordinabile per data / titolo / artista)
│   ├── publish.tsx             # Pubblicazione lyrics (JWT o PoW)
│   └── song/[id].tsx           # Dettaglio brano + lyrics sincronizzate
│
├── src/
│   ├── api.ts                  # Client REST verso il backend + auto-refresh JWT
│   ├── AuthContext.tsx         # Stato di autenticazione globale (React Context)
│   ├── storage.ts              # Wrapper expo-secure-store con fallback AsyncStorage
│   └── sha256.ts               # SHA-256 client-side per il calcolo del nonce PoW
│
├── components/                 # Componenti riutilizzabili (ThemedText, ThemedView, …)
├── hooks/                      # Hook personalizzati
├── assets/                     # Immagini, font, icone
└── package.json
```

---

## Scelte progettuali rilevanti

### Routing file-based (expo-router)

Il routing è gestito da `expo-router`, che mappa automaticamente i file nella cartella `app/` alle schermate. Questo approccio riduce il boilerplate rispetto alla configurazione manuale di React Navigation e rende la struttura del progetto auto-documentante.

### Gestione dello stato di autenticazione

`AuthContext.tsx` espone un React Context con lo stato globale dell'utente (token JWT, profilo). Tutte le schermate vi accedono tramite un hook `useAuth()`, evitando il prop drilling e centralizzando la logica di login/logout.

### Auto-refresh del JWT

`src/api.ts` implementa un interceptor che, in caso di risposta `401` dal backend, tenta automaticamente il rinnovo dell'access token tramite il refresh token, poi ripete la chiamata originale. L'utente non percepisce l'interruzione della sessione.

### Persistenza sicura dei token

I token JWT sono salvati con `expo-secure-store`, che utilizza il Keychain di iOS e il Keystore di Android — entrambi protetti dalla crittografia del dispositivo. Il file `storage.ts` include un fallback su `AsyncStorage` per l'ambiente Web (dove Secure Store non è disponibile).

### Proof of Work client-side

`src/sha256.ts` implementa SHA-256 in TypeScript puro (senza dipendenze native) per calcolare il nonce richiesto dal PoW. La ricerca è incrementale (`nonce = 0, 1, 2, …`) e avviene nel thread JavaScript; per difficoltà più elevate si potrebbe spostare in un Web Worker.

---

## Setup e avvio

### Prerequisiti

- Node.js ≥ 18
- npm o yarn
- Expo Go installato su device fisico (opzionale), oppure simulatore iOS / emulatore Android

### Installazione

```bash
cd MobileApp

# Installa le dipendenze
npm install

# (Opzionale) Installa expo-secure-store per la persistenza sicura del JWT
npx expo install expo-secure-store
```

### Configurazione rete

Aprire `src/api.ts` e aggiornare `BASE_URL` con l'indirizzo IP della macchina che esegue il backend:

```typescript
// src/api.ts
const BASE_URL = "http://<IP_DEL_TUO_PC>:5000";
```

> Il valore predefinito `192.168.178.114` è l'IP della macchina di sviluppo originale e non funzionerà su altre reti.

### Avvio

```bash
npx expo start
```

Expo aprirà un QR code nel terminale. Scansionarlo con l'app **Expo Go** per testare su device fisico, oppure premere `i` (simulatore iOS) o `a` (emulatore Android) per aprire direttamente nell'emulatore.

---

## Comunicazione con il backend

Tutti i dettagli sulle API REST sono documentati in [`docs/README.md § API REST`](../docs/README.md#6-api-rest). In sintesi, l'app usa:

- `GET /search`, `GET /explore`, `GET /songs/<id>`, `GET /artists`, `GET /albums` — navigazione del catalogo
- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh` — autenticazione
- `POST /api/request-challenge` + `POST /api/publish` — pubblicazione lyrics (flusso PoW)
- `POST /api/publish` con `Authorization: Bearer` — pubblicazione lyrics (flusso JWT)
