"""
Helpers di conversione tra il nostro formato JSON sincronizzato
e il formato LRC standard usato da LRCLIB.

Formato JSON interno:
    [{"time": 12.5, "line": "testo..."}]

Formato LRC esterno:
    [00:12.50] testo...
    [00:15.00] altra riga
"""

from __future__ import annotations

import json
import re
from typing import List, Optional

# Esempi validi:
#   [00:17.12] Want to know
#   [01:23.4] Foo
#   [12:34.567] Bar
LRC_LINE_RE = re.compile(r"^\s*\[(\d{1,3}):(\d{1,2}(?:\.\d+)?)\]\s*(.*?)\s*$")


def _format_lrc_timestamp(seconds: float) -> str:
    """0:12.5 → '[00:12.50]'."""
    if seconds < 0:
        seconds = 0.0
    minutes = int(seconds // 60)
    secs = seconds - minutes * 60
    return f"[{minutes:02d}:{secs:05.2f}]"


def json_to_lrc(synced_json: Optional[str]) -> Optional[str]:
    """
    Converte una stringa JSON `[{"time":..,"line":..}, ...]`
    nel formato LRC standard. Restituisce None se il JSON è vuoto/invalid.
    """
    if not synced_json:
        return None
    try:
        items = json.loads(synced_json)
    except (ValueError, TypeError):
        return None
    if not isinstance(items, list) or not items:
        return None

    lines: List[str] = []
    for it in items:
        try:
            t = float(it.get("time", 0))
            text = str(it.get("line", "") or "")
        except (TypeError, ValueError):
            continue
        lines.append(f"{_format_lrc_timestamp(t)} {text}")

    return "\n".join(lines) if lines else None


def lrc_to_json(lrc: Optional[str]) -> Optional[str]:
    """
    Converte una stringa in formato LRC nella nostra rappresentazione JSON.
    Le righe non parseabili vengono ignorate. Ritorna None se non c'è nulla
    da memorizzare.
    """
    if not lrc:
        return None

    items = []
    for raw in lrc.replace("\r\n", "\n").split("\n"):
        m = LRC_LINE_RE.match(raw)
        if not m:
            continue
        try:
            mm = int(m.group(1))
            ss = float(m.group(2))
        except (ValueError, TypeError):
            continue
        items.append({"time": mm * 60 + ss, "line": m.group(3)})

    return json.dumps(items, ensure_ascii=False) if items else None
