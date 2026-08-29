from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from server.extensions import db
from server.schemas.statement import StatementSchema
from server.services.statement_service import StatementService
from server.utils.auth import get_current_user, group_member_required, treasurer_required
from server.utils.errors import APIError, server_error

bp = Blueprint("statements", __name__)


@bp.route("/groups/<group_id>/statements", methods=["POST"])
@jwt_required()
@treasurer_required
def generate_statement(group_id):
    try:
        user = get_current_user()
        data = request.get_json() or {}
        statement = StatementService.generate(group_id, user.id, data)
        return jsonify(StatementSchema().dump(statement)), 201
    except APIError as e:
        db.session.rollback()
        return jsonify(e.to_dict()), e.status_code
    except Exception as e:
        db.session.rollback()
        return server_error(e)


@bp.route("/groups/<group_id>/statements", methods=["GET"])
@jwt_required()
@group_member_required
def list_statements(group_id):
    try:
        statements = StatementService.list_for_group(group_id)
        return jsonify(StatementSchema(many=True).dump(statements)), 200
    except Exception as e:
        return server_error(e)


@bp.route("/groups/<group_id>/statements/<statement_id>", methods=["GET"])
@jwt_required()
@group_member_required
def get_statement(group_id, statement_id):
    try:
        statement = StatementService.get(group_id, statement_id)
        return jsonify(StatementSchema().dump(statement)), 200
    except APIError as e:
        return jsonify(e.to_dict()), e.status_code
    except Exception as e:
        return server_error(e)
