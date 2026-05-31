import json
import re

LRC_LINE_RE = re.compile(r"^\s*\[(\d{1,3}):(\d{1,2}(?:\.\d+)?)\]\s*(.*?)\s*$")


def _format_lrc_timestamp(seconds: float) -> str:
    if seconds < 0:
        seconds = 0.0
    minutes = int(seconds // 60)
    secs = seconds - minutes * 60
    return f"[{minutes:02d}:{secs:05.2f}]"


def json_to_lrc(synced_json: str | None) -> str | None:
    if not synced_json:
        return None
    try:
        items = json.loads(synced_json)
    except (ValueError, TypeError):
        return None
    if not isinstance(items, list) or not items:
        return None

    lines: list[str] = []
    for it in items:
        try:
            t = float(it.get("time", 0))
            text = str(it.get("line", "") or "")
        except (TypeError, ValueError):
            continue
        lines.append(f"{_format_lrc_timestamp(t)} {text}")

    return "\n".join(lines) if lines else None


def lrc_to_json(lrc: str | None) -> str | None:
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
