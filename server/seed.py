import uuid
from datetime import datetime, timedelta

import bcrypt

from server.app import create_app
from server.extensions import db
from server.models import Contribution, Group, GroupMember, User

MEMBERS = [
    {"name": "Grace Wanjiru", "phone": "254712345671"},
    {"name": "Peter Kamau", "phone": "254712345672"},
    {"name": "Faith Achieng", "phone": "254712345673"},
    {"name": "Daniel Mutiso", "phone": "254712345674"},
    {"name": "Mercy Chebet", "phone": "254712345675"},
]

# One M-PESA confirmation per line, mixing both real wordings, a duplicate-looking
# amount, and one line whose phone doesn't match any seeded member — exercises the
# "unmatched" path an actual pasted statement would hit.
RAW_MPESA_TEXT = """\
QAR7A1B2C3 Confirmed. You have received Ksh2,000.00 from GRACE WANJIRU 254712345671 on 3/8/26 at 9:15 AM. New M-PESA balance is Ksh18,450.00.
RJ45D4E5F6 Confirmed. Ksh2,000.00 received from PETER KAMAU 0712345672 on 3/8/26 at 10:02 AM. Account Number CHAMA. New Utility balance is Ksh20,450.00.
QAR7G7H8I9 Confirmed. You have received Ksh2,000.00 from FAITH ACHIENG 254712345673 on 4/8/26 at 8:47 AM. New M-PESA balance is Ksh22,450.00.
RJ45J1K2L3 Confirmed. Ksh1,000.00 received from UNKNOWN SENDER 254799999999 on 5/8/26 at 3:30 PM. Account Number CHAMA. New Utility balance is Ksh23,450.00.
"""


def seed():
    app = create_app()
    with app.app_context():
        db.drop_all()
        db.create_all()

        treasurer = User(
            email="treasurer@hesabu.local",
            full_name="Ann Njoki",
            phone="254712345670",
            password_hash=bcrypt.hashpw(b"treasurer123", bcrypt.gensalt()).decode("utf-8"),
        )
        db.session.add(treasurer)
        db.session.flush()

        group = Group(
            id=str(uuid.uuid4()),
            name="Umoja Chama",
            currency="KES",
            contribution_amount_cents=200000,
            contribution_frequency="monthly",
            created_by=treasurer.id,
        )
        db.session.add(group)
        db.session.flush()

        db.session.add(
            GroupMember(
                group_id=group.id,
                user_id=treasurer.id,
                full_name=treasurer.full_name,
                phone=treasurer.phone,
                role="treasurer",
                status="active",
                joined_at=datetime.utcnow() - timedelta(days=90),
            )
        )

        member_rows = []
        for i, spec in enumerate(MEMBERS):
            member = GroupMember(
                group_id=group.id,
                full_name=spec["name"],
                phone=spec["phone"],
                role="member",
                status="active",
                # stagger join dates so the arrears calc has something to show
                joined_at=datetime.utcnow() - timedelta(days=90 - i * 10),
            )
            db.session.add(member)
            member_rows.append(member)
        db.session.flush()

        # One manually-recorded cash contribution, so both entry paths have data.
        db.session.add(
            Contribution(
                group_id=group.id,
                group_member_id=member_rows[-1].id,
                amount_cents=200000,
                method="cash",
                contributed_at=datetime.utcnow() - timedelta(days=20),
                match_confidence="manual",
                recorded_by=treasurer.id,
            )
        )

        from server.services.mpesa_parser import parse_mpesa_text

        parsed, _unparsed = parse_mpesa_text(RAW_MPESA_TEXT)
        members_by_phone = {m.phone: m for m in member_rows}
        for row in parsed:
            member = members_by_phone.get(row["phone"])
            db.session.add(
                Contribution(
                    group_id=group.id,
                    group_member_id=member.id if member else None,
                    amount_cents=row["amount_cents"],
                    method="mpesa",
                    mpesa_code=row["code"],
                    contributed_at=row["contributed_at"],
                    raw_text=row["raw_text"],
                    match_confidence="auto" if member else "unmatched",
                    recorded_by=treasurer.id,
                )
            )

        db.session.commit()

        print("Seed data created successfully")
        print(f"  Group: {group.name} ({len(member_rows)} members + 1 treasurer)")
        print("Treasurer: treasurer@hesabu.local / treasurer123")


if __name__ == "__main__":
    seed()
