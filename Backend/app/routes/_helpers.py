"""
Helper HTTP condiviso tra i blueprint.
"""

from flask import jsonify


def make_error(code: str, status: int, message: str):
    """Risposta di errore in formato LRCLIB."""
    return jsonify({"statusCode": status, "error": code, "message": message}), status
