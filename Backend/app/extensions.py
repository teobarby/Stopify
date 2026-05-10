from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS

db = SQLAlchemy()
jwt = JWTManager()
cors = CORS()

# Flask-Migrate è opzionale (non viene usato attivamente: non ci sono
# migrazioni Alembic). Se l'import fallisce — ad esempio per `tomli`
# mancante in ambienti vecchi — lasciamo `migrate` come stub no-op così
# l'app continua a partire.
try:
    from flask_migrate import Migrate  # type: ignore
    migrate = Migrate()
except Exception:  # pragma: no cover
    class _NoopMigrate:
        def init_app(self, *_a, **_k):
            return None
    migrate = _NoopMigrate()
