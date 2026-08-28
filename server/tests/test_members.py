from server.tests.helpers import add_member, auth_headers, create_group, register_user


def test_add_member_success(client):
    token, _ = register_user(client, "treasurer@example.com")
    group = create_group(client, token)
    member = add_member(client, token, group["id"], full_name="Grace Wanjiru", phone="0722111222")
    assert member["full_name"] == "Grace Wanjiru"
    assert member["phone"] == "254722111222"
    assert member["role"] == "member"


def test_add_member_invalid_phone(client):
    token, _ = register_user(client, "badphone@example.com")
    group = create_group(client, token)
    resp = client.post(
        f"/api/v1/groups/{group['id']}/members",
        headers=auth_headers(token),
        json={"full_name": "Bad Phone", "phone": "12345"},
    )
    assert resp.status_code == 400


def test_add_member_duplicate_phone(client):
    token, _ = register_user(client, "dupphone@example.com")
    group = create_group(client, token)
    add_member(client, token, group["id"], phone="0722111222")
    resp = client.post(
        f"/api/v1/groups/{group['id']}/members",
        headers=auth_headers(token),
        json={"full_name": "Someone Else", "phone": "0722111222"},
    )
    assert resp.status_code == 409


def test_add_member_requires_treasurer(client):
    token_owner, _ = register_user(client, "owner2@example.com")
    token_other, _ = register_user(client, "other2@example.com")
    group = create_group(client, token_owner)
    resp = client.post(
        f"/api/v1/groups/{group['id']}/members",
        headers=auth_headers(token_other),
        json={"full_name": "Intruder", "phone": "0722333444"},
    )
    assert resp.status_code == 403


def test_list_members_requires_membership(client):
    token_owner, _ = register_user(client, "owner3@example.com")
    token_other, _ = register_user(client, "other3@example.com")
    group = create_group(client, token_owner)
    resp = client.get(f"/api/v1/groups/{group['id']}/members", headers=auth_headers(token_other))
    assert resp.status_code == 403


def test_update_member_status(client):
    token, _ = register_user(client, "statusupdater@example.com")
    group = create_group(client, token)
    member = add_member(client, token, group["id"])
    resp = client.patch(
        f"/api/v1/groups/{group['id']}/members/{member['id']}",
        headers=auth_headers(token),
        json={"status": "inactive"},
    )
    assert resp.status_code == 200
    assert resp.get_json()["status"] == "inactive"


def test_remove_member_sets_inactive(client):
    token, _ = register_user(client, "remover@example.com")
    group = create_group(client, token)
    member = add_member(client, token, group["id"])
    resp = client.delete(
        f"/api/v1/groups/{group['id']}/members/{member['id']}", headers=auth_headers(token)
    )
    assert resp.status_code == 200

    listing = client.get(
        f"/api/v1/groups/{group['id']}/members", headers=auth_headers(token)
    ).get_json()
    removed = next(m for m in listing if m["id"] == member["id"])
    assert removed["status"] == "inactive"


def test_update_member_not_found(client):
    token, _ = register_user(client, "notfound@example.com")
    group = create_group(client, token)
    resp = client.patch(
        f"/api/v1/groups/{group['id']}/members/does-not-exist",
        headers=auth_headers(token),
        json={"full_name": "Ghost"},
    )
    assert resp.status_code == 404
