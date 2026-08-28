from server.tests.helpers import auth_headers, register_user


def test_register_success(client):
    resp = client.post(
        "/api/v1/auth/register",
        json={"email": "ann@example.com", "password": "password123", "full_name": "Ann Njoki"},
    )
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["access_token"]
    assert data["user"]["email"] == "ann@example.com"


def test_register_duplicate_email(client):
    payload = {"email": "dup@example.com", "password": "password123", "full_name": "Dup User"}
    client.post("/api/v1/auth/register", json=payload)
    resp = client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 409


def test_register_short_password_rejected(client):
    resp = client.post(
        "/api/v1/auth/register",
        json={"email": "short@example.com", "password": "abc", "full_name": "Short Pw"},
    )
    assert resp.status_code == 500
    assert "error" in resp.get_json()


def test_login_success(client):
    client.post(
        "/api/v1/auth/register",
        json={"email": "login@example.com", "password": "password123", "full_name": "Login User"},
    )
    resp = client.post(
        "/api/v1/auth/login", json={"email": "login@example.com", "password": "password123"}
    )
    assert resp.status_code == 200
    assert resp.get_json()["access_token"]


def test_login_wrong_password(client):
    client.post(
        "/api/v1/auth/register",
        json={"email": "wrongpw@example.com", "password": "password123", "full_name": "User"},
    )
    resp = client.post(
        "/api/v1/auth/login", json={"email": "wrongpw@example.com", "password": "nope12345"}
    )
    assert resp.status_code == 401


def test_get_me_requires_auth(client):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401


def test_get_me_success(client):
    token, _ = register_user(client, "me@example.com")
    resp = client.get("/api/v1/auth/me", headers=auth_headers(token))
    assert resp.status_code == 200
    assert resp.get_json()["email"] == "me@example.com"


def test_logout(client):
    token, _ = register_user(client, "logout@example.com")
    resp = client.post("/api/v1/auth/logout", headers=auth_headers(token))
    assert resp.status_code == 200
