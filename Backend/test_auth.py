"""
test_auth.py
Test del flusso di autenticazione: register, login (username e email),
refresh token, /auth/me, credenziali invalide, token riutilizzati.

Usage:
    DATABASE_URL="sqlite:////tmp/lyrics_test.db" python test_auth.py
"""

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


with app.app_context():
    db.create_all()

# ─── POST /auth/register ──────────────────────────────────────────────────────

print("\n── POST /auth/register ──────────────────────────────────────────────")
r = client.post(
    "/auth/register",
    json={"username": "alice", "email": "alice@example.com", "password": "Secret42"},
)
check("status 201", r.status_code == 201, str(r.status_code))
body = r.get_json()
check("accessToken presente", "accessToken" in body, str(body.keys()))
check("refreshToken presente", "refreshToken" in body, str(body.keys()))
check("user.username corretto", body.get("user", {}).get("username") == "alice")
check("user.is_admin false", body.get("user", {}).get("is_admin") is False)

access = body["accessToken"]
refresh = body["refreshToken"]

# Duplicati
r2 = client.post(
    "/auth/register",
    json={"username": "alice", "email": "alice2@example.com", "password": "Secret42"},
)
check("409 username duplicato", r2.status_code == 409, str(r2.status_code))

r3 = client.post(
    "/auth/register",
    json={"username": "alice2", "email": "alice@example.com", "password": "Secret42"},
)
check("409 email duplicata", r3.status_code == 409, str(r3.status_code))

# Validazione username
r4 = client.post(
    "/auth/register",
    json={"username": "ab", "email": "x@x.com", "password": "Secret42"},
)
check("422 username troppo corto", r4.status_code == 422, str(r4.status_code))

# Validazione password
r5 = client.post(
    "/auth/register",
    json={"username": "newuser", "email": "new@x.com", "password": "nocipher"},
)
check("422 password senza cifra", r5.status_code == 422, str(r5.status_code))

# ─── POST /auth/login ─────────────────────────────────────────────────────────

print("\n── POST /auth/login ─────────────────────────────────────────────────")
r = client.post(
    "/auth/login",
    json={"usernameOrEmail": "alice", "password": "Secret42"},
)
check("login con username: 200", r.status_code == 200, str(r.status_code))
body = r.get_json()
check("accessToken presente", "accessToken" in body)
check("refreshToken presente", "refreshToken" in body)
access = body["accessToken"]
refresh = body["refreshToken"]

r = client.post(
    "/auth/login",
    json={"usernameOrEmail": "alice@example.com", "password": "Secret42"},
)
check("login con email: 200", r.status_code == 200, str(r.status_code))

r = client.post(
    "/auth/login",
    json={"usernameOrEmail": "alice", "password": "WrongPass1"},
)
check("401 password errata", r.status_code == 401, str(r.status_code))
check("codice InvalidCredentialsError", r.get_json().get("error") == "InvalidCredentialsError")

r = client.post(
    "/auth/login",
    json={"usernameOrEmail": "nonexistent", "password": "Whatever1"},
)
check("401 utente inesistente", r.status_code == 401, str(r.status_code))
check("stesso errore (no user enumeration)",
      r.get_json().get("error") == "InvalidCredentialsError")

# ─── GET /auth/me ─────────────────────────────────────────────────────────────

print("\n── GET /auth/me ─────────────────────────────────────────────────────")
r = client.get("/auth/me", headers={"Authorization": f"Bearer {access}"})
check("status 200", r.status_code == 200, str(r.status_code))
check("user.username corretto", r.get_json().get("user", {}).get("username") == "alice")

r = client.get("/auth/me")
check("401 senza token", r.status_code == 401, str(r.status_code))

r = client.get("/auth/me", headers={"Authorization": "Bearer token.invalido.xxx"})
check("401 token malformato", r.status_code == 422, str(r.status_code))  # JWT Extended usa 422

# ─── POST /auth/refresh ───────────────────────────────────────────────────────

print("\n── POST /auth/refresh ───────────────────────────────────────────────")
r = client.post("/auth/refresh", headers={"Authorization": f"Bearer {refresh}"})
check("status 200 con refresh token", r.status_code == 200, str(r.status_code))
new_access = r.get_json().get("accessToken")
check("nuovo accessToken presente", bool(new_access))
check("accessToken cambiato", new_access != access)

# Il nuovo access token deve funzionare
r = client.get("/auth/me", headers={"Authorization": f"Bearer {new_access}"})
check("/auth/me con nuovo access: 200", r.status_code == 200, str(r.status_code))

# Usare un access token come refresh → rifiuto
r = client.post("/auth/refresh", headers={"Authorization": f"Bearer {access}"})
check("422 access token usato come refresh", r.status_code == 422, str(r.status_code))

# ─── Risultato ────────────────────────────────────────────────────────────────

print()
if errors:
    print(f"\033[91m{errors} test falliti.\033[0m")
    sys.exit(1)
else:
    print("\033[92mTutti i test superati.\033[0m")
