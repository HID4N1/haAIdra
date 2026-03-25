# Users & Auth API

All endpoints are prefixed with `/api/v1/`.

## Auth

### `POST /auth/register/`

Create a new user account.

Request (`application/json`):

```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!",
  "password2": "StrongPassword123!",
  "phone": "string (optional)",
  "role": "admin|manager|qa_supervisor|agent (optional; for anonymous calls the server forces `agent`)",
  "company_id": "uuid (optional)"
}
```

Response `201`:

```json
{
  "user": {
    "id": "uuid",
    "email": "string",
    "role": "agent|manager|qa_supervisor|admin",
    "phone": "string",
    "avatar": "string",
    "is_active": true,
    "two_fa_enabled": false,
    "last_login": "datetime|null",
    "company": { "id": "uuid", "name": "string", "plan": "free|pro|enterprise" },
    "created_at": "datetime",
    "updated_at": "datetime"
  },
  "access_token": "string",
  "refresh_token": "string"
}
```

### `POST /auth/login/`

Login using email/password.

Request (`application/json`):

```json
{ "email": "user@example.com", "password": "StrongPassword123!" }
```

Response `200`:

```json
{
  "user": { /* same shape as register */ },
  "access_token": "string",
  "refresh_token": "string"
}
```

### `POST /auth/refresh/`

Refresh JWT access token using a refresh token.

Request (`application/json`):

```json
{ "refresh_token": "string" }
```

Response `200`:

```json
{ "access_token": "string", "refresh_token": "string" }
```

### `POST /auth/logout/`

Logout (revokes the refresh token).

Request (`application/json`):

```json
{ "refresh_token": "string" }
```

Auth: requires `Authorization: Bearer <access_token>`.

Response `200`:

```json
{ "detail": "Logged out successfully." }
```

### `GET /auth/me/`

Get current authenticated user profile.

Response `200`:

```json
{ /* `UserSerializer` shape (same as register response `user`) */ }
```

### `PATCH /auth/me/`

Update the current user profile.

Request (`application/json`), partial:

```json
{
  "phone": "string (optional)",
  "avatar": "string (optional)"
}
```

Response `200`:

```json
{ /* `UserSerializer` shape */ }
```

### `POST /auth/me/password/`

Change password.

Request (`application/json`):

```json
{
  "old_password": "string",
  "new_password": "string",
  "new_password2": "string"
}
```

Response `200`:

```json
{ "detail": "Password updated successfully." }
```

## User/Agent/Company (CRUD + views)

List endpoints are tenant-scoped (unless stated otherwise) and use pagination (`page`, `page_size`).

### `GET /users/`

List users in the current company.

Query params:

- `role` (optional): `admin|manager|qa_supervisor|agent`

Response `200`: paginated list of users (`UserSerializer` shape).

### `GET /users/{user_id}/`

Get user detail.

Response `200`: `UserSerializer` shape.

### `PATCH /users/{user_id}/`

Update the user phone/avatar.

Request (`application/json`, partial):

```json
{ "phone": "string (optional)", "avatar": "string (optional)" }
```

Response `200`: updated fields only (`UserUpdateSerializer`):

```json
{ "phone": "string", "avatar": "string" }
```

### `PUT /users/{user_id}/`

Same request/response shape as `PATCH /users/{user_id}/`.

### `DELETE /users/{user_id}/`

Soft delete a user.

Response `204 No Content`.

### `GET /admin/users/`

Admin-only: list users across all companies.

Response `200`: paginated list of users.

### `GET /admin/users/{user_id}/`

Admin-only: get user detail across all tenants.

Response `200`: `UserAdminSerializer` shape (same visible fields as `UserSerializer`).

### `PATCH /admin/users/{user_id}/`

Admin-only: update a user (role/company/activation flags).

Request (`application/json`, partial):

