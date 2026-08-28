from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from server.extensions import db
from server.schemas.group import GroupSchema
from server.services.group_service import GroupService
from server.utils.auth import get_current_user, treasurer_required
from server.utils.errors import APIError

bp = Blueprint("groups", __name__)


@bp.route("/groups", methods=["POST"])
@jwt_required()
def create_group():
    try:
        user = get_current_user()
        data = request.get_json() or {}
        group = GroupService.create(user, data)
        return jsonify(GroupSchema().dump(group)), 201
    except APIError as e:
        db.session.rollback()
        return jsonify(e.to_dict()), e.status_code
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "server_error", "message": str(e)}), 500


@bp.route("/groups", methods=["GET"])
@jwt_required()
def list_groups():
    try:
        user = get_current_user()
        groups = GroupService.list_for_user(user.id)
        return jsonify(GroupSchema(many=True).dump(groups)), 200
    except Exception as e:
        return jsonify({"error": "server_error", "message": str(e)}), 500


@bp.route("/groups/<group_id>", methods=["GET"])
@jwt_required()
def get_group(group_id):
    try:
        group = GroupService.get(group_id)
        return jsonify(GroupSchema().dump(group)), 200
    except APIError as e:
        return jsonify(e.to_dict()), e.status_code
    except Exception as e:
        return jsonify({"error": "server_error", "message": str(e)}), 500


@bp.route("/groups/<group_id>", methods=["PATCH"])
@jwt_required()
@treasurer_required
def update_group(group_id):
    try:
        data = request.get_json() or {}
        group = GroupService.update(group_id, data)
        return jsonify(GroupSchema().dump(group)), 200
    except APIError as e:
        db.session.rollback()
        return jsonify(e.to_dict()), e.status_code
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "server_error", "message": str(e)}), 500
