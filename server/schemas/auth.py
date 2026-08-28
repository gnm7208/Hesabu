from marshmallow import EXCLUDE, Schema, fields, validate


class RegisterSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=8))
    full_name = fields.Str(required=True, validate=validate.Length(min=2, max=255))
    phone = fields.Str(required=False, allow_none=True)


class LoginSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    email = fields.Email(required=True)
    password = fields.Str(required=True)


class UserSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    id = fields.Str(dump_only=True)
    email = fields.Str(dump_only=True)
    full_name = fields.Str(dump_only=True)
    phone = fields.Str(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
