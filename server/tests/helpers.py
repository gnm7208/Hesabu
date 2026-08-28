"""Shared auth/fixture helpers for route tests — not a test file itself (no test_
functions), imported by the domain test files."""


def register_user(client, email, password="password123", full_name="Test User", phone=None):
    payload = {"email": email, "password": password, "full_name": full_name}
    if phone:
        payload["phone"] = phone
    resp = client.post("/api/v1/auth/register", json=payload)
    data = resp.get_json()
    return data["access_token"], data["user"]["id"]


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def create_group(client, token, name="Test Chama", amount_cents=100000, frequency="monthly"):
    resp = client.post(
        "/api/v1/groups",
        headers=auth_headers(token),
        json={
            "name": name,
            "contribution_amount_cents": amount_cents,
            "contribution_frequency": frequency,
        },
    )
    return resp.get_json()


def add_member(client, token, group_id, full_name="Member One", phone="0722000001", role="member"):
    resp = client.post(
        f"/api/v1/groups/{group_id}/members",
        headers=auth_headers(token),
        json={"full_name": full_name, "phone": phone, "role": role},
    )
    return resp.get_json()
