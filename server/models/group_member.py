import uuid
from datetime import datetime

from server.extensions import db


class GroupMember(db.Model):
    __tablename__ = "group_members"
    __table_args__ = (db.UniqueConstraint("group_id", "phone", name="uq_group_member_phone"),)

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    group_id = db.Column(db.String(36), db.ForeignKey("groups.id"), nullable=False, index=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)
    full_name = db.Column(db.String(255), nullable=False)
    # Nullable: the auto-created treasurer membership (see GroupService.create) may not
    # have a phone yet if the user registered without one — every other member is added
    # with a required phone (schemas/member.py), since that's the whole matching key.
    phone = db.Column(db.String(20), nullable=True, index=True)
    role = db.Column(db.String(20), nullable=False, default="member")
    status = db.Column(db.String(20), nullable=False, default="active")
    joined_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    group = db.relationship("Group", back_populates="members")
    user = db.relationship("User", back_populates="memberships")
    contributions = db.relationship("Contribution", back_populates="member")
