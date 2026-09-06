# Sales CRM --- Development Plan

## 1. Development Strategy

The project was built incrementally in dependency order:

1.  Initialize the repository.
2.  Create the React client.
3.  Create the Express API.
4.  Connect the client and server.
5.  Add PostgreSQL/Prisma persistence.
6.  Implement authentication and authorization.
7.  Implement company and deal functionality.
8.  Add server-side filtering/pagination.
9.  Add lifecycle rules and company archiving.
10. Add deal collaborators.
11. Prepare documentation and submission artifacts.

The implementation was intentionally kept incremental so changes could
be committed and reviewed independently.

------------------------------------------------------------------------

## 2. Git-Based Implementation History

### Milestone 1 --- Project initialization

``` text
4db8b80 chore: Initialize project
```

Date:

``` text
2026-08-30
```

### Milestone 2 --- React frontend

``` text
464bec4 feat: setupt React frontend
```

Work: - React/Vite frontend setup.

### Milestone 3 --- Express backend

``` text
49d8f14 feat: setup Express backend
```

Work: - Express server foundation.

### Milestone 4 --- Frontend/backend integration

``` text
3958a1e feat: connect frontend to backend
```

Work: - Connected React to Express APIs.

### Milestone 5 --- Prisma and company CRUD

``` text
14bd986 feat: add Prisma database setup and Company CRUD API
```

Work: - PostgreSQL/Prisma setup. - Initial relational models. - Company
CRUD.

### Milestone 6 --- Authentication and filtering

``` text
b7cbfe9 Complete CRM authentication pipeline and filters
c3fb259 Add JWT authentication foundation
```

Work: - JWT authentication. - Password hashing. - Role authorization. -
Server-side list filtering.

### Milestone 7 --- Lifecycle, archive and pagination

``` text
09d7f47 feat: add deal lifecycle rules, company archiving, and pagination fixes
```

Work: - Lifecycle validation. - Backward-stage reasons. - Closed-deal
behavior. - Manager reopen. - Company archive/restore. - Pagination
corrections.

### Milestone 8 --- Deployment preparation

``` text
00b56bf prepare project for deployment
```

Work: - Deployment-related project configuration. - Environment-based
API configuration. - Prisma 7 deployment configuration.

A subsequent push to the remote `main` branch was also performed during
deployment preparation.

### Milestone 9 --- Deal collaborators

``` text
046ab9c feat: add deal collaborators model
```

Work: - `DealCollaborator` Prisma model. - Migration. - Collaborator API
feature. - Ownership/collaboration access checks. - Safe owner-user
response selection.

The current working tree also contains the React collaborator panel
integration and UI styling work performed after this model/API
milestone.

------------------------------------------------------------------------

## 3. Current Functional Status

  Requirement area                    Status
  ----------------------------------- -----------------------
  Login/authentication                Implemented
  Roles                               Implemented
  Companies CRUD                      Implemented
  Company archive/restore             Implemented
  Deals CRUD                          Implemented
  Server-side deal search             Implemented
  Server-side filters                 Implemented
  Server-side sorting                 Implemented
  Pagination with totals              Implemented
  Lifecycle validation                Implemented
  Backward reason                     Implemented
  Manager reopen                      Implemented
  Deal collaborators                  Implemented
  Collaborator-aware sales access     Implemented
  Basic dashboard/pipeline            Implemented
  Full required analytics dashboard   Not fully implemented
  Immutable timeline/history          Not implemented
  Bulk reassignment                   Not implemented
  Bulk stage advancement              Not implemented
  CSV export                          Not implemented
  Past-due alerts                     Not implemented
  Complete permission alignment       Requires final audit
  Automated test suite                Not yet established

------------------------------------------------------------------------

## 4. Why the Implementation Order Was Used

### Authentication before protected business functionality

The API needs a trusted user identity before enforcing ownership and
role rules.

### Database before advanced deal behavior

Lifecycle, company/deal relationships and collaborators depend on
persistent relational state.

### Server-side filtering

The assignment explicitly requires server-side search, filters, sorting
and pagination, so those operations were kept in the API rather than
implemented only in React.

### Lifecycle on the server

A browser-only lifecycle implementation can be bypassed by direct API
requests. The backend therefore validates allowed transitions and
reasons.

### Collaborators after ownership/access foundations

Collaborators change who can view/update a deal. The feature was added
after the base owner-based access model was established.

------------------------------------------------------------------------

## 5. Time/Estimate Reporting

Exact task-level hours were not maintained in the repository.

The Git commit timestamps show implementation milestones, but they do
not establish actual hours spent.

Therefore, this document does not invent estimated-versus-actual hours.

If the submission explicitly requires a time sheet, only real recorded
time should be entered.

------------------------------------------------------------------------

## 6. Remaining Work If Development Continues

Recommended next order:

1.  Final security/permission audit.
2.  Complete server-side dashboard analytics.
3.  Add immutable deal history.
4.  Add bulk reassignment and bulk stage advancement.
5.  Add CSV export.
6.  Add past-due alerts and dismissal/reappearance logic.
7.  Add automated API tests.
8.  Add final demo data.
9.  Run production build/deployment smoke tests.
10. Finalize submission documentation.

------------------------------------------------------------------------

## 7. Definition of Done for Final Submission

Before calling the project complete:

-   Frontend production build passes.
-   Backend TypeScript/build passes.
-   Database migrations apply cleanly.
-   Seed data works.
-   Login works with demo credentials.
-   Role restrictions are verified through direct API calls as well as
    UI.
-   Collaborator access is tested with owner, collaborator and unrelated
    sales users.
-   Lifecycle edge cases are tested.
-   Deployment environment variables are configured.
-   No secrets are committed.
-   Required documentation files exist with the exact required names.
-   README/submission instructions point to the correct deployed
    application.
