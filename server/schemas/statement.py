from marshmallow import EXCLUDE, Schema, fields, validate


class StatementCreateSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    period_start = fields.Date(required=True)
    period_end = fields.Date(required=True)
    status = fields.Str(
        required=False, load_default="final", validate=validate.OneOf(["draft", "final"])
    )


class StatementSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    id = fields.Str(dump_only=True)
    group_id = fields.Str(dump_only=True)
    period_start = fields.Date(dump_only=True)
    period_end = fields.Date(dump_only=True)
    generated_by = fields.Str(dump_only=True)
    generated_at = fields.DateTime(dump_only=True)
    summary = fields.Dict(dump_only=True)
    status = fields.Str(dump_only=True)
