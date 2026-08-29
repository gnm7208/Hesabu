from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from server.extensions import db, limiter
from server.schemas.contribution import ContributionImportSchema, ContributionSchema
from server.services.contribution_service import ContributionService
from server.utils.auth import get_current_user, group_member_required, treasurer_required
from server.utils.errors import APIError, server_error

bp = Blueprint("contributions", __name__)


@bp.route("/groups/<group_id>/contributions", methods=["POST"])
@jwt_required()
@treasurer_required
def add_contribution(group_id):
    try:
        user = get_current_user()
        data = request.get_json() or {}
        contribution = ContributionService.create_manual(group_id, user.id, data)
        return jsonify(ContributionSchema().dump(contribution)), 201
    except APIError as e:
        db.session.rollback()
        return jsonify(e.to_dict()), e.status_code
    except Exception as e:
        db.session.rollback()
        return server_error(e)


@bp.route("/groups/<group_id>/contributions", methods=["GET"])
@jwt_required()
@group_member_required
def list_contributions(group_id):
    try:
        member_id = request.args.get("group_member_id")
        confidence = request.args.get("match_confidence")
        contributions = ContributionService.list_for_group(group_id, member_id, confidence)
        return jsonify(ContributionSchema(many=True).dump(contributions)), 200
    except Exception as e:
        return server_error(e)


@bp.route("/groups/<group_id>/contributions/import", methods=["POST"])
@jwt_required()
@treasurer_required
@limiter.limit("10 per minute")
def import_contributions(group_id):
    try:
        user = get_current_user()
        data = request.get_json() or {}
        schema = ContributionImportSchema()
        validated = schema.load(data)
        result = ContributionService.import_from_text(group_id, user.id, validated["raw_text"])
        return jsonify(
            {
                "imported": ContributionSchema(many=True).dump(result["imported"]),
                "duplicate_count": len(result["duplicates"]),
                "unparsed": result["unparsed"],
            }
        ), 201
    except APIError as e:
        db.session.rollback()
        return jsonify(e.to_dict()), e.status_code
    except Exception as e:
        db.session.rollback()
        return server_error(e)


@bp.route("/groups/<group_id>/contributions/<contribution_id>/resolve", methods=["PATCH"])
@jwt_required()
@treasurer_required
def resolve_contribution(group_id, contribution_id):
    try:
        data = request.get_json() or {}
        contribution = ContributionService.resolve(group_id, contribution_id, data)
        return jsonify(ContributionSchema().dump(contribution)), 200
    except APIError as e:
        db.session.rollback()
        return jsonify(e.to_dict()), e.status_code
    except Exception as e:
        db.session.rollback()
        return server_error(e)


@bp.route("/groups/<group_id>/arrears", methods=["GET"])
@jwt_required()
@group_member_required
def get_arrears(group_id):
    try:
        arrears = ContributionService.compute_arrears(group_id)
        return jsonify(arrears), 200
    except APIError as e:
        return jsonify(e.to_dict()), e.status_code
    except Exception as e:
        return server_error(e)
