import hashlib
import secrets


def generate_token(num_bytes: int = 32) -> str:
    return secrets.token_hex(num_bytes)


def difficulty_to_target(difficulty: int) -> str:
    difficulty = max(0, min(difficulty, 64))
    return "0" * difficulty + "f" * (64 - difficulty)


def verify_pow(prefix: str, nonce: str, target: str) -> bool:
    if not prefix or not nonce or not target:
        return False
    candidate = hashlib.sha256(f"{prefix}{nonce}".encode()).hexdigest()
    return candidate <= target


def parse_publish_token(header_value: str) -> tuple[str, str] | None:
    if not header_value or ":" not in header_value:
        return None
    prefix, _, nonce = header_value.partition(":")
    prefix = prefix.strip()
    nonce = nonce.strip()
    if not prefix or not nonce:
        return None
    return prefix, nonce
