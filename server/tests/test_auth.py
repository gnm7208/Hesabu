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


def test_server_error_does_not_leak_internals_in_production(client, app, monkeypatch):
    """A 500 must never echo the exception text back to the client.

    SQLAlchemy errors embed the failing SQL and its bound parameters — including
    user email addresses — so returning str(exc) leaked schema and PII into the UI.
    """
    from server.services.auth_service import AuthService

    leaked_sql = "SELECT users.email FROM users WHERE users.email = 'victim@example.com'"

    def boom(*args, **kwargs):
        raise RuntimeError(f"(psycopg2.OperationalError) SSL closed [SQL: {leaked_sql}]")

    monkeypatch.setattr(AuthService, "login", boom)
    app.config["ENV"] = "production"

    resp = client.post("/api/v1/auth/login", json={"email": "a@b.com", "password": "x"})

    assert resp.status_code == 500
    body = resp.get_data(as_text=True)
    assert "SELECT" not in body
    assert "victim@example.com" not in body
    assert "psycopg2" not in body
    payload = resp.get_json()
    assert payload["message"] == "An unexpected error occurred."
    assert "detail" not in payload


def test_server_error_keeps_detail_outside_production(client, app, monkeypatch):
    from server.services.auth_service import AuthService

    def boom(*args, **kwargs):
        raise RuntimeError("something specific broke")

    monkeypatch.setattr(AuthService, "login", boom)
    app.config["ENV"] = "development"

    resp = client.post("/api/v1/auth/login", json={"email": "a@b.com", "password": "x"})

    assert resp.status_code == 500
    assert resp.get_json()["detail"] == "something specific broke"


def test_expired_token_is_rejected_with_readable_reason(client, app):
    """An expired token must fail with a message the client can show a user.

    flask-jwt-extended reports under `msg`, not `message`/`error`; the frontend
    only read the latter two, so every auth failure surfaced as the meaningless
    "Request failed (422)" instead of saying the session had expired.
    """
    import datetime

    from flask_jwt_extended import create_access_token

    token, _ = register_user(client, "expiry@example.com")
    with app.app_context():
        expired = create_access_token(
            identity="whoever", expires_delta=datetime.timedelta(seconds=-1)
        )

    resp = client.post(
        "/api/v1/groups",
        headers={"Authorization": f"Bearer {expired}"},
        json={"name": "Cousins", "contribution_amount_cents": 150000},
    )

    assert resp.status_code == 401
    body = resp.get_json()
    # Whatever the key, there must be a human-readable reason in the payload.
    assert any(k in body for k in ("msg", "message", "error"))
    assert "expired" in str(body).lower()
    assert token  # the valid token path is covered elsewhere
