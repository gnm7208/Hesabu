from datetime import datetime

from server.extensions import db
from server.models import Contribution, Group, GroupMember
from server.schemas.contribution import ContributionCreateSchema, ContributionResolveSchema
from server.services.mpesa_parser import parse_mpesa_text
from server.utils.errors import APIError, NotFoundError
from server.utils.schedule import periods_elapsed


class ContributionService:
    @staticmethod
    def create_manual(group_id, recorded_by, data):
        schema = ContributionCreateSchema()
        validated = schema.load(data)
        member = (
            db.session.query(GroupMember)
            .filter_by(id=validated["group_member_id"], group_id=group_id)
            .first()
        )
        if not member:
            raise NotFoundError("Member not found in this group")

        contribution = Contribution(
            group_id=group_id,
            group_member_id=member.id,
            amount_cents=validated["amount_cents"],
            method=validated["method"],
            mpesa_code=validated.get("mpesa_code"),
            contributed_at=validated["contributed_at"],
            match_confidence="manual",
            recorded_by=recorded_by,
        )
        db.session.add(contribution)
        db.session.commit()
        return contribution

    @staticmethod
    def list_for_group(group_id, group_member_id=None, match_confidence=None):
        query = db.session.query(Contribution).filter_by(group_id=group_id)
        if group_member_id:
            query = query.filter_by(group_member_id=group_member_id)
        if match_confidence:
            query = query.filter_by(match_confidence=match_confidence)
        return query.order_by(Contribution.contributed_at.desc()).all()

    @staticmethod
    def import_from_text(group_id, recorded_by, raw_text):
        parsed, unparsed = parse_mpesa_text(raw_text)

        members_by_phone = {
            m.phone: m
            for m in db.session.query(GroupMember).filter_by(group_id=group_id, status="active")
        }
        existing_codes = {
            code
            for (code,) in db.session.query(Contribution.mpesa_code).filter(
                Contribution.mpesa_code.in_([row["code"] for row in parsed])
            )
        }

        created = []
        duplicates = []
        for row in parsed:
            if row["code"] in existing_codes:
                duplicates.append(row)
                continue

            member = members_by_phone.get(row["phone"])
            contribution = Contribution(
                group_id=group_id,
                group_member_id=member.id if member else None,
                amount_cents=row["amount_cents"],
                method="mpesa",
                mpesa_code=row["code"],
                contributed_at=row["contributed_at"],
                raw_text=row["raw_text"],
                match_confidence="auto" if member else "unmatched",
                recorded_by=recorded_by,
            )
            db.session.add(contribution)
            created.append(contribution)

        db.session.commit()
        return {
            "imported": created,
            "duplicates": duplicates,
            "unparsed": unparsed,
        }

    @staticmethod
    def resolve(group_id, contribution_id, data):
        schema = ContributionResolveSchema()
        validated = schema.load(data)

        contribution = (
            db.session.query(Contribution).filter_by(id=contribution_id, group_id=group_id).first()
        )
        if not contribution:
            raise NotFoundError("Contribution not found")
        if contribution.match_confidence != "unmatched":
            raise APIError("Only unmatched contributions can be resolved", status_code=400)

        member = (
            db.session.query(GroupMember)
            .filter_by(id=validated["group_member_id"], group_id=group_id)
            .first()
        )
        if not member:
            raise NotFoundError("Member not found in this group")

        contribution.group_member_id = member.id
        # "resolved" (not "auto"/"manual") — a human confirmed a match the parser
        # couldn't make on its own, distinct from both an automatic phone match and
        # a fully hand-entered contribution.
        contribution.match_confidence = "resolved"
        db.session.commit()
        return contribution

    @staticmethod
    def compute_arrears(group_id):
        group = db.session.query(Group).filter_by(id=group_id).first()
        if not group:
            raise NotFoundError("Group not found")

        members = db.session.query(GroupMember).filter_by(group_id=group_id, status="active").all()
        now = datetime.utcnow()

        results = []
        for member in members:
            paid_cents = (
                db.session.query(db.func.coalesce(db.func.sum(Contribution.amount_cents), 0))
                .filter_by(group_id=group_id, group_member_id=member.id)
                .scalar()
            )
            periods = periods_elapsed(member.joined_at, now, group.contribution_frequency)
            expected_cents = periods * group.contribution_amount_cents
            arrears_cents = max(0, expected_cents - paid_cents)
            results.append(
                {
                    "group_member_id": member.id,
                    "full_name": member.full_name,
                    "phone": member.phone,
                    "expected_cents": expected_cents,
                    "paid_cents": paid_cents,
                    "arrears_cents": arrears_cents,
                }
            )

        results.sort(key=lambda r: r["arrears_cents"], reverse=True)
        return results
