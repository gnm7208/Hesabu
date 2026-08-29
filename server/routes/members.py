from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from server.extensions import db
from server.schemas.member import MemberSchema
from server.services.member_service import MemberService
from server.utils.auth import group_member_required, treasurer_required
from server.utils.errors import APIError, server_error

bp = Blueprint("members", __name__)


@bp.route("/groups/<group_id>/members", methods=["POST"])
@jwt_required()
@treasurer_required
def add_member(group_id):
    try:
        data = request.get_json() or {}
        member = MemberService.add(group_id, data)
        return jsonify(MemberSchema().dump(member)), 201
    except APIError as e:
        db.session.rollback()
        return jsonify(e.to_dict()), e.status_code
    except Exception as e:
        db.session.rollback()
        return server_error(e)


@bp.route("/groups/<group_id>/members", methods=["GET"])
@jwt_required()
@group_member_required
def list_members(group_id):
    try:
        members = MemberService.list_for_group(group_id)
        return jsonify(MemberSchema(many=True).dump(members)), 200
    except Exception as e:
        return server_error(e)


@bp.route("/groups/<group_id>/members/<member_id>", methods=["PATCH"])
@jwt_required()
@treasurer_required
def update_member(group_id, member_id):
    try:
        data = request.get_json() or {}
        member = MemberService.update(group_id, member_id, data)
        return jsonify(MemberSchema().dump(member)), 200
    except APIError as e:
        db.session.rollback()
        return jsonify(e.to_dict()), e.status_code
    except Exception as e:
        db.session.rollback()
        return server_error(e)


@bp.route("/groups/<group_id>/members/<member_id>", methods=["DELETE"])
@jwt_required()
@treasurer_required
def remove_member(group_id, member_id):
    try:
        MemberService.remove(group_id, member_id)
        return jsonify({"message": "Member removed"}), 200
    except APIError as e:
        db.session.rollback()
        return jsonify(e.to_dict()), e.status_code
    except Exception as e:
        db.session.rollback()
        return server_error(e)
