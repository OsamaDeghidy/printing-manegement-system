# Taibah Print Center – Backend Architecture

## 1. Technology Stack
- `Django 4.2` + `Django REST Framework` for the API layer.
- JWT Authentication provided by `djangorestframework-simplejwt`.
- `django-environ` for environment-driven configuration.
- `drf-spectacular` for OpenAPI schema and interactive docs.
- `django-filter` for query filtering and search.
- `Celery` + `Redis` planned for future background jobs (notifications, reports).
- Primary database target: PostgreSQL 15 (configurable through `DATABASE_URL`).

## 2. Installed Apps Overview
- `accounts` — Custom user model, roles (admin, approver, staff, inventory, requester).
- `catalog` — Service catalogue, dynamic form fields, pricing tables.
- `orders` — Order lifecycle, field responses, approvals, attachments, status logs.
- `inventory` — Stock items, movement logs, reorder workflow.
- `notifications` — In-app notifications & user preferences.
- `system` — Global settings, approval policy toggle, audit trail.

## 3. Data Model Highlights
### accounts.User
- Email-based login via custom manager.
- Roles: `admin`, `approver`, `staff`, `inventory`, `requester`.
- Extra attributes: `full_name`, `department`, `phone_number`.

### catalog.Service & related entities
- `Service`: category, activation flag, `requires_approval`.
- `ServiceField`: dynamic form fields with type (`text`, `number`, `radio`, `file`, `textarea`, `link`), ordering, visibility, config JSON.
- `ServiceFieldOption`: radio choices with activation toggle.
- `ServicePricing`: internal vs. external cost for ROI calculations.

### orders domain
- `Order`: UUID PK + generated `order_code` (`TP-YYMMDD-XXXX`), status machine, priority, `current_approver`, timestamps.
- `OrderFieldValue`: JSON payload storing user responses keyed to `ServiceField`.
- `OrderAttachment`: file or link with audit info.
- `OrderApproval`: multi-step approval with decision + comments.
- `OrderStatusLog`: immutable history for transparency/compliance.

### inventory & procurement
- `InventoryItem`: thresholds, status indicator (`critical`, `warning`, `ok`).
- `InventoryLog`: additive/subtractive/absolute adjustments.
- `ReorderRequest`: approval workflow for restocking, integrates with logs.

### notifications & preferences
- `Notification`: typed messages (order status, approval, inventory, system).
- `NotificationPreference`: opt-in/out flags for each channel.

### system settings
- `SystemSetting`: key/value JSON store for configurable toggles.
- `ApprovalPolicy`: global/ selective approval enforcement.
- `AuditLog`: immutable system change log.

## 4. REST API Surface (rooted at `/api/`)
| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/accounts/users/` | `GET, POST, PATCH` | Admin user management |
| `/catalog/services/` | `CRUD` | Manage print services |
| `/catalog/service-fields/` | `CRUD` | Configure form fields per service |
| `/catalog/service-pricing/` | `CRUD` | Maintain internal/external prices |
| `/orders/orders/` | `GET, POST, PATCH` | Submit & manage orders |
| `/orders/orders/{id}/submit/` | `POST` | Move draft → pending |
| `/orders/orders/{id}/approve/` | `POST` | Approver decision |
| `/orders/orders/{id}/reject/` | `POST` | Reject request |
| `/orders/orders/{id}/update-status/` | `POST` | Production status updates |
| `/orders/orders/{id}/attach/` | `POST` | Upload file or add link |
| `/inventory/items/` | `CRUD` | Inventory master data |
| `/inventory/items/{id}/adjust/` | `POST` | Adjust stock level |
| `/inventory/logs/` | `GET` | View movement history |
| `/inventory/reorders/` | `CRUD` | Manage procurement requests |
| `/inventory/reorders/{id}/approve/` | `POST` | Approve reorder |
| `/inventory/reorders/{id}/mark_received/` | `POST` | Close reorder |
| `/notifications/notifications/` | `GET, PATCH` | Notifications inbox |
| `/notifications/notifications/{id}/mark_read/` | `POST` | Mark item read |
| `/notifications/notifications/mark_all_as_read/` | `POST` | Bulk mark |
| `/notifications/notification-preferences/` | `GET, PATCH` | User preferences |
| `/system/settings/` | `GET, POST, PATCH` | Admin system settings |
| `/system/approval-policy/` | `GET, PATCH` | Toggle approval strategy |
| `/system/audit-log/` | `GET` | Security/compliance log |
| `/schema/`, `/docs/` | `GET` | OpenAPI schema & Swagger UI |

All endpoints secured by JWT; catalogue/services read/update requires `IsSystemAdmin`, orders default to requester ownership with approvals restricted to approvers.

## 5. Security & Permissions
- Global `IsAuthenticated` default; role-based gatekeeping via custom permissions (`IsSystemAdmin`, `IsApprover`).
- Approval endpoints restricted to assigned approvers.
- Inventory & system configuration locked behind admin role.
- Audit log + order status log ensure traceability for compliance.

## 6. Files & Storage
- Upload path pattern: `media/orders/{order_code}/filename`.
- Default local storage with option to point to BunnyCDN/S3 later (configure `MEDIA_URL`/`MEDIA_ROOT`).

## 7. Configuration & Environment
- `.env` driven: `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `DATABASE_URL`, `CORS_ALLOWED_ORIGINS`.
- Static files collected under `staticfiles/`.
- Locale defaults: `LANGUAGE_CODE = "ar"`, `TIME_ZONE = "Asia/Riyadh"`.

## 8. Next Steps
- Implement Celery tasks for async notifications and scheduled reports.
- Add unit/integration tests (`pytest-django`) per app.
- Integrate role-based admin dashboards (Django admin custom actions).
- Wire up signal handlers to broadcast notifications on order status changes.

