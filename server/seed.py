"""Demo data.

Builds several chamas across the theme range, each with its own treasurer, member
roster and contribution history. The goal is a database where every state the UI
can render actually occurs somewhere: fully collected and badly behind, matched
and unmatched payments, resolved rows, inactive members, and a group with no
contributions at all.

Run with: PYTHONPATH=. python server/seed.py
"""

import random
import uuid
from datetime import datetime, timedelta

import bcrypt

from server.app import create_app
from server.extensions import db
from server.models import Contribution, Group, GroupMember, User
from server.services.mpesa_parser import parse_mpesa_text

PASSWORD = "hesabu123"

# Every chama gets its own treasurer so the demo can show more than one person's
# view; they all share a password to keep the demo instructions short.
CHAMAS = [
    {
        "name": "Umoja Chama",
        "theme": "harambee",
        "amount": 200000,
        "frequency": "monthly",
        "treasurer": ("treasurer@hesabu.local", "Ann Njoki", "254712345670"),
        "members": [
            ("Grace Wanjiru", "254712345671"),
            ("Peter Kamau", "254712345672"),
            ("Faith Achieng", "254712345673"),
            ("Daniel Mutiso", "254712345674"),
            ("Mercy Chebet", "254712345675"),
        ],
        "age_days": 150,
        # Fraction of the schedule each member has actually paid, by index.
        "paid_ratio": [1.0, 0.75, 0.75, 0.0, 0.5],
        "unmatched": 1,
    },
    {
        "name": "Mama Mboga Savings",
        "theme": "mboga",
        "amount": 50000,
        "frequency": "weekly",
        "treasurer": ("mboga@hesabu.local", "Esther Wambui", "254720100000"),
        "members": [
            ("Jane Nyambura", "254720100001"),
            ("Rose Atieno", "254720100002"),
            ("Alice Muthoni", "254720100003"),
            ("Beatrice Adhiambo", "254720100004"),
            ("Lucy Kavata", "254720100005"),
            ("Sarah Chepkoech", "254720100006"),
        ],
        "age_days": 84,
        "paid_ratio": [1.0, 1.0, 0.9, 1.0, 0.6, 1.0],
        "unmatched": 2,
    },
    {
        "name": "Boda Riders SACCO",
        "theme": "boda",
        "amount": 100000,
        "frequency": "weekly",
        "treasurer": ("boda@hesabu.local", "Kevin Otieno", "254733200000"),
        "members": [
            ("Brian Kiptoo", "254733200001"),
            ("Samuel Njoroge", "254733200002"),
            ("Dennis Omondi", "254733200003"),
            ("Victor Maina", "254733200004"),
        ],
        "age_days": 63,
        "paid_ratio": [0.4, 0.3, 0.6, 0.2],
        "unmatched": 1,
    },
    {
        "name": "Shule Fees Fund",
        "theme": "shule",
        "amount": 500000,
        "frequency": "monthly",
        "treasurer": ("shule@hesabu.local", "Margaret Auma", "254741300000"),
        "members": [
            ("Joseph Mwangi", "254741300001"),
            ("Caroline Jepkorir", "254741300002"),
            ("Patrick Ochieng", "254741300003"),
            ("Naomi Wairimu", "254741300004"),
            ("Elijah Barasa", "254741300005"),
        ],
        "age_days": 120,
        "paid_ratio": [1.0, 1.0, 1.0, 1.0, 1.0],
        "unmatched": 0,
    },
    {
        "name": "Kilimo Growers",
        "theme": "kilimo",
        "amount": 150000,
        "frequency": "monthly",
        "treasurer": ("kilimo@hesabu.local", "John Kiprono", "254755400000"),
        "members": [
            ("Ruth Nasimiyu", "254755400001"),
            ("Simon Lekuraa", "254755400002"),
            ("Agnes Wangari", "254755400003"),
        ],
        "age_days": 95,
        "paid_ratio": [0.66, 1.0, 0.33],
        "unmatched": 0,
    },
    {
        "name": "Biashara Circle",
        "theme": "biashara",
        "amount": 300000,
        "frequency": "monthly",
        "treasurer": ("biashara@hesabu.local", "Hassan Abdi", "254766500000"),
        # A brand-new chama: roster set up, nothing collected yet. Exercises the
        # empty ledger and the zero-progress meter.
        "members": [
            ("Fatuma Noor", "254766500001"),
            ("Ibrahim Yusuf", "254766500002"),
        ],
        "age_days": 5,
        "paid_ratio": [0.0, 0.0],
        "unmatched": 0,
    },
]

# Real M-PESA wordings differ between P2P, till and paybill; the parser handles
# all three, so the demo data should contain all three.
TEMPLATES = [
    "{code} Confirmed. You have received Ksh{amount} from {name} {phone} on {date} at {time}. New M-PESA balance is Ksh{balance}.",
    "{code} Confirmed. Ksh{amount} received from {name} {phone} on {date} at {time}. Account Number CHAMA. New Utility balance is Ksh{balance}.",
]


def _code(rng):
    letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    digits = "0123456789"
    return "".join(rng.choice(letters + digits) for _ in range(10))


def _money(cents):
    return f"{cents / 100:,.2f}"


def _sms(rng, name, phone, cents, when):
    return TEMPLATES[rng.randrange(len(TEMPLATES))].format(
        code=_code(rng),
        amount=_money(cents),
        name=name.upper(),
        phone=phone,
        date=when.strftime("%-d/%-m/%y"),
        time=when.strftime("%-I:%M %p"),
        balance=_money(rng.randrange(500000, 5000000)),
    )


