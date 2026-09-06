# Sales CRM --- Submission Notes

## Project

Sales CRM take-home assignment.

## Technology

-   React 19
-   TypeScript
-   Vite
-   Express 5
-   Prisma 7
-   PostgreSQL
-   JWT
-   bcryptjs

## Implemented Highlights

-   Authentication and role-based access
-   Company CRUD and archive/restore
-   Deal CRUD
-   Server-side search, filtering, sorting and pagination
-   Deal lifecycle validation
-   Manager reopen for closed deals
-   Deal collaborators with owner/manager/admin management
-   Collaborator-aware sales-representative access
-   Dashboard/pipeline view

## Demo Credentials

Use the credentials configured in the project seed/environment.

Do not commit production secrets or private credentials to the
repository.

## Deployment

Add the final deployed frontend URL here:

``` text
<DEPLOYED_FRONTEND_URL>
```

Add the backend URL here if the submission instructions require it:

``` text
<DEPLOYED_BACKEND_URL>
```

## Known Scope Boundary

The current implementation does not claim the following as complete:

-   Immutable history/timeline
-   Bulk reassignment
-   Bulk stage advancement
-   CSV export
-   Past-due alerts
-   Full server-side analytics dashboard

These should only be marked complete if they are actually implemented
and verified in the submitted repository.

## Final Verification Checklist

-   [ ] Frontend build passes
-   [ ] Backend build/type-check passes
-   [ ] Database migration succeeds
-   [ ] Seed succeeds
-   [ ] Login works
-   [ ] Company CRUD works
-   [ ] Deal CRUD works
-   [ ] Lifecycle rules work
-   [ ] Collaborator add/remove works
-   [ ] Collaborator access works
-   [ ] Unauthorized sales access is rejected
-   [ ] Production deployment works
-   [ ] No secrets are committed
-   [ ] Required docs are present
