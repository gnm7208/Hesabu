from server.tests.helpers import add_member, auth_headers, create_group, register_user


def test_generate_statement_summarizes_period(client):
    token, _ = register_user(client, "statement@example.com")
    group = create_group(client, token, amount_cents=200000, frequency="monthly")
    member = add_member(client, token, group["id"], full_name="Grace Wanjiru", phone="0722111222")

    # The auto-created treasurer membership is also an active member expected to
    # contribute, so pay for both to exercise a clean (no-arrears) statement.
    members = client.get(
        f"/api/v1/groups/{group['id']}/members", headers=auth_headers(token)
    ).get_json()
    for m in members:
        client.post(
            f"/api/v1/groups/{group['id']}/contributions",
            headers=auth_headers(token),
            json={
                "group_member_id": m["id"],
                "amount_cents": 200000,
                "method": "cash",
                "contributed_at": "2026-08-15T09:00:00",
            },
        )

    resp = client.post(
        f"/api/v1/groups/{group['id']}/statements",
        headers=auth_headers(token),
        json={"period_start": "2026-08-01", "period_end": "2026-08-31"},
    )
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["summary"]["total_collected_cents"] == 400000
    paid_for_grace = next(
        p for p in data["summary"]["per_member"] if p["group_member_id"] == member["id"]
    )
    assert paid_for_grace["paid_cents"] == 200000
    assert data["summary"]["arrears"] == []


def test_generate_statement_requires_treasurer(client):
    token_owner, _ = register_user(client, "owner5@example.com")
    token_other, _ = register_user(client, "other5@example.com")
    group = create_group(client, token_owner)
    resp = client.post(
        f"/api/v1/groups/{group['id']}/statements",
        headers=auth_headers(token_other),
        json={"period_start": "2026-08-01", "period_end": "2026-08-31"},
    )
    assert resp.status_code == 403


def test_list_and_get_statement(client):
    token, _ = register_user(client, "listing@example.com")
    group = create_group(client, token)
    created = client.post(
        f"/api/v1/groups/{group['id']}/statements",
        headers=auth_headers(token),
        json={"period_start": "2026-08-01", "period_end": "2026-08-31"},
    ).get_json()

    list_resp = client.get(f"/api/v1/groups/{group['id']}/statements", headers=auth_headers(token))
    assert len(list_resp.get_json()) == 1

    get_resp = client.get(
        f"/api/v1/groups/{group['id']}/statements/{created['id']}", headers=auth_headers(token)
    )
    assert get_resp.status_code == 200
    assert get_resp.get_json()["id"] == created["id"]


def test_get_statement_not_found(client):
    token, _ = register_user(client, "notfoundstatement@example.com")
    group = create_group(client, token)
    resp = client.get(
        f"/api/v1/groups/{group['id']}/statements/does-not-exist", headers=auth_headers(token)
    )
    assert resp.status_code == 404
