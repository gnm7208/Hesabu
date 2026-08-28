from marshmallow import EXCLUDE, Schema, fields, validate


class MemberCreateSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    full_name = fields.Str(required=True, validate=validate.Length(min=2, max=255))
    phone = fields.Str(required=True)
    role = fields.Str(
        required=False, load_default="member", validate=validate.OneOf(["treasurer", "member"])
    )


class MemberUpdateSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    full_name = fields.Str(required=False, validate=validate.Length(min=2, max=255))
    phone = fields.Str(required=False)
    role = fields.Str(required=False, validate=validate.OneOf(["treasurer", "member"]))
    status = fields.Str(required=False, validate=validate.OneOf(["active", "inactive"]))


class MemberSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    id = fields.Str(dump_only=True)
    group_id = fields.Str(dump_only=True)
    user_id = fields.Str(dump_only=True, allow_none=True)
    full_name = fields.Str(dump_only=True)
    phone = fields.Str(dump_only=True)
    role = fields.Str(dump_only=True)
    status = fields.Str(dump_only=True)
    joined_at = fields.DateTime(dump_only=True)
