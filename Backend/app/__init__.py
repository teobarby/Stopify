from flask import Flask, jsonify

from app.config import Config
from app.extensions import cors, db, jwt


def create_app(config_class: type = Config) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Estensioni
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app)

    from app import models  # noqa: F401

    # Blueprint
    from app.routes import admin_bp, auth_bp, lrclib_bp
    app.register_blueprint(lrclib_bp)  # /api/*
    app.register_blueprint(auth_bp)    # /auth/*
    app.register_blueprint(admin_bp)   # /admin/*

    # Error handlers
    @app.errorhandler(404)
    def not_found(_e):
        return jsonify({"error": "Risorsa non trovata"}), 404

    @app.errorhandler(405)
    def method_not_allowed(_e):
        return jsonify({"error": "Metodo non consentito"}), 405

    @app.errorhandler(500)
    def internal_error(_e):
        db.session.rollback()
        return jsonify({"error": "Errore interno del server"}), 500

    return app
