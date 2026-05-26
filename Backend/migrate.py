"""
migrate.py
Crea le tabelle del DB se non esistono ancora.
Sicuro da eseguire più volte.

Usage:
    python migrate.py
"""

from app import create_app
from app.extensions import db


def migrate() -> None:
    app = create_app()
    with app.app_context():
        db.create_all()
        print("✅ Tabelle create (o già presenti).")


if __name__ == "__main__":
    migrate()
