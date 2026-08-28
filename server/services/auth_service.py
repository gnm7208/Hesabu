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
