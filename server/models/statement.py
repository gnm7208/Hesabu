import uuid
from datetime import datetime

from server.extensions import db


class Statement(db.Model):
    __tablename__ = "statements"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    group_id = db.Column(db.String(36), db.ForeignKey("groups.id"), nullable=False, index=True)
    period_start = db.Column(db.Date, nullable=False)
    period_end = db.Column(db.Date, nullable=False)
    generated_by = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    summary = db.Column(db.JSON, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="final")

    group = db.relationship("Group", back_populates="statements")
