from server.tests.helpers import auth_headers, create_group, register_user


def test_create_group_makes_creator_treasurer(client):
    token, _ = register_user(client, "treasurer@example.com")
    group = create_group(client, token, name="Umoja Chama")
    assert group["name"] == "Umoja Chama"
    assert group["contribution_frequency"] == "monthly"

    members_resp = client.get(f"/api/v1/groups/{group['id']}/members", headers=auth_headers(token))
    members = members_resp.get_json()
    assert len(members) == 1
    assert members[0]["role"] == "treasurer"


def test_list_groups_only_shows_mine(client):
    token_a, _ = register_user(client, "a@example.com")
    token_b, _ = register_user(client, "b@example.com")
    create_group(client, token_a, name="A's Chama")

    resp = client.get("/api/v1/groups", headers=auth_headers(token_b))
    assert resp.get_json() == []

    resp = client.get("/api/v1/groups", headers=auth_headers(token_a))
    data = resp.get_json()
    assert len(data) == 1
    assert data[0]["name"] == "A's Chama"


def test_get_group_not_found(client):
    token, _ = register_user(client, "getter@example.com")
    resp = client.get("/api/v1/groups/does-not-exist", headers=auth_headers(token))
    assert resp.status_code == 404


def test_update_group_requires_treasurer(client):
    token_owner, _ = register_user(client, "owner@example.com")
    token_other, _ = register_user(client, "other@example.com")
    group = create_group(client, token_owner)

    resp = client.patch(
        f"/api/v1/groups/{group['id']}",
        headers=auth_headers(token_other),
        json={"name": "Hijacked"},
    )
    assert resp.status_code == 403


def test_update_group_success(client):
    token, _ = register_user(client, "updater@example.com")
    group = create_group(client, token)
    resp = client.patch(
        f"/api/v1/groups/{group['id']}",
        headers=auth_headers(token),
        json={"name": "Renamed Chama"},
    )
    assert resp.status_code == 200
    assert resp.get_json()["name"] == "Renamed Chama"


def test_create_group_requires_auth(client):
    resp = client.post("/api/v1/groups", json={"name": "No Auth"})
    assert resp.status_code == 401
