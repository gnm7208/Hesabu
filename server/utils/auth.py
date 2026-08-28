from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt_identity

from server.extensions import db
from server.models import GroupMember, User


def get_current_user():
    user_id = get_jwt_identity()
    if not user_id:
        return None
    return db.session.query(User).filter_by(id=user_id).first()


def get_membership(group_id, user_id):
    return (
        db.session.query(GroupMember)
        .filter_by(group_id=group_id, user_id=user_id, status="active")
        .first()
    )


def treasurer_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        group_id = kwargs.get("group_id")
        membership = get_membership(group_id, user_id) if user_id else None
        if not membership or membership.role != "treasurer":
            return jsonify(
                {"error": "forbidden", "message": "Treasurer access required for this group"}
            ), 403
        return fn(*args, **kwargs)

    return wrapper


def group_member_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        group_id = kwargs.get("group_id")
        membership = get_membership(group_id, user_id) if user_id else None
        if not membership:
            return jsonify(
                {"error": "forbidden", "message": "You are not a member of this group"}
            ), 403
        return fn(*args, **kwargs)

    return wrapper
