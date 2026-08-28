from datetime import datetime

from server.extensions import db
from server.models import Contribution, Group, GroupMember, Statement
from server.schemas.statement import StatementCreateSchema
from server.utils.errors import NotFoundError
from server.utils.schedule import periods_elapsed


class StatementService:
    @staticmethod
    def generate(group_id, generated_by, data):
        schema = StatementCreateSchema()
        validated = schema.load(data)
        group = db.session.query(Group).filter_by(id=group_id).first()
        if not group:
            raise NotFoundError("Group not found")

        period_start = validated["period_start"]
        period_end = validated["period_end"]
        period_start_dt = datetime.combine(period_start, datetime.min.time())
        period_end_dt = datetime.combine(period_end, datetime.max.time())

        contributions = (
            db.session.query(Contribution)
            .filter(
                Contribution.group_id == group_id,
                Contribution.contributed_at >= period_start_dt,
                Contribution.contributed_at <= period_end_dt,
            )
            .all()
        )
        members = db.session.query(GroupMember).filter_by(group_id=group_id, status="active").all()

        paid_by_member = {}
        unmatched_cents = 0
        for c in contributions:
            if c.group_member_id:
                paid_by_member[c.group_member_id] = (
                    paid_by_member.get(c.group_member_id, 0) + c.amount_cents
                )
            else:
                unmatched_cents += c.amount_cents

        periods_in_range = periods_elapsed(
            period_start_dt, period_end_dt, group.contribution_frequency
        )
        expected_per_member = periods_in_range * group.contribution_amount_cents

        per_member = []
        arrears = []
        for member in members:
            paid = paid_by_member.get(member.id, 0)
            per_member.append(
                {
                    "group_member_id": member.id,
                    "full_name": member.full_name,
                    "phone": member.phone,
                    "paid_cents": paid,
                }
            )
            member_arrears = max(0, expected_per_member - paid)
            if member_arrears > 0:
                arrears.append(
                    {
                        "group_member_id": member.id,
                        "full_name": member.full_name,
                        "arrears_cents": member_arrears,
                    }
                )

        total_collected_cents = sum(c.amount_cents for c in contributions)
        summary = {
            "period_start": period_start.isoformat(),
            "period_end": period_end.isoformat(),
            "total_collected_cents": total_collected_cents,
            "total_expected_cents": expected_per_member * len(members),
            "unmatched_cents": unmatched_cents,
            "per_member": per_member,
            "arrears": arrears,
        }

        statement = Statement(
            group_id=group_id,
            period_start=period_start,
            period_end=period_end,
            generated_by=generated_by,
            summary=summary,
            status=validated["status"],
        )
        db.session.add(statement)
        db.session.commit()
        return statement

    @staticmethod
    def list_for_group(group_id):
        return (
            db.session.query(Statement)
            .filter_by(group_id=group_id)
            .order_by(Statement.generated_at.desc())
            .all()
        )

    @staticmethod
    def get(group_id, statement_id):
        statement = (
            db.session.query(Statement).filter_by(id=statement_id, group_id=group_id).first()
        )
        if not statement:
            raise NotFoundError("Statement not found")
        return statement