```json
{
  "role": "admin|manager|qa_supervisor|agent (optional)",
  "phone": "string (optional)",
  "avatar": "string (optional)",
  "company_id": "uuid (optional)",
  "is_active": true,
  "two_fa_enabled": false
}
```

Response `200`: updated fields (user serializer shape).

### `PUT /admin/users/{user_id}/`

Same request/response shape as `PATCH /admin/users/{user_id}/`.

### `DELETE /admin/users/{user_id}/`

Admin-only: soft delete a user.

Response `204 No Content`.

### `GET /agents/`

List agents in the current company.

Query params:

- `status` (optional): `active|inactive`

Response `200`: paginated list of agents (`AgentSerializer` shape).

### `GET /agents/{agent_id}/`

Get agent detail.

Response `200`: `AgentSerializer` shape.

### `PATCH /agents/{agent_id}/`

Update agent profile fields.

Request (`application/json`, partial):

```json
{
  "department": "string (optional)",
  "hire_date": "date (YYYY-MM-DD, optional)",
  "status": "active|inactive (optional)",
  "coaching_notes": "string (optional)"
}
```

Response `200`: updated fields only (`AgentUpdateSerializer`):

```json
{
  "department": "string",
  "hire_date": "date|null",
  "status": "active|inactive",
  "coaching_notes": "string"
}
```

### `PUT /agents/{agent_id}/`

Same request/response shape as `PATCH /agents/{agent_id}/`.

### `DELETE /agents/{agent_id}/`

Soft delete an agent.

Response `204 No Content`.

### `PATCH /agents/{agent_id}/coaching/`

Manager can update coaching notes for an agent.

Request (`application/json`):

```json
{ "coaching_notes": "string (optional, replaces existing value if provided)" }
```

Response `200`: updated agent (`AgentSerializer` shape).

### `GET /companies/`

Admin-only: list companies (tenants).

Response `200`: paginated list of companies.

### `POST /companies/`

Admin-only: create a new tenant company.

Request (`application/json`):

```json
{
  "name": "string",
  "plan": "free|pro|enterprise",
  "is_active": true,
  "max_calls": 100,
  "max_users": 10,
  "storage_quota": 5120
}
```

Response `201`: created company (`CompanySerializer` shape).

### `GET /companies/{company_id}/`

Admin-only: get company detail.

Response `200`: `CompanySerializer` shape.

### `PATCH /companies/{company_id}/`

Admin-only: update company details.

Request (`application/json`, partial):

```json
{
  "name": "string (optional)",
  "plan": "free|pro|enterprise (optional)",
  "is_active": true,
  "max_calls": 100,
  "max_users": 10,
  "storage_quota": 5120
}
```

Response `200`: updated `CompanySerializer` shape.

### `PUT /companies/{company_id}/`

Same request/response shape as `PATCH /companies/{company_id}/`.

### `DELETE /companies/{company_id}/`

Admin-only: soft delete a company.

Response `204 No Content`.

### `GET /companies/{company_id}/scoring/`

Get the active per-company scoring configuration.

Response `200`:

```json
{
  "id": "uuid",
  "company": { "id": "uuid", "name": "string", "plan": "free|pro|enterprise" },
  "accueil_weight": 0.2,
  "empathie_weight": 0.2,
  "resolution_weight": 0.2,
  "langage_weight": 0.15,
  "conformite_weight": 0.15,
  "cloture_weight": 0.1,
  "is_active": true,
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### `PUT /companies/{company_id}/scoring/`

Replace scoring configuration (weights must sum to `1.0`).

Request (`application/json`):

```json
{
  "accueil_weight": 0.2,
  "empathie_weight": 0.2,
  "resolution_weight": 0.2,
  "langage_weight": 0.15,
  "conformite_weight": 0.15,
  "cloture_weight": 0.1,
  "is_active": true
}
```

### `PATCH /companies/{company_id}/scoring/`

Partially update scoring configuration (same weight-sum rule).

Response `200`: same shape as `GET /scoring/`.
