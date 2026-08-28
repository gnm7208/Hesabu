from marshmallow import EXCLUDE, Schema, fields, validate


class ContributionCreateSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    group_member_id = fields.Str(required=True)
    amount_cents = fields.Int(required=True, validate=validate.Range(min=1))
    method = fields.Str(
        required=False,
        load_default="cash",
        validate=validate.OneOf(["mpesa", "cash", "bank", "other"]),
    )
    contributed_at = fields.DateTime(required=True)
    mpesa_code = fields.Str(required=False, allow_none=True)


class ContributionImportSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    raw_text = fields.Str(required=True, validate=validate.Length(min=1))


class ContributionResolveSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    group_member_id = fields.Str(required=True)


class ContributionSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    id = fields.Str(dump_only=True)
    group_id = fields.Str(dump_only=True)
    group_member_id = fields.Str(dump_only=True, allow_none=True)
    amount_cents = fields.Int(dump_only=True)
    method = fields.Str(dump_only=True)
    mpesa_code = fields.Str(dump_only=True, allow_none=True)
    contributed_at = fields.DateTime(dump_only=True)
    raw_text = fields.Str(dump_only=True, allow_none=True)
    match_confidence = fields.Str(dump_only=True)
    recorded_by = fields.Str(dump_only=True, allow_none=True)
    created_at = fields.DateTime(dump_only=True)
