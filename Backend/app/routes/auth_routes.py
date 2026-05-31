from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from app.errors import AppError
from app.services.auth_service import authenticate_user, get_user_by_id, register_user
from app.routes._helpers import make_error as _err

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    try:
        user = register_user(
            username=data.get("username", ""),
            email=data.get("email", ""),
            password=data.get("password", ""),
        )
    except AppError as e:
        return _err(e.message, e.status)

    return jsonify({
        "user": user.to_dict(),
        "accessToken": create_access_token(identity=str(user.id)),
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    identifier = data.get("usernameOrEmail") or data.get("username") or data.get("email") or ""
    password = data.get("password", "")

    try:
        user = authenticate_user(identifier, password)
    except AppError as e:
        return _err(e.message, e.status)

    return jsonify({
        "user": user.to_dict(),
        "accessToken": create_access_token(identity=str(user.id)),
    }), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user = get_user_by_id(int(get_jwt_identity()))
    if not user:
        return _err("Utente non trovato", 404)
    return jsonify({"user": user.to_dict()}), 200
