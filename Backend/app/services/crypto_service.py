"""
Servizio crittografico: generazione e verifica delle sfide Proof of Work.

Stile LRCLIB:
    - Il server emette `prefix` (32 byte hex) e `target` (64 char hex).
    - Il client deve trovare un `nonce` tale che
        SHA-256(prefix + nonce)  <  target   (confronto lessicografico hex)
    - Il client invia `prefix:nonce` nell'header `X-Publish-Token`.
"""

import hashlib
import secrets


# ─── Token / Prefix ──────────────────────────────────────────────────────────

def generate_token(num_bytes: int = 32) -> str:
    """Genera un identificatore esadecimale crittograficamente sicuro."""
    return secrets.token_hex(num_bytes)


# ─── Target ──────────────────────────────────────────────────────────────────

def difficulty_to_target(difficulty: int) -> str:
    """
    Costruisce un target SHA-256 (64 char hex) a partire da una difficoltà
    espressa come numero di zeri esadecimali iniziali richiesti.
    Esempio: difficulty=4 -> "0000ffff...ff".
    """
    difficulty = max(0, min(difficulty, 64))
    return "0" * difficulty + "f" * (64 - difficulty)


# ─── Verifica ────────────────────────────────────────────────────────────────

def verify_pow(prefix: str, nonce: str, target: str) -> bool:
    """
    Verifica che SHA-256(prefix + nonce) sia lessicograficamente
    minore o uguale al target hex.
    """
    if not prefix or not nonce or not target:
        return False
    candidate = hashlib.sha256(f"{prefix}{nonce}".encode()).hexdigest()
    return candidate <= target


def parse_publish_token(header_value: str) -> tuple[str, str] | None:
    """
    Estrae (prefix, nonce) da un header LRCLIB-style 'prefix:nonce'.
    Restituisce None se il formato è invalido.
    """
    if not header_value or ":" not in header_value:
        return None
    prefix, _, nonce = header_value.partition(":")
    prefix = prefix.strip()
    nonce = nonce.strip()
    if not prefix or not nonce:
        return None
    return prefix, nonce
