# Release Readiness Playbook

## 1. Environment Matrix
- **Local Development**
  - Frontend: `npm run dev` (Next.js 16) on `http://localhost:3000`
  - Backend: `python manage.py runserver 0.0.0.0:8000`
  - Environment variables (Backend):
    - `DEBUG=True`
    - `SECRET_KEY=<local-secret>`
    - `DATABASE_URL=sqlite:///db.sqlite3`
    - `CORS_ALLOWED_ORIGINS=http://localhost:3000`
  - تعبئة البيانات: `python manage.py seed_demo`
  - Environment variables (Frontend):
    - `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api`

- **Staging**
  - API deployed to managed PostgreSQL (DigitalOcean/Render) with Redis for Celery.
  - Media storage: BunnyCDN (or S3) bucket mounted at `/media/`.
  - Authentication: JWT hosted at `/api/auth/` (future SSO integration).

- **Production**
  - Suggested hosting: 
    - Frontend on Vercel
    - Backend on DigitalOcean App Platform / Render
    - PostgreSQL 15 + Managed Redis
  - Add HTTPS termination + WAF as per university policy.

## 2. Build & Deployment Steps
1. **Frontend**
   - `npm ci`
   - `npm run lint`
   - `npm run build`
   - Deploy artefact (Vercel or static export).

2. **Backend**
   - `pip install -r requirements.txt`
   - `python manage.py collectstatic --noinput`
   - `python manage.py migrate`
   - `python manage.py createsuperuser` (first run only)
   - `python manage.py check`
   - `python manage.py test`
   - Start services:
     - Gunicorn/Uvicorn: `gunicorn project.asgi:application -k uvicorn.workers.UvicornWorker`
     - Celery worker: `celery -A project worker -l INFO`
     - Celery beat (scheduled reports): `celery -A project beat -l INFO`

## 3. CI/CD Pipeline
- GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every PR/push:
  - Frontend lint via `npm run lint`.
  - Backend system checks & Django tests.
- Future enhancements:
  - Add Playwright smoke tests against deployed preview.
  - Publish coverage reports (Codecov).
  - Automated Docker image build & push.

## 4. Manual QA Checklist
- ✅ Submit each of the 11 service requests.
- ✅ Verify business card flow enforces mandatory attachment.
- ✅ Toggle approval policy (global vs selective) and confirm front-end reacts.
- ✅ Inventory adjustments trigger logs & status colour changes.
- ✅ Notification preferences opt-in/out reflected after API calls.
- ✅ Multi-role smoke test (admin / approver / staff / requester).

## 5. Observability & Monitoring
- Enable Django logging with `LOGGING` config (JSON + rotation).
- Configure application performance monitoring (e.g., Elastic APM, Sentry).
- Set Celery task monitoring via Flower or HealthChecks.
- Database backups: daily snapshots + PITR.
- CDN/Bucket object lifecycle rules (30-day retention for drafts).

## 6. Launch Checklist
- [ ] Domain + SSL certificate configured.
- [ ] Email service configured for notifications (SMTP or SendGrid).
- [ ] Admin accounts provisioned (Print Center leadership).
- [ ] Data seeding (`python manage.py loaddata seed_services.json`) for default services.
- [ ] Rollback plan documented (DB snapshot + release tags).
- [ ] Incident response playbook shared with IT operations.

## 7. Next Steps After Launch
- Hook Celery events to send notifications (email/SMS).
- Integrate university SSO (Azure AD) for authentication.
- Extend reporting endpoints with caching (Redis `reports_cache` table).
- Schedule monthly review of approval workflow efficiency.

