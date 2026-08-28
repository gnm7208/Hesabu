from flask import Blueprint, jsonify, make_response, request
from flask_jwt_extended import jwt_required, set_access_cookies, unset_jwt_cookies

from server.extensions import limiter
from server.schemas.auth import UserSchema
from server.services.auth_service import AuthService
from server.utils.auth import get_current_user
from server.utils.errors import APIError

bp = Blueprint("auth", __name__)


@bp.route("/auth/register", methods=["POST"])
@limiter.limit("3 per minute")
def register():
    try:
        data = request.get_json() or {}
        result = AuthService.register(data)
        response = make_response(
            jsonify(
                {
                    "access_token": result["access_token"],
                    "user": UserSchema().dump(result["user"]),
                }
            ),
            201,
        )
        set_access_cookies(response, result["access_token"])
        return response
    except APIError as e:
        return jsonify(e.to_dict()), e.status_code
    except Exception as e:
        return jsonify({"error": "server_error", "message": str(e)}), 500


@bp.route("/auth/login", methods=["POST"])
@limiter.limit("5 per minute")
def login():
    try:
        data = request.get_json() or {}
        result = AuthService.login(data)
        response = make_response(
            jsonify(
                {
                    "access_token": result["access_token"],
                    "user": UserSchema().dump(result["user"]),
                }
            ),
            200,
        )
        set_access_cookies(response, result["access_token"])
        return response
    except APIError as e:
        return jsonify(e.to_dict()), e.status_code
    except Exception as e:
        return jsonify({"error": "server_error", "message": str(e)}), 500


@bp.route("/auth/logout", methods=["POST"])
@jwt_required()
def logout():
    response = make_response(jsonify({"message": "logged out"}), 200)
    unset_jwt_cookies(response)
    return response


@bp.route("/auth/me", methods=["GET"])
@jwt_required()
def get_me():
    user = get_current_user()
    if not user:
        return jsonify({"error": "not_found", "message": "User not found"}), 404
    return jsonify(UserSchema().dump(user)), 200
