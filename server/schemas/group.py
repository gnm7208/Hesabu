from marshmallow import EXCLUDE, Schema, fields, validate

# Kept in step with client/src/lib/themes.ts — the client owns the artwork and
# palette, the server only guarantees the slug is one we recognise.
THEMES = ["harambee", "mboga", "boda", "shule", "kilimo", "biashara"]


class GroupCreateSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    name = fields.Str(required=True, validate=validate.Length(min=2, max=255))
    currency = fields.Str(required=False, load_default="KES", validate=validate.Length(equal=3))
    contribution_amount_cents = fields.Int(
        required=False, load_default=0, validate=validate.Range(min=0)
    )
    contribution_frequency = fields.Str(
        required=False,
        load_default="monthly",
        validate=validate.OneOf(["weekly", "monthly"]),
    )
    theme = fields.Str(required=False, load_default="harambee", validate=validate.OneOf(THEMES))


class GroupUpdateSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    name = fields.Str(required=False, validate=validate.Length(min=2, max=255))
    contribution_amount_cents = fields.Int(required=False, validate=validate.Range(min=0))
    contribution_frequency = fields.Str(
        required=False, validate=validate.OneOf(["weekly", "monthly"])
    )
    theme = fields.Str(required=False, validate=validate.OneOf(THEMES))


class GroupSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    id = fields.Str(dump_only=True)
    name = fields.Str(dump_only=True)
    currency = fields.Str(dump_only=True)
    contribution_amount_cents = fields.Int(dump_only=True)
    contribution_frequency = fields.Str(dump_only=True)
    theme = fields.Str(dump_only=True)
    created_by = fields.Str(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
