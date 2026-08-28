from server.tests.helpers import add_member, auth_headers, create_group, register_user


def test_add_manual_contribution(client):
    token, _ = register_user(client, "manual@example.com")
    group = create_group(client, token, amount_cents=200000)
    member = add_member(client, token, group["id"], phone="0722111222")

    resp = client.post(
        f"/api/v1/groups/{group['id']}/contributions",
        headers=auth_headers(token),
        json={
            "group_member_id": member["id"],
            "amount_cents": 200000,
            "method": "cash",
            "contributed_at": "2026-08-01T09:00:00",
        },
    )
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["amount_cents"] == 200000
    assert data["match_confidence"] == "manual"


def test_add_contribution_unknown_member(client):
    token, _ = register_user(client, "unknownmember@example.com")
    group = create_group(client, token)
    resp = client.post(
        f"/api/v1/groups/{group['id']}/contributions",
        headers=auth_headers(token),
        json={
            "group_member_id": "does-not-exist",
            "amount_cents": 200000,
            "contributed_at": "2026-08-01T09:00:00",
        },
    )
    assert resp.status_code == 404


def test_import_contributions_matches_and_flags_unmatched(client):
    token, _ = register_user(client, "importer@example.com")
    group = create_group(client, token, amount_cents=200000)
    add_member(client, token, group["id"], full_name="Grace Wanjiru", phone="254712345671")

    raw_text = (
        "QAR7A1B2C3 Confirmed. You have received Ksh2,000.00 from GRACE WANJIRU "
        "254712345671 on 3/8/26 at 9:15 AM. New M-PESA balance is Ksh18,450.00.\n"
        "RJ45D4E5F6 Confirmed. Ksh1,000.00 received from A STRANGER 254799999999 "
        "on 4/8/26 at 10:00 AM. Account Number CHAMA. New Utility balance is Ksh1.00.\n"
        "not a real message at all"
    )
    resp = client.post(
        f"/api/v1/groups/{group['id']}/contributions/import",
        headers=auth_headers(token),
        json={"raw_text": raw_text},
    )
    assert resp.status_code == 201
    data = resp.get_json()
    assert len(data["imported"]) == 2
    confidences = {row["match_confidence"] for row in data["imported"]}
    assert confidences == {"auto", "unmatched"}
    assert data["duplicate_count"] == 0
    assert data["unparsed"] == []


def test_import_contributions_skips_duplicate_mpesa_codes(client):
    token, _ = register_user(client, "dupimport@example.com")
    group = create_group(client, token)
    add_member(client, token, group["id"], full_name="Grace Wanjiru", phone="254712345671")

    raw_text = (
        "QAR7A1B2C3 Confirmed. You have received Ksh2,000.00 from GRACE WANJIRU "
        "254712345671 on 3/8/26 at 9:15 AM. New M-PESA balance is Ksh18,450.00."
    )
    client.post(
        f"/api/v1/groups/{group['id']}/contributions/import",
        headers=auth_headers(token),
        json={"raw_text": raw_text},
    )
    resp = client.post(
        f"/api/v1/groups/{group['id']}/contributions/import",
        headers=auth_headers(token),
        json={"raw_text": raw_text},
    )
    data = resp.get_json()
    assert len(data["imported"]) == 0
    assert data["duplicate_count"] == 1


def test_import_requires_treasurer(client):
    token_owner, _ = register_user(client, "owner4@example.com")
    token_other, _ = register_user(client, "other4@example.com")
    group = create_group(client, token_owner)
    resp = client.post(
        f"/api/v1/groups/{group['id']}/contributions/import",
        headers=auth_headers(token_other),
        json={"raw_text": "irrelevant"},
    )
    assert resp.status_code == 403


def test_resolve_unmatched_contribution(client):
    token, _ = register_user(client, "resolver@example.com")
    group = create_group(client, token)
    member = add_member(client, token, group["id"], full_name="Late Signup", phone="254712345671")

    raw_text = (
        "QAR7A1B2C3 Confirmed. You have received Ksh2,000.00 from LATE SIGNUP "
        "254799999999 on 3/8/26 at 9:15 AM. New M-PESA balance is Ksh18,450.00."
    )
    imported = client.post(
        f"/api/v1/groups/{group['id']}/contributions/import",
        headers=auth_headers(token),
        json={"raw_text": raw_text},
    ).get_json()["imported"][0]
    assert imported["match_confidence"] == "unmatched"

    resp = client.patch(
        f"/api/v1/groups/{group['id']}/contributions/{imported['id']}/resolve",
        headers=auth_headers(token),
        json={"group_member_id": member["id"]},
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["match_confidence"] == "resolved"
    assert data["group_member_id"] == member["id"]


def test_resolve_already_matched_contribution_rejected(client):
    token, _ = register_user(client, "resolvematched@example.com")
    group = create_group(client, token)
    member = add_member(client, token, group["id"], phone="0722111222")
    contribution = client.post(
        f"/api/v1/groups/{group['id']}/contributions",
        headers=auth_headers(token),
        json={
            "group_member_id": member["id"],
            "amount_cents": 200000,
            "method": "cash",
            "contributed_at": "2026-08-01T09:00:00",
        },
    ).get_json()

    resp = client.patch(
        f"/api/v1/groups/{group['id']}/contributions/{contribution['id']}/resolve",
        headers=auth_headers(token),
        json={"group_member_id": member["id"]},
    )
    assert resp.status_code == 400


def test_resolve_requires_treasurer(client):
    token_owner, _ = register_user(client, "owner6@example.com")
    token_other, _ = register_user(client, "other6@example.com")
    group = create_group(client, token_owner)
    resp = client.patch(
        f"/api/v1/groups/{group['id']}/contributions/does-not-exist/resolve",
        headers=auth_headers(token_other),
        json={"group_member_id": "irrelevant"},
    )
    assert resp.status_code == 403


def test_arrears_reflects_unpaid_members(client):
    token, _ = register_user(client, "arrears@example.com")
    group = create_group(client, token, amount_cents=200000, frequency="monthly")
    member = add_member(client, token, group["id"], full_name="Unpaid Member", phone="0722555666")

    resp = client.get(f"/api/v1/groups/{group['id']}/arrears", headers=auth_headers(token))
    assert resp.status_code == 200
    data = resp.get_json()
    unpaid = next(r for r in data if r["group_member_id"] == member["id"])
    assert unpaid["arrears_cents"] == 200000
    assert unpaid["paid_cents"] == 0


def test_arrears_zero_after_full_payment(client):
    token, _ = register_user(client, "paidup@example.com")
    group = create_group(client, token, amount_cents=200000, frequency="monthly")
    member = add_member(client, token, group["id"], full_name="Paid Member", phone="0722555667")

    client.post(
        f"/api/v1/groups/{group['id']}/contributions",
        headers=auth_headers(token),
        json={
            "group_member_id": member["id"],
            "amount_cents": 200000,
            "method": "cash",
            "contributed_at": "2026-08-01T09:00:00",
        },
    )

    resp = client.get(f"/api/v1/groups/{group['id']}/arrears", headers=auth_headers(token))
    data = resp.get_json()
    paid = next(r for r in data if r["group_member_id"] == member["id"])
    assert paid["arrears_cents"] == 0
