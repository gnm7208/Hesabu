import uuid
from datetime import datetime

from server.extensions import db


class Group(db.Model):
    __tablename__ = "groups"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    currency = db.Column(db.String(3), nullable=False, default="KES")
    contribution_amount_cents = db.Column(db.Integer, nullable=False, default=0)
    contribution_frequency = db.Column(db.String(20), nullable=False, default="monthly")
    created_by = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    creator = db.relationship("User", back_populates="groups_created")
    members = db.relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")
    contributions = db.relationship(
        "Contribution", back_populates="group", cascade="all, delete-orphan"
    )
    statements = db.relationship("Statement", back_populates="group", cascade="all, delete-orphan")
