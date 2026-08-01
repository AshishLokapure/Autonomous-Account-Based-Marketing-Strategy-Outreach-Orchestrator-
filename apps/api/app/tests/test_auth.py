"""Tests for authentication endpoints."""


def test_register_creates_user(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Jane Doe",
            "email": "jane@example.com",
            "password": "supersecret123",
            "role": "marketing_manager",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "jane@example.com"
    assert body["role"] == "marketing_manager"
    assert "password" not in body
    assert "password_hash" not in body


def test_register_duplicate_email_conflicts(client, registered_user):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Another User",
            "email": registered_user["email"],
            "password": "anotherpassword1",
        },
    )
    assert response.status_code == 409
    assert response.json() == {
        "success": False,
        "message": "A user with this email already exists",
    }


def test_register_rejects_short_password(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"full_name": "Jane Doe", "email": "jane@example.com", "password": "short"},
    )
    assert response.status_code == 422
    assert response.json()["success"] is False


def test_login_returns_token(client, registered_user):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": registered_user["email"], "password": registered_user["password"]},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["email"] == registered_user["email"]


def test_login_wrong_password_unauthorized(client, registered_user):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": registered_user["email"], "password": "wrongpassword1"},
    )
    assert response.status_code == 401
    assert response.json() == {"success": False, "message": "Invalid credentials"}


def test_me_returns_current_user(client, registered_user):
    login = client.post(
        "/api/v1/auth/login",
        data={"username": registered_user["email"], "password": registered_user["password"]},
    )
    token = login.json()["access_token"]

    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == registered_user["email"]


def test_me_requires_token(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_rbac_blocks_non_admin_from_user_list(client, registered_user):
    login = client.post(
        "/api/v1/auth/login",
        data={"username": registered_user["email"], "password": registered_user["password"]},
    )
    token = login.json()["access_token"]

    # registered_user has role account_executive — not allowed to list users
    response = client.get("/api/v1/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


def test_rbac_allows_admin_to_list_users(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Admin User",
            "email": "admin@example.com",
            "password": "adminpassword1",
            "role": "admin",
        },
    )
    login = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@example.com", "password": "adminpassword1"},
    )
    token = login.json()["access_token"]

    response = client.get("/api/v1/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert len(response.json()) == 1
