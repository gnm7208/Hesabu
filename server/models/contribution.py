import uuid
from datetime import datetime

from server.extensions import db


class Contribution(db.Model):
    __tablename__ = "contributions"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    group_id = db.Column(db.String(36), db.ForeignKey("groups.id"), nullable=False, index=True)
    group_member_id = db.Column(
        db.String(36), db.ForeignKey("group_members.id"), nullable=True, index=True
    )
    amount_cents = db.Column(db.Integer, nullable=False)
    method = db.Column(db.String(20), nullable=False, default="mpesa")
    mpesa_code = db.Column(db.String(20), nullable=True, unique=True)
    contributed_at = db.Column(db.DateTime, nullable=False)
    raw_text = db.Column(db.Text, nullable=True)
    match_confidence = db.Column(db.String(20), nullable=False, default="manual")
    recorded_by = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    group = db.relationship("Group", back_populates="contributions")
    member = db.relationship("GroupMember", back_populates="contributions")
