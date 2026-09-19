import bcrypt
from flask_jwt_extended import create_access_token

from server.extensions import db
from server.models import User
from server.schemas.auth import LoginSchema, RegisterSchema
from server.utils.errors import APIError


class AuthService:
    @staticmethod
    def register(data):
        schema = RegisterSchema()
        validated = schema.load(data)
        existing = db.session.query(User).filter_by(email=validated["email"]).first()
        if existing:
            raise APIError("User already exists", status_code=409)

        password_hash = bcrypt.hashpw(
            validated["password"].encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")
        user = User(
            email=validated["email"],
            full_name=validated["full_name"],
            phone=validated.get("phone"),
            password_hash=password_hash,
        )
        db.session.add(user)
        db.session.commit()

        access_token = create_access_token(identity=user.id)
        return {"access_token": access_token, "user": user}

    @staticmethod
    def login(data):
        schema = LoginSchema()
        validated = schema.load(data)
        user = db.session.query(User).filter_by(email=validated["email"]).first()
        if not user or not bcrypt.checkpw(
            validated["password"].encode("utf-8"), user.password_hash.encode("utf-8")
        ):
            raise APIError("Invalid credentials", status_code=401)

        access_token = create_access_token(identity=user.id)
        return {"access_token": access_token, "user": user}

    @staticmethod
    def delete_account(user, password):
        """Erase a user after re-checking their password.

        A treasurer owns their chamas' books, so groups they created go with
        them (members, contributions and statements cascade). Where they were
        merely a member of someone else's group, that treasurer's ledger must
        survive: the membership row stays but is unlinked from the login, and
        anything they recorded or generated there is re-attributed to the
        group's creator.
        """
        if not password or not bcrypt.checkpw(
            password.encode("utf-8"), user.password_hash.encode("utf-8")
        ):
            # 403, not 401: the session is valid, only the confirmation failed,
            # and the client signs the user out on any 401.
            raise APIError("Incorrect password", status_code=403)

        from server.models import Contribution, Group, GroupMember, Statement

        own_group_ids = [g.id for g in db.session.query(Group).filter_by(created_by=user.id)]

        (
            db.session.query(GroupMember)
            .filter(GroupMember.user_id == user.id, GroupMember.group_id.notin_(own_group_ids))
            .update({GroupMember.user_id: None}, synchronize_session=False)
        )
        (
            db.session.query(Contribution)
            .filter(
                Contribution.recorded_by == user.id, Contribution.group_id.notin_(own_group_ids)
            )
            .update({Contribution.recorded_by: None}, synchronize_session=False)
        )
        for statement in (
            db.session.query(Statement)
            .filter(Statement.generated_by == user.id, Statement.group_id.notin_(own_group_ids))
            .all()
        ):
            statement.generated_by = statement.group.created_by

        for group in db.session.query(Group).filter(Group.id.in_(own_group_ids)).all():
            db.session.delete(group)
        db.session.delete(user)
        db.session.commit()
