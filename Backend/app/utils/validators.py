"""
Validatori comuni per il payload delle route.
"""

from typing import Iterable, List


def missing_fields(data: dict, required: Iterable[str]) -> List[str]:
    """Restituisce l'elenco dei campi mancanti o vuoti."""
    if not isinstance(data, dict):
        return list(required)
    return [f for f in required if not str(data.get(f, "")).strip()]
