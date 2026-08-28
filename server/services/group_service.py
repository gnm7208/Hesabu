from server.extensions import db
from server.models import Group, GroupMember
from server.schemas.group import GroupCreateSchema, GroupUpdateSchema
from server.utils.errors import NotFoundError
from server.utils.phone import normalize_phone


class GroupService:
    @staticmethod
    def create(user, data):
        schema = GroupCreateSchema()
        validated = schema.load(data)
        group = Group(created_by=user.id, **validated)
        db.session.add(group)
        db.session.flush()

        treasurer_phone = normalize_phone(user.phone) if user.phone else None
        db.session.add(
            GroupMember(
                group_id=group.id,
                user_id=user.id,
                full_name=user.full_name,
                phone=treasurer_phone,
                role="treasurer",
                status="active",
            )
        )
        db.session.commit()
        return group

    @staticmethod
    def list_for_user(user_id):
        return (
            db.session.query(Group)
            .join(GroupMember, GroupMember.group_id == Group.id)
            .filter(GroupMember.user_id == user_id, GroupMember.status == "active")
            .all()
        )

    @staticmethod
    def get(group_id):
        group = db.session.query(Group).filter_by(id=group_id).first()
        if not group:
            raise NotFoundError("Group not found")
        return group

    @staticmethod
    def update(group_id, data):
        schema = GroupUpdateSchema(partial=True)
        validated = schema.load(data)
        group = GroupService.get(group_id)
        for key, value in validated.items():
            setattr(group, key, value)
        db.session.commit()
        return group