def _periods(frequency, age_days):
    """How many contribution periods have elapsed for a chama of this age."""
    span = 7 if frequency == "weekly" else 30
    return max(1, age_days // span)


def seed():
    app = create_app()
    with app.app_context():
        db.drop_all()
        db.create_all()

        # Fixed seed: the demo should look identical on every rebuild, otherwise
        # screenshots and support questions stop matching what people see.
        rng = random.Random(20260829)
        now = datetime.utcnow()
        created = []

        for spec in CHAMAS:
            email, full_name, phone = spec["treasurer"]
            treasurer = User(
                email=email,
                full_name=full_name,
                phone=phone,
                password_hash=bcrypt.hashpw(PASSWORD.encode(), bcrypt.gensalt()).decode("utf-8"),
            )
            db.session.add(treasurer)
            db.session.flush()

            group = Group(
                id=str(uuid.uuid4()),
                name=spec["name"],
                currency="KES",
                contribution_amount_cents=spec["amount"],
                contribution_frequency=spec["frequency"],
                theme=spec["theme"],
                created_by=treasurer.id,
            )
            db.session.add(group)
            db.session.flush()

            joined = now - timedelta(days=spec["age_days"])
            db.session.add(
                GroupMember(
                    group_id=group.id,
                    user_id=treasurer.id,
                    full_name=treasurer.full_name,
                    phone=treasurer.phone,
                    role="treasurer",
                    status="active",
                    joined_at=joined,
                )
            )

            members = []
            for i, (name, msisdn) in enumerate(spec["members"]):
                member = GroupMember(
                    group_id=group.id,
                    full_name=name,
                    phone=msisdn,
                    role="member",
                    status="active",
                    # Stagger joins so expected-vs-paid differs per member and the
                    # arrears view has a real spread rather than one repeated number.
                    joined_at=joined + timedelta(days=i * 2),
                )
                db.session.add(member)
                members.append(member)
            db.session.flush()

            periods = _periods(spec["frequency"], spec["age_days"])
            step = timedelta(days=7 if spec["frequency"] == "weekly" else 30)

            for i, member in enumerate(members):
                ratio = spec["paid_ratio"][i] if i < len(spec["paid_ratio"]) else 0.0
                for n in range(round(periods * ratio)):
                    when = joined + step * n + timedelta(hours=9 + rng.randrange(8))
                    if when > now:
                        break
                    # Most contributions arrive by M-PESA and match on phone; a few
                    # are cash the treasurer keyed in, and one per group is a row a
                    # treasurer manually linked after the parser couldn't.
                    roll = rng.random()
                    if roll < 0.12:
                        db.session.add(
                            Contribution(
                                group_id=group.id,
                                group_member_id=member.id,
                                amount_cents=spec["amount"],
                                method="cash",
                                contributed_at=when,
                                match_confidence="manual",
                                recorded_by=treasurer.id,
                            )
                        )
                        continue

                    text = _sms(rng, member.full_name, member.phone, spec["amount"], when)
                    parsed, _ = parse_mpesa_text(text)
                    if not parsed:
                        continue
                    row = parsed[0]
                    db.session.add(
                        Contribution(
                            group_id=group.id,
                            group_member_id=member.id,
                            amount_cents=row["amount_cents"],
                            method="mpesa",
                            mpesa_code=row["code"],
                            contributed_at=row["contributed_at"],
                            raw_text=row["raw_text"],
                            match_confidence="resolved" if roll > 0.94 else "auto",
                            recorded_by=treasurer.id,
                        )
                    )

            # Payments from numbers no member owns — the queue the treasurer works.
            for u in range(spec["unmatched"]):
                when = now - timedelta(days=2 + u * 3)
                stranger = f"2547{rng.randrange(10_000_000, 99_999_999)}"
                text = _sms(rng, "Unknown Sender", stranger, spec["amount"] // 2, when)
                parsed, _ = parse_mpesa_text(text)
                if not parsed:
                    continue
                row = parsed[0]
                db.session.add(
                    Contribution(
                        group_id=group.id,
                        group_member_id=None,
                        amount_cents=row["amount_cents"],
                        method="mpesa",
                        mpesa_code=row["code"],
                        contributed_at=row["contributed_at"],
                        raw_text=row["raw_text"],
                        match_confidence="unmatched",
                        recorded_by=treasurer.id,
                    )
                )

            created.append((group, len(members)))

        # One member who has left, so the inactive path is represented.
        db.session.flush()
        first_group = created[0][0]
        db.session.add(
            GroupMember(
                group_id=first_group.id,
                full_name="Joseph Kariuki",
                phone="254712345679",
                role="member",
                status="inactive",
                joined_at=now - timedelta(days=140),
            )
        )

        db.session.commit()

        print("Seed data created successfully\n")
        for group, count in created:
            n = Contribution.query.filter_by(group_id=group.id).count()
            unmatched = Contribution.query.filter_by(
                group_id=group.id, match_confidence="unmatched"
            ).count()
            print(
                f"  {group.name:22} theme={group.theme:9} "
                f"{count} members  {n} contributions  {unmatched} unmatched"
            )
        print(f"\nAll accounts use the password: {PASSWORD}")
        for spec in CHAMAS:
            print(f"  {spec['treasurer'][0]:26} {spec['name']}")


if __name__ == "__main__":
    seed()
