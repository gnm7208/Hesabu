from server.extensions import db
from server.models import GroupMember
from server.schemas.member import MemberCreateSchema, MemberUpdateSchema
from server.utils.errors import APIError, NotFoundError
from server.utils.phone import normalize_phone


class MemberService:
    @staticmethod
    def add(group_id, data):
        schema = MemberCreateSchema()
        validated = schema.load(data)
        phone = normalize_phone(validated["phone"])
        if not phone:
            raise APIError("Not a valid Kenyan phone number", status_code=400)

        existing = db.session.query(GroupMember).filter_by(group_id=group_id, phone=phone).first()
        if existing:
            raise APIError("A member with this phone number already exists", status_code=409)

        member = GroupMember(
            group_id=group_id,
            full_name=validated["full_name"],
            phone=phone,
            role=validated["role"],
        )
        db.session.add(member)
        db.session.commit()
        return member

    @staticmethod
    def list_for_group(group_id):
        return db.session.query(GroupMember).filter_by(group_id=group_id).all()

    @staticmethod
    def get(group_id, member_id):
        member = db.session.query(GroupMember).filter_by(id=member_id, group_id=group_id).first()
        if not member:
            raise NotFoundError("Member not found")
        return member

    @staticmethod
    def update(group_id, member_id, data):
        schema = MemberUpdateSchema(partial=True)
        validated = schema.load(data)
        member = MemberService.get(group_id, member_id)
        if "phone" in validated:
            normalized = normalize_phone(validated["phone"])
            if not normalized:
                raise APIError("Not a valid Kenyan phone number", status_code=400)
            validated["phone"] = normalized
        for key, value in validated.items():
            setattr(member, key, value)
        db.session.commit()
        return member

    @staticmethod
    def remove(group_id, member_id):
        member = MemberService.get(group_id, member_id)
        member.status = "inactive"
        db.session.commit()
        return member
