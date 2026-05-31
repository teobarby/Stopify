from flask import jsonify


def make_error(message: str, status: int):
    return jsonify({"message": message}), status
