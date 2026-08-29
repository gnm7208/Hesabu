"""add group theme

Revision ID: b1f4c7d9e2a3
Revises: 8c0cc4ab7549
Create Date: 2026-08-29

Adds the per-group visual theme. server_default is set so the column can be NOT
NULL without a separate backfill — existing groups become "harambee", the neutral
default, rather than needing a nullable column and a client-side fallback.
"""

import sqlalchemy as sa
from alembic import op

revision = "b1f4c7d9e2a3"
down_revision = "8c0cc4ab7549"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "groups",
        sa.Column(
            "theme",
            sa.String(length=20),
            nullable=False,
            server_default="harambee",
        ),
    )


def downgrade():
    op.drop_column("groups", "theme")
